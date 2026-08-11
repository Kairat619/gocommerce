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
	vite, err := inertia.NewVite(inertia.ViteConfig{
		ManifestPath: "public/build/.vite/manifest.json",
		PublicPath:   "/build",
		Entry:        "src/main.jsx",
		DevServerURL: "http://localhost:5173",
		ReactRefresh: cfg.IsDevelopment(),
	})
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
	orderService := service.NewOrderService(queries, cartService, settingsService)

	// --- Dynamic Shared Props ---
	shared := &inertiamw.DynamicSharedProps{
		AppName:    "GoCommerce",
		Store:      store,
		FlashStore: flashStore,
		Cart:       cartService,
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
	productHandler := handler.NewProductHandler(renderer, queries)
	categoryHandler := handler.NewCategoryHandler(renderer, queries)
	cartHandler := handler.NewCartHandler(renderer, cartService, queries)
	checkoutHandler := handler.NewCheckoutHandler(renderer, orderService, settingsService)
	accountHandler := handler.NewAccountHandler(renderer, orderService, authService)
	adminHandler := handler.NewAdminHandler(renderer, queries, settingsService)

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

	// Cart
	r.Get("/cart", cartHandler.Show())
	r.Post("/cart/add", cartHandler.Add())
	r.Post("/cart/update", cartHandler.Update())
	r.Post("/cart/remove", cartHandler.Remove())
	r.Post("/cart/clear", cartHandler.Clear())

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
		r.Get("/admin", adminHandler.Dashboard())

		// Products
		r.Get("/admin/products", adminHandler.ListProducts())
		r.Get("/admin/products/create", adminHandler.CreateProduct())
		r.Post("/admin/products", adminHandler.StoreProduct())
		r.Get("/admin/products/{id}/edit", adminHandler.EditProduct())
		r.Post("/admin/products/{id}", adminHandler.UpdateProduct())
		r.Post("/admin/products/{id}/delete", adminHandler.DeleteProduct())

		// Categories
		r.Get("/admin/categories", adminHandler.ListCategories())
		r.Get("/admin/categories/create", adminHandler.CreateCategory())
		r.Post("/admin/categories", adminHandler.StoreCategory())
		r.Get("/admin/categories/{id}/edit", adminHandler.EditCategory())
		r.Post("/admin/categories/{id}", adminHandler.UpdateCategory())
		r.Post("/admin/categories/{id}/delete", adminHandler.DeleteCategory())

		// Orders
		r.Get("/admin/orders", adminHandler.ListOrders())
		r.Get("/admin/orders/{id}", adminHandler.ShowOrder())
		r.Post("/admin/orders/{id}/status", adminHandler.UpdateOrderStatus())

		// Customers
		r.Get("/admin/customers", adminHandler.ListCustomers())
		r.Get("/admin/customers/{id}", adminHandler.ShowCustomer())

		// Settings
		r.Get("/admin/settings", adminHandler.ShowSettings())
		r.Post("/admin/settings", adminHandler.UpdateSettings())
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
