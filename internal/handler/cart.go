package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5/pgtype"
	inertia "github.com/mayahiro/go-inertia"

	"gocommerce/internal/db"
	"gocommerce/internal/service"
	"gocommerce/internal/session"
)

func parseUUID(s string) (pgtype.UUID, error) {
	s = strings.ReplaceAll(s, "-", "")
	if len(s) != 32 {
		return pgtype.UUID{}, fmt.Errorf("invalid UUID length")
	}
	var uuid pgtype.UUID
	err := uuid.Scan(s)
	return uuid, err
}

type CartHandler struct {
	renderer *inertia.Renderer
	cart     *service.CartService
	queries  *db.Queries
	coupons  *service.CouponService
}

func NewCartHandler(renderer *inertia.Renderer, cart *service.CartService, queries *db.Queries, coupons *service.CouponService) *CartHandler {
	return &CartHandler{renderer: renderer, cart: cart, queries: queries, coupons: coupons}
}

// Show renders the cart page.
func (h *CartHandler) Show() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sess := session.FromContext(r.Context())
		cart := h.cart.Get(sess)

		h.renderer.Render(w, r, "Pages/Cart/Index", inertia.Props{
			"cart": cart,
			// Re-evaluated on every render, so a coupon that stopped
			// qualifying disappears from the page by itself.
			"coupon": h.coupons.ForSession(r.Context(), sess, cart, sessionUserID(sess)),
		})
	}
}

// ApplyCoupon validates a code against the current cart and remembers it on the
// session. Only the code is stored — never the discount.
func (h *CartHandler) ApplyCoupon() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sess := session.FromContext(r.Context())

		fields, err := parseInput(r)
		if err != nil {
			h.renderer.Redirect(w, r, "/cart", inertia.WithFlash(inertia.Flash{
				"error": "Invalid request.",
			}))
			return
		}

		code := fields["code"]
		if strings.TrimSpace(code) == "" {
			h.renderer.Redirect(w, r, "/cart", inertia.WithValidationErrors(inertia.ValidationErrors{
				"code": "Enter a coupon code.",
			}))
			return
		}

		cart := h.cart.Get(sess)

		applied, err := h.coupons.Evaluate(r.Context(), code, cart, sessionUserID(sess))
		if err != nil {
			// Shown against the field rather than as a toast, so the shopper
			// sees the reason next to what they typed.
			h.renderer.Redirect(w, r, "/cart", inertia.WithValidationErrors(inertia.ValidationErrors{
				"code": capitalizeFirst(err.Error()) + ".",
			}))
			return
		}

		h.coupons.Store(sess, applied.Code)

		h.renderer.Redirect(w, r, "/cart", inertia.WithFlash(inertia.Flash{
			"success": fmt.Sprintf("Coupon %s applied.", applied.Code),
		}))
	}
}

// RemoveCoupon drops the applied coupon from the session.
func (h *CartHandler) RemoveCoupon() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sess := session.FromContext(r.Context())
		h.coupons.Clear(sess)

		h.renderer.Redirect(w, r, "/cart", inertia.WithFlash(inertia.Flash{
			"success": "Coupon removed.",
		}))
	}
}

// sessionUserID returns the signed-in user's ID, or "" for a guest.
func sessionUserID(sess *session.Session) string {
	if sess == nil {
		return ""
	}
	userID, ok := sess.Get("user_id")
	if !ok || userID == nil {
		return ""
	}
	return fmt.Sprintf("%v", userID)
}

// capitalizeFirst renders an error sentence-cased for display without changing
// the sentinel text the engine defines.
func capitalizeFirst(s string) string {
	if s == "" {
		return s
	}
	return strings.ToUpper(s[:1]) + s[1:]
}

// Add adds an item to the cart.
func (h *CartHandler) Add() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sess := session.FromContext(r.Context())

		fields, err := parseInput(r)
		if err != nil {
			h.renderer.Redirect(w, r, r.Header.Get("Referer"), inertia.WithFlash(inertia.Flash{
				"error": "Invalid request.",
			}))
			return
		}

		productID := fields["product_id"]
		quantityStr := fields["quantity"]
		if quantityStr == "" {
			quantityStr = "1"
		}

		quantity, err := strconv.Atoi(quantityStr)
		if err != nil || quantity < 1 {
			quantity = 1
		}

		if productID == "" {
			h.renderer.Redirect(w, r, r.Header.Get("Referer"), inertia.WithFlash(inertia.Flash{
				"error": "Product ID is required.",
			}))
			return
		}

		productUUID, err := parseUUID(productID)
		if err != nil {
			h.renderer.Redirect(w, r, r.Header.Get("Referer"), inertia.WithFlash(inertia.Flash{
				"error": "Invalid product ID.",
			}))
			return
		}

		product, err := h.queries.GetProductByID(r.Context(), productUUID)
		if err != nil {
			h.renderer.Redirect(w, r, r.Header.Get("Referer"), inertia.WithFlash(inertia.Flash{
				"error": "Product not found.",
			}))
			return
		}

		price, _ := product.Price.Float64Value()

		item := service.CartItem{
			ProductID: productID,
			Name:      product.Name,
			Slug:      product.Slug,
			Price:     price.Float64,
			Quantity:  quantity,
			ImageURL:  product.ImageUrl.String,
			SKU:       product.Sku.String,
		}

		if err := h.cart.AddItem(sess, item); err != nil {
			h.renderer.Redirect(w, r, r.Header.Get("Referer"), inertia.WithFlash(inertia.Flash{
				"error": "Failed to add item to cart.",
			}))
			return
		}

		h.renderer.Redirect(w, r, "/cart", inertia.WithFlash(inertia.Flash{
			"success": fmt.Sprintf("%s added to cart.", product.Name),
		}))
	}
}

// Update updates the quantity of an item in the cart.
func (h *CartHandler) Update() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sess := session.FromContext(r.Context())

		fields, err := parseInput(r)
		if err != nil {
			h.renderer.Redirect(w, r, "/cart", inertia.WithFlash(inertia.Flash{
				"error": "Invalid request.",
			}))
			return
		}

		productID := fields["product_id"]
		quantityStr := fields["quantity"]

		quantity, err := strconv.Atoi(quantityStr)
		if err != nil {
			h.renderer.Redirect(w, r, "/cart", inertia.WithFlash(inertia.Flash{
				"error": "Invalid quantity.",
			}))
			return
		}

		if err := h.cart.UpdateItem(sess, productID, quantity); err != nil {
			h.renderer.Redirect(w, r, "/cart", inertia.WithFlash(inertia.Flash{
				"error": "Failed to update cart.",
			}))
			return
		}

		h.renderer.Redirect(w, r, "/cart")
	}
}

// Remove removes an item from the cart.
func (h *CartHandler) Remove() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sess := session.FromContext(r.Context())

		fields, err := parseInput(r)
		if err != nil {
			h.renderer.Redirect(w, r, "/cart", inertia.WithFlash(inertia.Flash{
				"error": "Invalid request.",
			}))
			return
		}

		productID := fields["product_id"]

		if err := h.cart.RemoveItem(sess, productID); err != nil {
			h.renderer.Redirect(w, r, "/cart", inertia.WithFlash(inertia.Flash{
				"error": "Failed to remove item.",
			}))
			return
		}

		h.renderer.Redirect(w, r, "/cart")
	}
}

// Clear clears the entire cart.
func (h *CartHandler) Clear() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sess := session.FromContext(r.Context())

		if err := h.cart.Clear(sess); err != nil {
			h.renderer.Redirect(w, r, "/cart", inertia.WithFlash(inertia.Flash{
				"error": "Failed to clear cart.",
			}))
			return
		}

		h.renderer.Redirect(w, r, "/cart", inertia.WithFlash(inertia.Flash{
			"success": "Cart cleared.",
		}))
	}
}
