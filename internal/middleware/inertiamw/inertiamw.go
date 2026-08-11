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
}

func (d *DynamicSharedProps) Props(req *http.Request) (inertia.Props, error) {
	props := inertia.Props{
		"appName": d.AppName,
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
