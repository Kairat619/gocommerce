package handler

import (
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	inertia "github.com/mayahiro/go-inertia"

	"gocommerce/internal/db"
	"gocommerce/internal/service"
	"gocommerce/internal/session"
)

type AccountHandler struct {
	renderer *inertia.Renderer
	order    *service.OrderService
	auth     *service.AuthService
}

func NewAccountHandler(renderer *inertia.Renderer, order *service.OrderService, auth *service.AuthService) *AccountHandler {
	return &AccountHandler{renderer: renderer, order: order, auth: auth}
}

func (h *AccountHandler) Profile() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sess := session.FromContext(r.Context())

		userID, ok := sess.Get("user_id")
		if !ok {
			h.renderer.Redirect(w, r, "/login", inertia.WithFlash(inertia.Flash{
				"error": "Please log in to view your profile.",
			}))
			return
		}

		userIDStr := formatUserID(userID)
		name, _ := sess.Get("user_name")
		email, _ := sess.Get("user_email")

		addresses, err := h.order.GetUserAddresses(r.Context(), userIDStr)
		if err != nil {
			addresses = []db.Address{}
		}

		h.renderer.Render(w, r, "Pages/Account/Profile", inertia.Props{
			"user": map[string]any{
				"id":    userIDStr,
				"name":  name,
				"email": email,
			},
			"addresses": serializeAddresses(addresses),
		})
	}
}

func (h *AccountHandler) UpdateProfile() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sess := session.FromContext(r.Context())

		userID, ok := sess.Get("user_id")
		if !ok {
			h.renderer.Redirect(w, r, "/login", inertia.WithFlash(inertia.Flash{
				"error": "Please log in.",
			}))
			return
		}

		fields, err := parseInput(r)
		if err != nil {
			h.renderer.Redirect(w, r, "/account", inertia.WithFlash(inertia.Flash{
				"error": "Invalid request.",
			}))
			return
		}

		name := fields["name"]
		email := fields["email"]

		if name == "" || email == "" {
			h.renderer.Redirect(w, r, "/account", inertia.WithFlash(inertia.Flash{
				"error": "Name and email are required.",
			}))
			return
		}

		userIDStr := formatUserID(userID)

		if err := h.order.UpdateProfile(r.Context(), userIDStr, name, email); err != nil {
			h.renderer.Redirect(w, r, "/account", inertia.WithFlash(inertia.Flash{
				"error": "Failed to update profile: " + err.Error(),
			}))
			return
		}

		sess.Set("user_name", name)
		sess.Set("user_email", email)

		h.renderer.Redirect(w, r, "/account", inertia.WithFlash(inertia.Flash{
			"success": "Profile updated successfully.",
		}))
	}
}

func (h *AccountHandler) Orders() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sess := session.FromContext(r.Context())

		userID, ok := sess.Get("user_id")
		if !ok {
			h.renderer.Redirect(w, r, "/login", inertia.WithFlash(inertia.Flash{
				"error": "Please log in to view your orders.",
			}))
			return
		}

		userIDStr := formatUserID(userID)

		page := getPageParam(r)
		perPage := 10

		orders, total, err := h.order.ListOrdersByUser(r.Context(), userIDStr, page, perPage)
		if err != nil {
			h.renderer.Redirect(w, r, "/account", inertia.WithFlash(inertia.Flash{
				"error": "Failed to load orders.",
			}))
			return
		}

		serializedOrders := make([]map[string]any, len(orders))
		for i, o := range orders {
			serializedOrders[i] = map[string]any{
				"id":         fmt.Sprintf("%x", o.ID.Bytes),
				"status":     string(o.Status),
				"total":      formatNumeric(o.Total),
				"item_count": 0,
				"created_at": o.CreatedAt.Time.Format("January 2, 2006"),
			}
		}

		h.renderer.Render(w, r, "Pages/Account/Orders", inertia.Props{
			"orders": serializedOrders,
			"pagination": map[string]any{
				"current": page,
				"total":   totalPages(total, perPage),
			},
		})
	}
}

func (h *AccountHandler) OrderShow() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sess := session.FromContext(r.Context())

		userID, ok := sess.Get("user_id")
		if !ok {
			h.renderer.Redirect(w, r, "/login", inertia.WithFlash(inertia.Flash{
				"error": "Please log in.",
			}))
			return
		}

		orderID := chi.URLParam(r, "id")
		userIDStr := formatUserID(userID)

		order, items, err := h.order.GetOrderByID(r.Context(), orderID, userIDStr)
		if err != nil {
			h.renderer.Redirect(w, r, "/account/orders", inertia.WithFlash(inertia.Flash{
				"error": "Order not found.",
			}))
			return
		}

		serializedItems := make([]map[string]any, len(items))
		for i, item := range items {
			serializedItems[i] = map[string]any{
				"id":            fmt.Sprintf("%x", item.ID.Bytes),
				"product_name":  item.ProductName,
				"variant_name":  item.VariantName.String,
				"quantity":      item.Quantity,
				"unit_price":    formatNumeric(item.UnitPrice),
				"total":         formatNumeric(item.Total),
				"product_slug":  item.ProductSlug,
				"product_image": item.ProductImageUrl.String,
			}
		}

		h.renderer.Render(w, r, "Pages/Account/OrderShow", inertia.Props{
			"order": serializeOrder(order),
			"items": serializedItems,
		})
	}
}
