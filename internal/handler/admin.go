package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
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

func (h *AdminHandler) Dashboard() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		summary, _ := h.queries.GetOrderSummary(r.Context())
		productCount, _ := h.queries.CountAllProducts(r.Context())
		customerCount, _ := h.queries.CountCustomers(r.Context())
		recentOrders, _ := h.queries.GetRecentOrders(r.Context(), 5)
		topProducts, _ := h.queries.GetTopSellingProducts(r.Context(), 5)

		serializedOrders := make([]map[string]any, len(recentOrders))
		for i, o := range recentOrders {
			serializedOrders[i] = map[string]any{
				"id":             fmt.Sprintf("%x", o.ID.Bytes),
				"customer_name":  o.CustomerName,
				"customer_email": o.CustomerEmail,
				"total":          formatNumeric(o.Total),
				"status":         string(o.Status),
				"created_at":     o.CreatedAt.Time.Format("Jan 2, 2006"),
			}
		}

		serializedTop := make([]map[string]any, len(topProducts))
		for i, p := range topProducts {
			serializedTop[i] = map[string]any{
				"name":          p.Name,
				"total_sold":    p.TotalSold,
				"total_revenue": formatNumeric(p.TotalRevenue),
			}
		}

		h.renderer.Render(w, r, "Pages/Admin/Dashboard", inertia.Props{
			"summary": map[string]any{
				"total_orders":     summary.TotalOrders,
				"total_revenue":    formatNumeric(summary.TotalRevenue),
				"average_order":    formatNumeric(summary.AverageOrderValue),
				"unique_customers": summary.UniqueCustomers,
			},
			"product_count":  productCount,
			"customer_count": customerCount,
			"recent_orders":  serializedOrders,
			"top_products":   serializedTop,
		})
	}
}

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

func (h *AdminHandler) ListCategories() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		categories, err := h.queries.ListCategories(r.Context())
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		serialized := make([]map[string]any, len(categories))
		for i, c := range categories {
			serialized[i] = map[string]any{
				"id":          fmt.Sprintf("%x", c.ID.Bytes),
				"name":        c.Name,
				"slug":        c.Slug,
				"description": c.Description.String,
				"sort_order":  c.SortOrder,
				"is_active":   c.IsActive,
			}
		}

		h.renderer.Render(w, r, "Pages/Admin/Categories/Index", inertia.Props{
			"categories": serialized,
		})
	}
}

func (h *AdminHandler) CreateCategory() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		h.renderer.Render(w, r, "Pages/Admin/Categories/Create", inertia.Props{})
	}
}

func (h *AdminHandler) StoreCategory() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		fields, err := parseInput(r)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/categories/create", inertia.WithFlash(inertia.Flash{
				"error": "Invalid request.",
			}))
			return
		}

		sortOrder, _ := strconv.ParseInt(fields["sort_order"], 10, 32)

		_, err = h.queries.CreateCategory(r.Context(), db.CreateCategoryParams{
			ParentID:    pgtype.UUID{Valid: false},
			Name:        fields["name"],
			Slug:        slugify(fields["name"]),
			Description: pgtype.Text{String: fields["description"], Valid: fields["description"] != ""},
			ImageUrl:    pgtype.Text{String: fields["image_url"], Valid: fields["image_url"] != ""},
			SortOrder:   int32(sortOrder),
			IsActive:    fields["is_active"] == "true" || fields["is_active"] == "on",
		})
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/categories/create", inertia.WithFlash(inertia.Flash{
				"error": "Failed to create category: " + err.Error(),
			}))
			return
		}

		h.renderer.Redirect(w, r, "/admin/categories", inertia.WithFlash(inertia.Flash{
			"success": "Category created.",
		}))
	}
}

func (h *AdminHandler) EditCategory() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		categoryUUID, err := parseUUID(id)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/categories", inertia.WithFlash(inertia.Flash{
				"error": "Invalid category ID.",
			}))
			return
		}

		category, err := h.queries.GetCategoryByID(r.Context(), categoryUUID)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/categories", inertia.WithFlash(inertia.Flash{
				"error": "Category not found.",
			}))
			return
		}

		h.renderer.Render(w, r, "Pages/Admin/Categories/Edit", inertia.Props{
			"category": map[string]any{
				"id":          fmt.Sprintf("%x", category.ID.Bytes),
				"name":        category.Name,
				"slug":        category.Slug,
				"description": category.Description.String,
				"image_url":   category.ImageUrl.String,
				"sort_order":  category.SortOrder,
				"is_active":   category.IsActive,
			},
		})
	}
}

func (h *AdminHandler) UpdateCategory() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		categoryUUID, err := parseUUID(id)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/categories", inertia.WithFlash(inertia.Flash{
				"error": "Invalid category ID.",
			}))
			return
		}

		fields, err := parseInput(r)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/categories/"+id+"/edit", inertia.WithFlash(inertia.Flash{
				"error": "Invalid request.",
			}))
			return
		}

		sortOrder, _ := strconv.ParseInt(fields["sort_order"], 10, 32)

		_, err = h.queries.UpdateCategory(r.Context(), db.UpdateCategoryParams{
			ID:          categoryUUID,
			Name:        fields["name"],
			Slug:        slugify(fields["name"]),
			Description: pgtype.Text{String: fields["description"], Valid: fields["description"] != ""},
			ImageUrl:    pgtype.Text{String: fields["image_url"], Valid: fields["image_url"] != ""},
			SortOrder:   int32(sortOrder),
			IsActive:    fields["is_active"] == "true" || fields["is_active"] == "on",
		})
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/categories/"+id+"/edit", inertia.WithFlash(inertia.Flash{
				"error": "Failed to update category: " + err.Error(),
			}))
			return
		}

		h.renderer.Redirect(w, r, "/admin/categories", inertia.WithFlash(inertia.Flash{
			"success": "Category updated.",
		}))
	}
}

func (h *AdminHandler) DeleteCategory() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		categoryUUID, err := parseUUID(id)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/categories", inertia.WithFlash(inertia.Flash{
				"error": "Invalid category ID.",
			}))
			return
		}

		if err := h.queries.DeleteCategory(r.Context(), categoryUUID); err != nil {
			h.renderer.Redirect(w, r, "/admin/categories", inertia.WithFlash(inertia.Flash{
				"error": "Failed to delete category.",
			}))
			return
		}

		h.renderer.Redirect(w, r, "/admin/categories", inertia.WithFlash(inertia.Flash{
			"success": "Category deleted.",
		}))
	}
}

func (h *AdminHandler) ListOrders() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		page := getPageParam(r)
		offset := int32((page - 1) * 20)

		status := r.URL.Query().Get("status")

		var orders []db.ListAllOrdersRow
		var total int64
		var err error

		if status != "" {
			ordersByStatus, e := h.queries.ListOrdersByStatus(r.Context(), db.ListOrdersByStatusParams{
				Status: db.OrderStatus(status),
				Limit:  20,
				Offset: offset,
			})
			if e != nil {
				http.Error(w, e.Error(), http.StatusInternalServerError)
				return
			}
			orders = make([]db.ListAllOrdersRow, len(ordersByStatus))
			for i, o := range ordersByStatus {
				orders[i] = db.ListAllOrdersRow{
					ID:           o.ID,
					UserID:       o.UserID,
					Status:       o.Status,
					Total:        o.Total,
					Subtotal:     o.Subtotal,
					Tax:          o.Tax,
					ShippingCost: o.ShippingCost,
					ShippingName: o.ShippingName,
					CreatedAt:    o.CreatedAt,
					UpdatedAt:    o.UpdatedAt,
				}
			}
			count, _ := h.queries.CountOrdersByStatus(r.Context(), db.OrderStatus(status))
			total = count
		} else {
			orders, err = h.queries.ListAllOrders(r.Context(), db.ListAllOrdersParams{
				Limit:  20,
				Offset: offset,
			})
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			total, _ = h.queries.CountAllOrders(r.Context())
		}

		serialized := make([]map[string]any, len(orders))
		for i, o := range orders {
			serialized[i] = map[string]any{
				"id":             fmt.Sprintf("%x", o.ID.Bytes),
				"customer_name":  o.CustomerName,
				"customer_email": o.CustomerEmail,
				"total":          formatNumeric(o.Total),
				"status":         string(o.Status),
				"created_at":     o.CreatedAt.Time.Format("Jan 2, 2006"),
			}
		}

		h.renderer.Render(w, r, "Pages/Admin/Orders/Index", inertia.Props{
			"orders": serialized,
			"status": status,
			"pagination": map[string]any{
				"current": page,
				"total":   totalPages(total, 20),
			},
		})
	}
}

func (h *AdminHandler) ShowOrder() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		orderUUID, err := parseUUID(id)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/orders", inertia.WithFlash(inertia.Flash{
				"error": "Invalid order ID.",
			}))
			return
		}

		order, err := h.queries.GetOrderByID(r.Context(), orderUUID)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/orders", inertia.WithFlash(inertia.Flash{
				"error": "Order not found.",
			}))
			return
		}

		items, _ := h.queries.GetOrderItemsByOrderID(r.Context(), orderUUID)

		serializedItems := make([]map[string]any, len(items))
		for i, item := range items {
			serializedItems[i] = map[string]any{
				"product_name": item.ProductName,
				"quantity":     item.Quantity,
				"unit_price":   formatNumeric(item.UnitPrice),
				"total":        formatNumeric(item.Total),
			}
		}

		h.renderer.Render(w, r, "Pages/Admin/Orders/Show", inertia.Props{
			"order": serializeOrder(&order),
			"items": serializedItems,
		})
	}
}

func (h *AdminHandler) UpdateOrderStatus() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		orderUUID, err := parseUUID(id)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/orders", inertia.WithFlash(inertia.Flash{
				"error": "Invalid order ID.",
			}))
			return
		}

		fields, err := parseInput(r)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/orders/"+id, inertia.WithFlash(inertia.Flash{
				"error": "Invalid request.",
			}))
			return
		}

		status := fields["status"]
		validStatuses := map[string]bool{
			"pending": true, "confirmed": true, "processing": true,
			"shipped": true, "delivered": true, "cancelled": true,
		}
		if !validStatuses[status] {
			h.renderer.Redirect(w, r, "/admin/orders/"+id, inertia.WithFlash(inertia.Flash{
				"error": "Invalid status.",
			}))
			return
		}

		if err := h.queries.UpdateOrderStatus(r.Context(), db.UpdateOrderStatusParams{
			ID:     orderUUID,
			Status: db.OrderStatus(status),
		}); err != nil {
			h.renderer.Redirect(w, r, "/admin/orders/"+id, inertia.WithFlash(inertia.Flash{
				"error": "Failed to update order status.",
			}))
			return
		}

		h.renderer.Redirect(w, r, "/admin/orders/"+id, inertia.WithFlash(inertia.Flash{
			"success": "Order status updated.",
		}))
	}
}

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

func (h *AdminHandler) ShowSettings() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		settings := h.settings.Get(r.Context())

		h.renderer.Render(w, r, "Pages/Admin/Settings/Index", inertia.Props{
			"settings": map[string]any{
				"tax_rate_percent":        settings.TaxRate * 100,
				"shipping_cost":           settings.ShippingCost,
				"free_shipping_threshold": settings.FreeShippingThreshold,
			},
		})
	}
}

func (h *AdminHandler) UpdateSettings() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		fields, err := parseInput(r)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/settings", inertia.WithFlash(inertia.Flash{
				"error": "Invalid request.",
			}))
			return
		}

		errs := inertia.ValidationErrors{}

		taxPercent, err := strconv.ParseFloat(strings.TrimSpace(fields["tax_rate_percent"]), 64)
		if err != nil || taxPercent < 0 || taxPercent > 100 {
			errs["tax_rate_percent"] = "Tax rate must be a number between 0 and 100."
		}

		shippingCost, err := strconv.ParseFloat(strings.TrimSpace(fields["shipping_cost"]), 64)
		if err != nil || shippingCost < 0 {
			errs["shipping_cost"] = "Shipping fee must be a non-negative number."
		}

		freeThreshold, err := strconv.ParseFloat(strings.TrimSpace(fields["free_shipping_threshold"]), 64)
		if err != nil || freeThreshold < 0 {
			errs["free_shipping_threshold"] = "Free shipping threshold must be a non-negative number."
		}

		if len(errs) > 0 {
			h.renderer.Redirect(w, r, "/admin/settings", inertia.WithValidationErrors(errs))
			return
		}

		_, err = h.settings.Update(r.Context(), service.StoreSettings{
			TaxRate:               taxPercent / 100,
			ShippingCost:          shippingCost,
			FreeShippingThreshold: freeThreshold,
		})
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/settings", inertia.WithFlash(inertia.Flash{
				"error": "Failed to save settings: " + err.Error(),
			}))
			return
		}

		h.renderer.Redirect(w, r, "/admin/settings", inertia.WithFlash(inertia.Flash{
			"success": "Store settings updated.",
		}))
	}
}

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
