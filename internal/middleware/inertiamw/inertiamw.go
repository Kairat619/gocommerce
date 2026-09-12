package inertiamw

import (
	"encoding/json"
	"net/http"

	inertia "github.com/mayahiro/go-inertia"

	"gocommerce/internal/service"
	"gocommerce/internal/session"
)

type DynamicSharedProps struct {
	AppName    string
	Store      *session.Store
	FlashStore inertia.FlashStore
	Cart       *service.CartService
	Settings   *service.SettingsService
}

func (d *DynamicSharedProps) Props(req *http.Request) (inertia.Props, error) {
	props := inertia.Props{
		"appName": d.AppName,
	}

	// The store's identity and display currency, on every page.
	//
	// Both were previously constants in the bundle — BRAND_NAME in lib/brand.js
	// and DEFAULT_CURRENCY in lib/money.js — which meant the storefront's brand
	// and the admin's currency could each disagree with the server's idea of
	// them, and one of them did: the storefront rendered "ShopNest" while this
	// very middleware sent an appName of "GoCommerce" that nothing consumed.
	//
	// Sending it as a shared prop is what makes the settings page authoritative
	// rather than decorative. appName is left in place: it is the deployment's
	// own name, not the shop's, and removing a prop is a contract change.
	if d.Settings != nil {
		settings := d.Settings.Get(req.Context())
		props["store"] = map[string]any{
			"name":        settings.StoreName,
			"description": settings.StoreDescription,
			"email":       settings.StoreEmail,
			"phone":       settings.StorePhone,
			"currency":    settings.Currency,
		}
	}

	sess := session.FromContext(req.Context())
	if sess != nil {
		if userID, ok := sess.Get("user_id"); ok {
			authUser := map[string]any{
				"id": userID,
			}
			if name, ok := sess.Get("user_name"); ok {
				authUser["name"] = name
			}
			if email, ok := sess.Get("user_email"); ok {
				authUser["email"] = email
			}
			if role, ok := sess.Get("user_role"); ok {
				authUser["role"] = role
			}
			props["auth"] = map[string]any{
				"user": authUser,
			}
		}
	}

	if d.Cart != nil && sess != nil {
		cart := d.Cart.Get(sess)
		cartJSON, err := json.Marshal(cart)
		if err == nil {
			var cartData map[string]any
			if json.Unmarshal(cartJSON, &cartData) == nil {
				props["cart"] = cartData
			}
		}
	}

	return props, nil
}
