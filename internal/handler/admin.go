package handler

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	inertia "github.com/mayahiro/go-inertia"

	"gocommerce/internal/db"
	"gocommerce/internal/service"
)

type AdminHandler struct {
	renderer *inertia.Renderer
	queries  *db.Queries
	pool     *pgxpool.Pool
	settings *service.SettingsService
}

func NewAdminHandler(renderer *inertia.Renderer, queries *db.Queries, pool *pgxpool.Pool, settings *service.SettingsService) *AdminHandler {
	return &AdminHandler{renderer: renderer, queries: queries, pool: pool, settings: settings}
}

// The dashboard moved to admin_dashboard.go when it grew a date range, period
// comparisons, a sales chart and nine more sections — the same split orders
// took in admin_orders.go. What lived here summed four all-time numbers and
// swallowed every error into a zero.

func (h *AdminHandler) ListProducts() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		page := getPageParam(r)
		offset := int32((page - 1) * 20)

		products, err := h.queries.ListAllProducts(r.Context(), db.ListAllProductsParams{
			Limit:  20,
			Offset: offset,
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		total, _ := h.queries.CountAllProducts(r.Context())

		serialized := make([]map[string]any, len(products))
		for i, p := range products {
			serialized[i] = map[string]any{
				"id":             fmt.Sprintf("%x", p.ID.Bytes),
				"name":           p.Name,
				"slug":           p.Slug,
				"price":          formatNumeric(p.Price),
				"stock_quantity": p.StockQuantity,
				"is_active":      p.IsActive,
				"category_name":  p.CategoryName,
				"image_url":      p.ImageUrl.String,
			}
		}

		h.renderer.Render(w, r, "Pages/Admin/Products/Index", inertia.Props{
			"products": serialized,
			"pagination": map[string]any{
				"current": page,
				"total":   totalPages(total, 20),
			},
		})
	}
}

func (h *AdminHandler) DeleteProduct() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		productUUID, err := parseUUID(id)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/products", inertia.WithFlash(inertia.Flash{
				"error": "Invalid product ID.",
			}))
			return
		}

		if err := h.queries.DeleteProduct(r.Context(), productUUID); err != nil {
			h.renderer.Redirect(w, r, "/admin/products", inertia.WithFlash(inertia.Flash{
				"error": "Failed to delete product.",
			}))
			return
		}

		h.renderer.Redirect(w, r, "/admin/products", inertia.WithFlash(inertia.Flash{
			"success": "Product deleted.",
		}))
	}
}

// Order management lives in admin_orders.go. ListOrders, ShowOrder and
// UpdateOrderStatus were moved there when the admin gained search, filtering,
// an activity log and a real state machine — one operational concern per unit,
// as with coupons, collections and attributes.

func (h *AdminHandler) ListCustomers() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		page := getPageParam(r)
		offset := int32((page - 1) * 20)

		customers, err := h.queries.ListCustomers(r.Context(), db.ListCustomersParams{
			Limit:  20,
			Offset: offset,
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		total, _ := h.queries.CountCustomers(r.Context())

		serialized := make([]map[string]any, len(customers))
		for i, c := range customers {
			serialized[i] = map[string]any{
				"id":         fmt.Sprintf("%x", c.ID.Bytes),
				"name":       c.Name,
				"email":      c.Email,
				"role":       c.Role,
				"created_at": c.CreatedAt.Time.Format("Jan 2, 2006"),
			}
		}

		h.renderer.Render(w, r, "Pages/Admin/Customers/Index", inertia.Props{
			"customers": serialized,
			"pagination": map[string]any{
				"current": page,
				"total":   totalPages(total, 20),
			},
		})
	}
}

func (h *AdminHandler) ShowCustomer() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		customerUUID, err := parseUUID(id)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/customers", inertia.WithFlash(inertia.Flash{
				"error": "Invalid customer ID.",
			}))
			return
		}

		customer, err := h.queries.GetUserByID(r.Context(), customerUUID)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/customers", inertia.WithFlash(inertia.Flash{
				"error": "Customer not found.",
			}))
			return
		}

		orders, _ := h.queries.ListOrdersByUser(r.Context(), db.ListOrdersByUserParams{
			UserID: customerUUID,
			Limit:  10,
			Offset: 0,
		})

		serializedOrders := make([]map[string]any, len(orders))
		for i, o := range orders {
			serializedOrders[i] = map[string]any{
				"id":         fmt.Sprintf("%x", o.ID.Bytes),
				"total":      formatNumeric(o.Total),
				"status":     string(o.Status),
				"created_at": o.CreatedAt.Time.Format("Jan 2, 2006"),
			}
		}

		h.renderer.Render(w, r, "Pages/Admin/Customers/Show", inertia.Props{
			"customer": map[string]any{
				"id":         fmt.Sprintf("%x", customer.ID.Bytes),
				"name":       customer.Name,
				"email":      customer.Email,
				"role":       customer.Role,
				"created_at": customer.CreatedAt.Time.Format("Jan 2, 2006"),
			},
			"orders": serializedOrders,
		})
	}
}

// Settings moved to admin_settings.go when it became the configuration centre:
// five sections, each saving on its own, plus an audit trail. What lived here
// was one form over three columns.

func slugify(s string) string {
	s = strings.ToLower(s)
	s = strings.ReplaceAll(s, " ", "-")
	s = strings.ReplaceAll(s, "_", "-")
	for strings.Contains(s, "--") {
		s = strings.ReplaceAll(s, "--", "-")
	}
	s = strings.Trim(s, "-")
	return s
}
