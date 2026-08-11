package middleware

import (
	"net/http"

	"gocommerce/internal/session"
)

// RequireAuth checks that the user is logged in.
func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sess := session.FromContext(r.Context())
		if sess == nil {
			http.Redirect(w, r, "/login", http.StatusFound)
			return
		}

		if _, ok := sess.Get("user_id"); !ok {
			http.Redirect(w, r, "/login", http.StatusFound)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// RequireGuest checks that the user is NOT logged in.
func RequireGuest(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sess := session.FromContext(r.Context())
		if sess != nil {
			if _, ok := sess.Get("user_id"); ok {
				http.Redirect(w, r, "/", http.StatusFound)
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}

// RequireAdmin checks that the user is logged in and has the admin role.
func RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sess := session.FromContext(r.Context())
		if sess == nil {
			http.Redirect(w, r, "/login", http.StatusFound)
			return
		}

		userID, ok := sess.Get("user_id")
		if !ok {
			http.Redirect(w, r, "/login", http.StatusFound)
			return
		}

		role, ok := sess.Get("user_role")
		if !ok || role != "admin" {
			http.Redirect(w, r, "/", http.StatusFound)
			return
		}

		_ = userID
		next.ServeHTTP(w, r)
	})
}

// RequireRole checks that the user has the specified role.
func RequireRole(role string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			sess := session.FromContext(r.Context())
			if sess == nil {
				http.Redirect(w, r, "/login", http.StatusFound)
				return
			}

			if _, ok := sess.Get("user_id"); !ok {
				http.Redirect(w, r, "/login", http.StatusFound)
				return
			}

			userRole, ok := sess.Get("user_role")
			if !ok || userRole != role {
				http.Redirect(w, r, "/", http.StatusFound)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// SetAuthUser sets the user data in the session after login.
func SetAuthUser(sess *session.Session, userID, name, email, role string) {
	sess.Set("user_id", userID)
	sess.Set("user_name", name)
	sess.Set("user_email", email)
	sess.Set("user_role", role)
}

// ClearAuthUser clears the user data from the session.
func ClearAuthUser(sess *session.Session) {
	sess.Delete("user_id")
	sess.Delete("user_name")
	sess.Delete("user_email")
	sess.Delete("user_role")
}

// GetUserID returns the user ID from the session.
func GetUserID(sess *session.Session) (string, bool) {
	id, ok := sess.Get("user_id")
	if !ok {
		return "", false
	}
	idStr, ok := id.(string)
	return idStr, ok
}

// GetUserRole returns the user role from the session.
func GetUserRole(sess *session.Session) (string, bool) {
	role, ok := sess.Get("user_role")
	if !ok {
		return "", false
	}
	roleStr, ok := role.(string)
	return roleStr, ok
}

// IsAdmin checks if the current user is an admin.
func IsAdmin(sess *session.Session) bool {
	role, ok := GetUserRole(sess)
	return ok && role == "admin"
}

// IsCustomer checks if the current user is a customer.
func IsCustomer(sess *session.Session) bool {
	role, ok := GetUserRole(sess)
	return ok && role == "customer"
}
