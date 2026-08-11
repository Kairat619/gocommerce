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
}

func NewCartHandler(renderer *inertia.Renderer, cart *service.CartService, queries *db.Queries) *CartHandler {
	return &CartHandler{renderer: renderer, cart: cart, queries: queries}
}

// Show renders the cart page.
func (h *CartHandler) Show() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sess := session.FromContext(r.Context())
		cart := h.cart.Get(sess)

		h.renderer.Render(w, r, "Pages/Cart/Index", inertia.Props{
			"cart": cart,
		})
	}
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
