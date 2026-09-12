package main

import (
	"context"
	"crypto/rand"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	inertia "github.com/mayahiro/go-inertia"

	"gocommerce/internal/config"
	"gocommerce/internal/db"
	"gocommerce/internal/handler"
	"gocommerce/internal/middleware"
	"gocommerce/internal/middleware/inertiamw"
	"gocommerce/internal/service"
	"gocommerce/internal/session"
	"gocommerce/internal/storage"
)

func main() {
	ctx := context.Background()

	cfg := config.Load()
	if err := cfg.Validate(); err != nil {
		log.Fatalf("configuration error: %v", err)
	}

	// --- Database ---
	pool, err := db.Connect(ctx, cfg.Database.URL)
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
	defer pool.Close()

	if err := db.MigrateSchema(ctx, pool); err != nil {
		log.Fatalf("migration failed: %v", err)
	}

	if os.Getenv("SEED") != "false" {
		if err := db.Seed(ctx, pool); err != nil {
			log.Printf("warning: seeding failed: %v", err)
		}
	}

	queries := db.New(pool)

	// --- Vite Asset Helper ---
	viteCfg := inertia.ViteConfig{
		ManifestPath: "public/build/.vite/manifest.json",
		PublicPath:   "/build",
		Entry:        "src/main.jsx",
		ReactRefresh: cfg.IsDevelopment(),
	}
	if cfg.IsDevelopment() {
		viteCfg.DevServerURL = "http://localhost:5173"
	}
	vite, err := inertia.NewVite(viteCfg)
	if err != nil {
		log.Printf("warning: could not initialize Vite asset helper (run 'npm run build' first): %v", err)
	}

	// --- Vite Render Option ---
	var defaultOpts []inertia.RenderOption
	if vite != nil {
		viteTags, err := vite.Tags()
		if err != nil {
			log.Printf("warning: could not generate Vite tags: %v", err)
		} else {
			defaultOpts = append(defaultOpts, inertia.WithViteTags(viteTags))
		}
	}

	// --- Session Store (Postgres-backed) ---
	store := session.New(pool)

	// --- Flash Store ---
	flashStore := inertia.NewMemoryFlashStore()

	// --- Services ---
	authService := service.NewAuthService(queries)
	cartService := service.NewCartService()
	settingsService := service.NewSettingsService(queries)
	couponService := service.NewCouponService(queries)
	orderService := service.NewOrderService(queries, cartService, settingsService, couponService)

	// --- Dynamic Shared Props ---
	shared := &inertiamw.DynamicSharedProps{
		AppName:    "GoCommerce",
		Store:      store,
		FlashStore: flashStore,
		Cart:       cartService,
		Settings:   settingsService,
	}

	// --- Inertia Renderer ---
	rootView, err := inertia.NewTemplateRootViewFromFile("frontend/index.html", "index.html")
	if err != nil {
		log.Fatalf("failed to load root view: %v", err)
	}

	renderer, err := inertia.New(inertia.Config{
		RootView:             rootView,
		SharedProps:          shared,
		FlashStore:           flashStore,
		DefaultRenderOptions: defaultOpts,
	})
	if err != nil {
		log.Fatalf("failed to create inertia renderer: %v", err)
	}

	// --- Handlers ---
	homeHandler := handler.Home(renderer, queries)
	authHandler := handler.NewAuthHandler(renderer, authService)
	productHandler := handler.NewProductHandler(renderer, queries, settingsService)
	categoryHandler := handler.NewCategoryHandler(renderer, queries, settingsService)
	collectionHandler := handler.NewCollectionHandler(renderer, queries, settingsService)
	cartHandler := handler.NewCartHandler(renderer, cartService, queries, couponService)
	checkoutHandler := handler.NewCheckoutHandler(renderer, orderService, settingsService, couponService)
	accountHandler := handler.NewAccountHandler(renderer, orderService, authService)
	adminHandler := handler.NewAdminHandler(renderer, queries, pool, settingsService)
	adminCouponHandler := handler.NewAdminCouponHandler(renderer, queries)
	adminCollectionHandler := handler.NewAdminCollectionHandler(renderer, queries, pool)
	adminAttributeHandler := handler.NewAdminAttributeHandler(renderer, queries, pool)
	adminOrderHandler := handler.NewAdminOrderHandler(renderer, queries, pool, settingsService)
	adminDashboardHandler := handler.NewAdminDashboardHandler(renderer, queries, settingsService)
	adminSettingsHandler := handler.NewAdminSettingsHandler(renderer, queries, settingsService, cfg)

	// --- Media Storage (Cloudflare R2 when configured, local disk otherwise) ---
	var mediaStore storage.Storage = storage.NewLocal()
	if cfg.R2Enabled() {
		mediaStore = storage.NewR2(cfg.R2.Endpoint, cfg.R2.AccessKey, cfg.R2.SecretKey, cfg.R2.Bucket, cfg.R2.PublicURL)
	}
	log.Printf("media storage: %s", mediaStore.Name())
	uploadHandler := handler.NewUploadHandler(mediaStore, cfg.Upload.MaxSize)

	// --- Router ---
	r := chi.NewRouter()

	// Global middleware
	r.Use(chimw.RealIP)
	r.Use(middleware.RequestLogger)
	r.Use(chimw.Recoverer)
	r.Use(middleware.SecurityHeaders)

	// Session middleware
	r.Use(session.Middleware(store))

	// CSRF: set XSRF-TOKEN cookie for Inertia requests
	r.Use(csrfMiddleware)

	// --- Health Check ---
	r.Get("/health", middleware.HealthCheck(func() error {
		return pool.Ping(ctx)
	}))

	// --- Static Files ---
	fileServer := http.FileServer(http.Dir("public"))
	r.Handle("/favicon.ico", fileServer)
	r.Handle("/robots.txt", fileServer)
	r.Handle("/build/*", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		fileServer.ServeHTTP(w, r)
	}))
	r.Handle("/uploads/*", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		fileServer.ServeHTTP(w, r)
	}))

	// --- Public Routes ---
	r.Get("/", homeHandler)

	// Guest-only routes (login/register)
	r.Group(func(r chi.Router) {
		r.Use(middleware.RequireGuest)
		r.Get("/login", authHandler.ShowLogin())
		r.Post("/login", authHandler.Login())
		r.Get("/register", authHandler.ShowRegister())
		r.Post("/register", authHandler.Register())
	})

	// Product catalog
	r.Get("/products", productHandler.Index())
	r.Get("/products/{slug}", productHandler.Show())

	// Categories
	r.Get("/categories", categoryHandler.Index())
	r.Get("/categories/{slug}", categoryHandler.Show())

	// Collections. A separate namespace from /categories, so no existing
	// category URL changes meaning.
	r.Get("/collections", collectionHandler.Index())
	r.Get("/collections/{slug}", collectionHandler.Show())

	// Cart
	r.Get("/cart", cartHandler.Show())
	r.Post("/cart/add", cartHandler.Add())
	r.Post("/cart/update", cartHandler.Update())
	r.Post("/cart/remove", cartHandler.Remove())
	r.Post("/cart/clear", cartHandler.Clear())

	// Coupons. Public like the rest of the cart: a coupon carrying a
	// per-customer limit is refused to guests by the engine, not by the route.
	r.Post("/cart/coupon", cartHandler.ApplyCoupon())
	r.Post("/cart/coupon/remove", cartHandler.RemoveCoupon())

	// --- Protected Routes ---
	r.Group(func(r chi.Router) {
		r.Use(middleware.RequireAuth)
		r.Post("/logout", authHandler.Logout())

		// Checkout
		r.Get("/checkout", checkoutHandler.Show())
		r.Post("/checkout", checkoutHandler.Process())
		r.Get("/checkout/confirmation/{id}", checkoutHandler.Confirmation())

		// Account
		r.Get("/account", accountHandler.Profile())
		r.Post("/account", accountHandler.UpdateProfile())
		r.Get("/account/orders", accountHandler.Orders())
		r.Get("/account/orders/{id}", accountHandler.OrderShow())
	})

	// --- Admin Routes ---
	r.Group(func(r chi.Router) {
		r.Use(middleware.RequireAdmin)
		// The dashboard lives in admin_dashboard.go, like orders in
		// admin_orders.go: it is the only screen that aggregates the whole
		// store, and that is one operational concern of its own.
		r.Get("/admin", adminDashboardHandler.Show())

		// Products
		r.Get("/admin/products", adminHandler.ListProducts())
		r.Get("/admin/products/create", adminHandler.CreateProduct())
		r.Post("/admin/products", adminHandler.StoreProduct())
		r.Get("/admin/products/{id}/edit", adminHandler.EditProduct())
		r.Post("/admin/products/{id}", adminHandler.UpdateProduct())
		r.Post("/admin/products/{id}/delete", adminHandler.DeleteProduct())

		// Product form support: media uploads and the attribute catalogue.
		// These two JSON endpoints back the product form's inline attribute
		// creator and predate the admin Attributes screens; they stay as they
		// are (see API_CONTRACT.md — they are not to become a REST API).
		r.Post("/admin/uploads", uploadHandler.Store())
		r.Post("/admin/attributes", adminHandler.StoreAttribute())
		r.Post("/admin/attributes/{id}/options", adminHandler.StoreAttributeOption())

		// Attributes. Inertia pages, deliberately on distinct paths from the two
		// JSON endpoints above so neither shadows the other.
		r.Get("/admin/attributes", adminAttributeHandler.List())
		r.Get("/admin/attributes/create", adminAttributeHandler.Create())
		r.Post("/admin/attributes/create", adminAttributeHandler.Store())
		r.Get("/admin/attributes/{id}/edit", adminAttributeHandler.Edit())
		r.Post("/admin/attributes/{id}/edit", adminAttributeHandler.Update())
		r.Post("/admin/attributes/{id}/delete", adminAttributeHandler.Delete())

		// Categories
		r.Get("/admin/categories", adminHandler.ListCategories())
		r.Get("/admin/categories/create", adminHandler.CreateCategory())
		r.Post("/admin/categories", adminHandler.StoreCategory())
		r.Get("/admin/categories/{id}/edit", adminHandler.EditCategory())
		r.Post("/admin/categories/{id}", adminHandler.UpdateCategory())
		r.Post("/admin/categories/{id}/delete", adminHandler.DeleteCategory())

		// Orders
		r.Get("/admin/orders", adminOrderHandler.List())
		r.Get("/admin/orders/{id}", adminOrderHandler.Show())
		r.Post("/admin/orders/{id}/status", adminOrderHandler.UpdateStatus())
		r.Post("/admin/orders/{id}/notes", adminOrderHandler.AddNote())

		// Customers
		r.Get("/admin/customers", adminHandler.ListCustomers())
		r.Get("/admin/customers/{id}", adminHandler.ShowCustomer())

		// Collections
		r.Get("/admin/collections", adminCollectionHandler.List())
		r.Get("/admin/collections/create", adminCollectionHandler.Create())
		r.Post("/admin/collections", adminCollectionHandler.Store())
		r.Get("/admin/collections/{id}/edit", adminCollectionHandler.Edit())
		r.Post("/admin/collections/{id}", adminCollectionHandler.Update())
		r.Post("/admin/collections/{id}/delete", adminCollectionHandler.Delete())

		// Coupons
		r.Get("/admin/coupons", adminCouponHandler.List())
		r.Get("/admin/coupons/create", adminCouponHandler.Create())
		r.Post("/admin/coupons", adminCouponHandler.Store())
		r.Get("/admin/coupons/{id}/edit", adminCouponHandler.Edit())
		r.Post("/admin/coupons/{id}", adminCouponHandler.Update())
		r.Post("/admin/coupons/{id}/delete", adminCouponHandler.Delete())

		// Settings
		// The configuration centre: an index of sections, then one page per
		// section that saves only its own fields.
		r.Get("/admin/settings", adminSettingsHandler.Index())
		r.Get("/admin/settings/{section}", adminSettingsHandler.Show())
		r.Post("/admin/settings/{section}", adminSettingsHandler.Update())
	})

	// --- Server ---
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      renderer.Middleware(r),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		fmt.Printf("Server running at http://localhost:%s\n", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server failed: %v", err)
		}
	}()

	<-done
	fmt.Println("\nShutting down server...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("server forced to shutdown: %v", err)
	}

	fmt.Println("Server stopped gracefully")
}

// csrfMiddleware sets an XSRF-TOKEN cookie for the frontend to read and send back
// as the X-XSRF-TOKEN header. This is a simple CSRF protection for Inertia apps.
func csrfMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Only set the cookie if one doesn't exist yet
		_, err := r.Cookie("XSRF-TOKEN")
		if err != nil {
			b := make([]byte, 32)
			if _, err := rand.Read(b); err == nil {
				http.SetCookie(w, &http.Cookie{
					Name:     "XSRF-TOKEN",
					Value:    fmt.Sprintf("%x", b),
					Path:     "/",
					HttpOnly: false, // JS needs to read this
					SameSite: http.SameSiteLaxMode,
				})
			}
		}
		next.ServeHTTP(w, r)
	})
}
