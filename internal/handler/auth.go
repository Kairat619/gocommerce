package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	inertia "github.com/mayahiro/go-inertia"

	"gocommerce/internal/middleware"
	"gocommerce/internal/service"
	"gocommerce/internal/session"
)

type AuthHandler struct {
	renderer    *inertia.Renderer
	auth        *service.AuthService
	rateLimiter *middleware.RateLimiter
}

func NewAuthHandler(renderer *inertia.Renderer, auth *service.AuthService) *AuthHandler {
	return &AuthHandler{
		renderer:    renderer,
		auth:        auth,
		rateLimiter: middleware.LoginRateLimiter(),
	}
}

// ShowLogin renders the login page.
func (h *AuthHandler) ShowLogin() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		h.renderer.Render(w, r, "Pages/Auth/Login", inertia.Props{})
	}
}

// ShowRegister renders the registration page.
func (h *AuthHandler) ShowRegister() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		h.renderer.Render(w, r, "Pages/Auth/Register", inertia.Props{})
	}
}

// Login authenticates the user and creates a session.
func (h *AuthHandler) Login() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Rate limiting check
		ip := r.RemoteAddr
		if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
			ip = strings.Split(forwarded, ",")[0]
		}

		if !h.rateLimiter.Allow(ip) {
			h.renderer.Redirect(w, r, "/login", inertia.WithFlash(inertia.Flash{
				"error": "Too many login attempts. Please try again later.",
			}))
			return
		}

		fields, err := parseInput(r)
		if err != nil {
			h.renderer.Redirect(w, r, "/login", inertia.WithFlash(inertia.Flash{
				"error": "Invalid form data.",
			}))
			return
		}

		email := strings.TrimSpace(fields["email"])
		password := fields["password"]
		rememberMe := fields["remember_me"] == "true" || fields["remember_me"] == "on"

		var errs inertia.ValidationErrors
		if email == "" {
			errs = appendFieldError(errs, "email", "Email is required.")
		}
		if password == "" {
			errs = appendFieldError(errs, "password", "Password is required.")
		}

		if len(errs) > 0 {
			h.renderer.Redirect(w, r, "/login", inertia.WithValidationErrors(errs))
			return
		}

		user, err := h.auth.Login(r.Context(), email, password)
		if err != nil {
			if errors.Is(err, service.ErrInvalidCredentials) {
				h.renderer.Redirect(w, r, "/login", inertia.WithFlash(inertia.Flash{
					"error": "Invalid email or password.",
				}))
				return
			}
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Reset rate limiter on successful login
		h.rateLimiter.Reset(ip)

		sess := session.FromContext(r.Context())
		if sess != nil {
			// Regenerate session ID for security and update the cookie
			sess.RegenerateWithCookie(w)

			// Set user data in session
			middleware.SetAuthUser(sess,
				service.UUIDToString(user.ID),
				user.Name,
				user.Email,
				user.Role,
			)

			// Handle Remember Me
			if rememberMe {
				session.SetRememberMe(w, service.UUIDToString(user.ID))
			}
		}

		// Redirect based on role
		redirectURL := "/"
		if user.Role == "admin" {
			redirectURL = "/admin"
		}

		h.renderer.Redirect(w, r, redirectURL, inertia.WithFlash(inertia.Flash{
			"success": "Welcome back, " + user.Name + "!",
		}))
	}
}

// Register creates a new user account.
func (h *AuthHandler) Register() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		fields, err := parseInput(r)
		if err != nil {
			h.renderer.Redirect(w, r, "/register", inertia.WithFlash(inertia.Flash{
				"error": "Invalid form data.",
			}))
			return
		}

		name := strings.TrimSpace(fields["name"])
		email := strings.TrimSpace(fields["email"])
		password := fields["password"]
		confirmPassword := fields["password_confirmation"]

		var errs inertia.ValidationErrors
		if name == "" {
			errs = appendFieldError(errs, "name", "Name is required.")
		}
		if email == "" {
			errs = appendFieldError(errs, "email", "Email is required.")
		}
		if password == "" {
			errs = appendFieldError(errs, "password", "Password is required.")
		} else if err := service.ValidatePassword(password); err != nil {
			errs = appendFieldError(errs, "password", err.Error())
		}
		if password != confirmPassword {
			errs = appendFieldError(errs, "password_confirmation", "Passwords do not match.")
		}

		if len(errs) > 0 {
			h.renderer.Redirect(w, r, "/register", inertia.WithValidationErrors(errs))
			return
		}

		user, err := h.auth.Register(r.Context(), name, email, password)
		if err != nil {
			if errors.Is(err, service.ErrEmailTaken) {
				h.renderer.Redirect(w, r, "/register", inertia.WithFlash(inertia.Flash{
					"error": "That email is already registered.",
				}))
				return
			}
			if errors.Is(err, service.ErrWeakPassword) {
				h.renderer.Redirect(w, r, "/register", inertia.WithFlash(inertia.Flash{
					"error": "Password does not meet security requirements.",
				}))
				return
			}
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		sess := session.FromContext(r.Context())
		if sess != nil {
			// Regenerate session ID for security and update the cookie
			sess.RegenerateWithCookie(w)

			// Set user data in session
			middleware.SetAuthUser(sess,
				service.UUIDToString(user.ID),
				user.Name,
				user.Email,
				user.Role,
			)
		}

		h.renderer.Redirect(w, r, "/", inertia.WithFlash(inertia.Flash{
			"success": "Welcome to GoCommerce, " + user.Name + "!",
		}))
	}
}

// Logout destroys the user session.
func (h *AuthHandler) Logout() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sess := session.FromContext(r.Context())
		if sess != nil {
			middleware.ClearAuthUser(sess)
			sess.Destroy()
		}

		// Clear remember me cookie
		session.ClearRememberMe(w)

		h.renderer.Redirect(w, r, "/login", inertia.WithFlash(inertia.Flash{
			"success": "You have been logged out.",
		}))
	}
}

func appendFieldError(errs inertia.ValidationErrors, field, msg string) inertia.ValidationErrors {
	if errs == nil {
		errs = make(inertia.ValidationErrors)
	}
	errs[field] = msg
	return errs
}

// parseInput reads form fields from a request body. Inertia submits data as a
// JSON body, so JSON is parsed first, falling back to form-encoded values.
func parseInput(r *http.Request) (map[string]string, error) {
	fields := make(map[string]string)

	contentType := r.Header.Get("Content-Type")
	if strings.HasPrefix(contentType, "application/json") {
		body, err := io.ReadAll(r.Body)
		if err != nil {
			return nil, err
		}
		if len(body) == 0 {
			return fields, nil
		}
		var raw map[string]any
		if err := json.Unmarshal(body, &raw); err != nil {
			return nil, err
		}
		for key, value := range raw {
			if value == nil {
				continue
			}
			if s, ok := value.(string); ok {
				fields[key] = s
			} else {
				fields[key] = fmt.Sprintf("%v", value)
			}
		}
		return fields, nil
	}

	if err := r.ParseForm(); err != nil {
		return nil, err
	}
	for key := range r.Form {
		fields[key] = r.Form.Get(key)
	}
	return fields, nil
}
