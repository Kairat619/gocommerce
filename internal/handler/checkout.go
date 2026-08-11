package handler

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	inertia "github.com/mayahiro/go-inertia"

	"gocommerce/internal/db"
	"gocommerce/internal/service"
	"gocommerce/internal/session"
)

type CheckoutHandler struct {
	renderer *inertia.Renderer
	order    *service.OrderService
	settings *service.SettingsService
}

func NewCheckoutHandler(renderer *inertia.Renderer, order *service.OrderService, settings *service.SettingsService) *CheckoutHandler {
	return &CheckoutHandler{renderer: renderer, order: order, settings: settings}
}

func (h *CheckoutHandler) Show() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sess := session.FromContext(r.Context())

		if err := h.order.ValidateCheckout(sess); err != nil {
			h.renderer.Redirect(w, r, "/cart", inertia.WithFlash(inertia.Flash{
				"error": "Your cart is empty or items are no longer available.",
			}))
			return
		}

		cart := h.order.GetCart(sess)

		userID, _ := sess.Get("user_id")
		userIDStr := ""
		if userID != nil {
			userIDStr = formatUserID(userID)
		}

		var addresses []map[string]any
		if userIDStr != "" {
			addrs, err := h.order.GetUserAddresses(r.Context(), userIDStr)
			if err == nil {
				addresses = serializeAddresses(addrs)
			}
		}

		settings := h.settings.Get(r.Context())

		h.renderer.Render(w, r, "Pages/Checkout/Index", inertia.Props{
			"cart":                    cart,
			"addresses":               addresses,
			"tax_rate":                settings.TaxRate,
			"shipping_cost":           settings.ShippingCost,
			"free_shipping_threshold": settings.FreeShippingThreshold,
		})
	}
}

func (h *CheckoutHandler) Process() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sess := session.FromContext(r.Context())

		fields, err := parseInput(r)
		if err != nil {
			h.renderer.Redirect(w, r, "/checkout", inertia.WithFlash(inertia.Flash{
				"error": "Invalid request.",
			}))
			return
		}

		input := service.CheckoutInput{
			ShippingName:       fields["shipping_name"],
			ShippingAddress:    fields["shipping_address"],
			ShippingCity:       fields["shipping_city"],
			ShippingState:      fields["shipping_state"],
			ShippingPostalCode: fields["shipping_postal_code"],
			ShippingCountry:    fields["shipping_country"],
			BillingName:        fields["billing_name"],
			BillingAddress:     fields["billing_address"],
			BillingCity:        fields["billing_city"],
			BillingState:       fields["billing_state"],
			BillingPostalCode:  fields["billing_postal_code"],
			BillingCountry:     fields["billing_country"],
			Notes:              fields["notes"],
		}

		if input.ShippingName == "" || input.ShippingAddress == "" || input.ShippingCity == "" || input.ShippingPostalCode == "" || input.ShippingCountry == "" {
			h.renderer.Redirect(w, r, "/checkout", inertia.WithFlash(inertia.Flash{
				"error": "Please fill in all required shipping fields.",
			}))
			return
		}

		result, err := h.order.CreateOrder(r.Context(), sess, input)
		if err != nil {
			if errors.Is(err, service.ErrCartEmpty) {
				h.renderer.Redirect(w, r, "/cart", inertia.WithFlash(inertia.Flash{
					"error": "Your cart is empty.",
				}))
				return
			}
			h.renderer.Redirect(w, r, "/checkout", inertia.WithFlash(inertia.Flash{
				"error": "Failed to create order: " + err.Error(),
			}))
			return
		}

		h.renderer.Redirect(w, r, "/checkout/confirmation/"+result.OrderID, inertia.WithFlash(inertia.Flash{
			"success": "Order placed successfully! Your order total is $" + strconv.FormatFloat(result.Total, 'f', 2, 64),
		}))
	}
}

func (h *CheckoutHandler) Confirmation() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sess := session.FromContext(r.Context())

		orderID := chi.URLParam(r, "id")

		userID, ok := sess.Get("user_id")
		if !ok {
			h.renderer.Redirect(w, r, "/login", inertia.WithFlash(inertia.Flash{
				"error": "Please log in to view your order.",
			}))
			return
		}

		userIDStr := formatUserID(userID)

		order, _, err := h.order.GetOrderByID(r.Context(), orderID, userIDStr)
		if err != nil {
			h.renderer.Redirect(w, r, "/account/orders", inertia.WithFlash(inertia.Flash{
				"error": "Order not found.",
			}))
			return
		}

		h.renderer.Render(w, r, "Pages/Checkout/Confirmation", inertia.Props{
			"order": serializeOrder(order),
		})
	}
}

func formatUserID(userID any) string {
	switch v := userID.(type) {
	case string:
		return v
	case [16]byte:
		return fmt.Sprintf("%x", v[:])
	default:
		return ""
	}
}

func serializeOrder(o *db.GetOrderByIDRow) map[string]any {
	return map[string]any{
		"id":                   fmt.Sprintf("%x", o.ID.Bytes),
		"status":               string(o.Status),
		"total":                formatNumeric(o.Total),
		"subtotal":             formatNumeric(o.Subtotal),
		"tax":                  formatNumeric(o.Tax),
		"shipping_cost":        formatNumeric(o.ShippingCost),
		"discount":             formatNumeric(o.Discount),
		"notes":                o.Notes.String,
		"shipping_name":        o.ShippingName,
		"shipping_address":     o.ShippingAddress,
		"shipping_city":        o.ShippingCity,
		"shipping_state":       o.ShippingState.String,
		"shipping_postal_code": o.ShippingPostalCode,
		"shipping_country":     o.ShippingCountry,
		"billing_name":         o.BillingName.String,
		"billing_address":      o.BillingAddress.String,
		"billing_city":         o.BillingCity.String,
		"billing_state":        o.BillingState.String,
		"billing_postal_code":  o.BillingPostalCode.String,
		"billing_country":      o.BillingCountry.String,
		"created_at":           o.CreatedAt.Time.Format("January 2, 2006"),
	}
}

func serializeAddresses(addrs []db.Address) []map[string]any {
	out := make([]map[string]any, len(addrs))
	for i, a := range addrs {
		out[i] = map[string]any{
			"id":            fmt.Sprintf("%x", a.ID.Bytes),
			"label":         a.Label,
			"first_name":    a.FirstName,
			"last_name":     a.LastName,
			"company":       a.Company.String,
			"address_line1": a.AddressLine1,
			"address_line2": a.AddressLine2.String,
			"city":          a.City,
			"state":         a.State,
			"postal_code":   a.PostalCode,
			"country":       a.Country,
			"phone":         a.Phone.String,
			"is_default":    a.IsDefault,
		}
	}
	return out
}
