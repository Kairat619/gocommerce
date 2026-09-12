package handler

import (
	"fmt"
	"log"
	"net"
	"net/http"
	"net/mail"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	inertia "github.com/mayahiro/go-inertia"

	"gocommerce/internal/config"
	"gocommerce/internal/db"
	"gocommerce/internal/middleware"
	"gocommerce/internal/service"
	"gocommerce/internal/session"
)

// ---------------------------------------------------------------------------
// The configuration centre
//
// Settings are not a CRUD screen. One field here changes what every shopper is
// charged, what currency every price in the application is rendered in, and
// what a new product starts life as. The shape of this handler follows from
// that.
//
// ONE SECTION SAVES AT A TIME
//
// Each section is its own page with its own form and its own Save. An
// administrator adjusting the catalogue page size should not be submitting the
// tax rate at the same time, because a form that posts everything is a form
// that can change anything by accident.
//
// The singleton row is still written whole — the handler loads the current
// configuration, applies only its own section's fields on top, and saves the
// result. Saving one page therefore cannot blank another page's values.
//
// EVERY SECTION IS BACKED BY SOMETHING THAT ACTUALLY READS IT
//
// There is no Email section, because the application has no mail transport of
// any kind. No Payments section, because there is no gateway. No Shipping
// carriers, because a flat fee is the entire shipping model. No languages,
// because there is no translation layer. No guest-checkout toggle, because
// orders.user_id is NOT NULL and every order requires an account — the toggle
// could be stored, but it could never be honoured.
//
// A control that persists nothing is worse than a missing feature: it tells the
// administrator they have configured something.
//
// SECRETS ARE NOT SETTINGS
//
// The System section is READ ONLY and shows status, never values. Session keys,
// R2 credentials and the database URL are read from the environment by
// internal/config, and this handler deliberately has no path that writes them.
// ---------------------------------------------------------------------------

type AdminSettingsHandler struct {
	renderer *inertia.Renderer
	queries  *db.Queries
	settings *service.SettingsService
	config   *config.Config
}

func NewAdminSettingsHandler(
	renderer *inertia.Renderer,
	queries *db.Queries,
	settings *service.SettingsService,
	cfg *config.Config,
) *AdminSettingsHandler {
	return &AdminSettingsHandler{renderer: renderer, queries: queries, settings: settings, config: cfg}
}

const settingsActivityLimit = 8

// settingsSection is one page of the configuration centre.
//
// keywords back the settings search. They are the words an administrator would
// actually type — "vat" for the tax rate, "brand" for the store name — rather
// than the field names, which they would have to already know to search for.
type settingsSection struct {
	Key         string
	Label       string
	Description string
	Icon        string
	Editable    bool
	Keywords    []string
	// fields are the audit keys this section owns, so each page can show its
	// own recent changes without loading the whole log.
	Fields []string
}

// settingsSections is the navigation, in display order. Adding a section is
// adding an entry here plus a case in apply() — the sidebar, the index cards
// and the search index are all generated from this list.
var settingsSections = []settingsSection{
	{
		Key:         "general",
		Label:       "General",
		Description: "Store name, description and the contact details shown to shoppers.",
		Icon:        "store",
		Editable:    true,
		Keywords:    []string{"store name", "brand", "title", "description", "email", "phone", "contact", "address"},
		Fields:      []string{"store_name", "store_description", "store_email", "store_phone"},
	},
	{
		Key:         "localization",
		Label:       "Localization",
		Description: "Currency and the timezone every date in the admin is read in.",
		Icon:        "globe",
		Editable:    true,
		Keywords:    []string{"currency", "money", "price", "symbol", "timezone", "time zone", "locale", "language", "format"},
		Fields:      []string{"currency"},
	},
	{
		Key:         "catalog",
		Label:       "Catalogue",
		Description: "Storefront paging and the values a new product starts with.",
		Icon:        "tag",
		Editable:    true,
		Keywords: []string{
			"products per page", "paging", "pagination", "catalogue", "catalog",
			"product defaults", "inventory", "stock", "backorder", "low stock", "threshold", "status",
		},
		Fields: []string{
			"products_per_page", "default_product_active", "default_track_inventory",
			"default_allow_backorders", "default_low_stock_threshold",
		},
	},
	{
		Key:         "checkout",
		Label:       "Tax & Shipping",
		Description: "What every order is charged at checkout.",
		Icon:        "receipt",
		Editable:    true,
		Keywords:    []string{"tax", "vat", "rate", "shipping", "delivery", "fee", "free shipping", "threshold", "checkout"},
		Fields:      []string{"tax_rate_percent", "shipping_cost", "free_shipping_threshold"},
	},
	{
		Key:         "system",
		Label:       "System",
		Description: "Deployment status and service connections. Read only.",
		Icon:        "server",
		Editable:    false,
		Keywords:    []string{"environment", "url", "storage", "r2", "uploads", "session", "security", "credentials", "secrets", "version"},
	},
}

func findSettingsSection(key string) (settingsSection, bool) {
	for _, section := range settingsSections {
		if section.Key == key {
			return section, true
		}
	}
	return settingsSection{}, false
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

// Index is the configuration centre's landing page: every section as a card,
// plus the most recent configuration changes.
func (h *AdminSettingsHandler) Index() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		h.renderer.Render(w, r, "Pages/Admin/Settings/Index", inertia.Props{
			"sections": serializeSections(),
			"activity": h.recentActivity(r, nil),
			"store": map[string]any{
				"name":     h.settings.Get(r.Context()).StoreName,
				"currency": h.settings.Get(r.Context()).Currency,
			},
		})
	}
}

// Show renders one section.
func (h *AdminSettingsHandler) Show() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		key := chi.URLParam(r, "section")
		section, ok := findSettingsSection(key)
		if !ok {
			h.renderer.Redirect(w, r, "/admin/settings", inertia.WithFlash(inertia.Flash{
				"error": "That settings section does not exist.",
			}))
			return
		}

		settings := h.settings.Get(r.Context())

		props := inertia.Props{
			"sections": serializeSections(),
			"section":  serializeSection(section),
			"settings": serializeSettings(settings),
			"activity": h.recentActivity(r, section.Fields),
		}

		// The System section reads deployment state rather than the settings
		// row, and is the only section with no form.
		if key == "system" {
			props["system"] = h.systemStatus()
		}
		if key == "localization" {
			props["currencies"] = supportedCurrencies()
			props["timezone"] = h.timezoneInfo()
		}

		h.renderer.Render(w, r, "Pages/Admin/Settings/Section", props)
	}
}

func serializeSections() []map[string]any {
	out := make([]map[string]any, len(settingsSections))
	for i, section := range settingsSections {
		out[i] = serializeSection(section)
	}
	return out
}

func serializeSection(section settingsSection) map[string]any {
	return map[string]any{
		"key":         section.Key,
		"label":       section.Label,
		"description": section.Description,
		"icon":        section.Icon,
		"editable":    section.Editable,
		"keywords":    section.Keywords,
	}
}

// serializeSettings sends the whole configuration to every section page.
//
// It is a dozen scalar values, so splitting it per section would buy nothing
// and would stop a section from explaining a value it does not own — the
// Catalogue page saying "prices show in USD" needs the currency without
// owning it.
//
// tax_rate_percent is a PERCENTAGE here (8.25), while the tax_rate prop on
// checkout and the product form is a FRACTION (0.0825). That distinction
// predates this page and is load-bearing; see API_CONTRACT.md.
func serializeSettings(s service.StoreSettings) map[string]any {
	return map[string]any{
		"tax_rate_percent":        s.TaxRate * 100,
		"shipping_cost":           s.ShippingCost,
		"free_shipping_threshold": s.FreeShippingThreshold,

		"store_name":        s.StoreName,
		"store_description": s.StoreDescription,
		"store_email":       s.StoreEmail,
		"store_phone":       s.StorePhone,

		"currency":          s.Currency,
		"products_per_page": s.ProductsPerPage,

		"default_product_active":      s.DefaultProductActive,
		"default_track_inventory":     s.DefaultTrackInventory,
		"default_allow_backorders":    s.DefaultAllowBackorders,
		"default_low_stock_threshold": s.DefaultLowStockThreshold,
	}
}

// recentActivity returns the configuration history, optionally narrowed to one
// section's fields. A failure here is never fatal: the audit trail is a record
// of changes, not a prerequisite for making one.
func (h *AdminSettingsHandler) recentActivity(r *http.Request, keys []string) []map[string]any {
	var (
		rows []db.SettingsActivity
		err  error
	)

	if len(keys) == 0 {
		rows, err = h.queries.ListSettingsActivity(r.Context(), settingsActivityLimit)
	} else {
		rows, err = h.queries.ListSettingsActivityForKeys(r.Context(), db.ListSettingsActivityForKeysParams{
			SettingKeys: keys,
			ResultLimit: settingsActivityLimit,
		})
	}
	if err != nil {
		return []map[string]any{}
	}

	out := make([]map[string]any, len(rows))
	for i, row := range rows {
		out[i] = map[string]any{
			"id":             fmt.Sprintf("%x", row.ID.Bytes),
			"actor_name":     row.ActorName,
			"setting_key":    row.SettingKey,
			"previous_value": row.PreviousValue,
			"new_value":      row.NewValue,
			"created_at":     row.CreatedAt.Time.Format(time.RFC3339),
		}
	}
	return out
}

// systemStatus reports deployment state.
//
// STATUS, NEVER VALUES. Each entry says whether something is configured and,
// where it is harmless, what it points at — a bucket name, a public URL. No
// access key, secret, session key or database password is read here, and the
// database URL is reduced to its host so the page can say "connected to
// db.example.com" without publishing the password embedded in the DSN.
func (h *AdminSettingsHandler) systemStatus() map[string]any {
	cfg := h.config

	sessionState := "configured"
	sessionDetail := "A session key is set for this deployment."
	if cfg.Session.Key == "" || cfg.Session.Key == "change-me-in-production" {
		sessionState = "warning"
		sessionDetail = "Running on the built-in development key. Set SESSION_KEY before going to production."
	}

	storageState := "configured"
	storageDetail := fmt.Sprintf("Uploads go to the %q bucket.", cfg.R2.Bucket)
	if !cfg.R2Enabled() {
		storageState = "not_configured"
		storageDetail = "No object storage is configured, so product image uploads will fail. Set R2_ENDPOINT, R2_ACCESS_KEY, R2_SECRET_KEY and R2_BUCKET."
	}

	return map[string]any{
		"environment":      cfg.AppEnv,
		"app_url":          cfg.AppURL,
		"database_host":    databaseHost(cfg.Database.URL),
		"session_state":    sessionState,
		"session_detail":   sessionDetail,
		"storage_state":    storageState,
		"storage_detail":   storageDetail,
		"storage_public":   cfg.R2.PublicURL,
		"max_upload_mb":    cfg.Upload.MaxSize / (1 << 20),
		"login_rate_limit": cfg.RateLimit.Login,
	}
}

// databaseHost extracts just the host from a DSN.
//
// A DSN carries the password in userinfo, so it is never sent to the browser
// whole. On a string that will not parse, this returns "" rather than risking
// leaking a fragment of it.
func databaseHost(dsn string) string {
	parsed, err := url.Parse(dsn)
	if err != nil || parsed.Host == "" {
		return ""
	}
	if host, _, err := net.SplitHostPort(parsed.Host); err == nil {
		return host
	}
	return parsed.Host
}

// timezoneInfo describes the timezone the application actually runs in.
//
// It is reported, not configured. Every date window in the application —
// the dashboard's periods, the orders list's date filters, coupon start and end
// times — is computed with time.Now() in the server's local zone. Offering a
// timezone picker here would imply those follow it, and they would not: making
// them follow it is a change to date-handling across three screens, not a
// setting. So this states the truth and says where it comes from.
func (h *AdminSettingsHandler) timezoneInfo() map[string]any {
	now := time.Now()
	zone, offset := now.Zone()

	return map[string]any{
		"name":   now.Location().String(),
		"abbrev": zone,
		"offset": fmt.Sprintf("UTC%+03d:%02d", offset/3600, (abs(offset)%3600)/60),
		"now":    now.Format(time.RFC3339),
	}
}

func abs(n int) int {
	if n < 0 {
		return -n
	}
	return n
}

// supportedCurrencies is the list the currency picker offers.
//
// Every entry is a currency Intl.NumberFormat can render in the browser, which
// is the only thing "supporting" a currency means here: amounts are stored as
// plain decimals with no currency of their own, so this setting changes the
// symbol every price is drawn with and nothing else. There is no conversion,
// because there is no rate table and no per-order currency column to convert
// between.
func supportedCurrencies() []map[string]any {
	return []map[string]any{
		{"code": "USD", "label": "US Dollar"},
		{"code": "EUR", "label": "Euro"},
		{"code": "GBP", "label": "British Pound"},
		{"code": "KZT", "label": "Kazakhstani Tenge"},
		{"code": "RUB", "label": "Russian Ruble"},
		{"code": "TRY", "label": "Turkish Lira"},
		{"code": "AED", "label": "UAE Dirham"},
		{"code": "CNY", "label": "Chinese Yuan"},
		{"code": "JPY", "label": "Japanese Yen"},
		{"code": "CAD", "label": "Canadian Dollar"},
		{"code": "AUD", "label": "Australian Dollar"},
		{"code": "INR", "label": "Indian Rupee"},
	}
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

// Update saves one section.
//
// The server is authoritative. The React forms validate for immediate feedback,
// and everything they check is re-checked here, because a form control is a
// convenience and not a constraint.
func (h *AdminSettingsHandler) Update() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		key := chi.URLParam(r, "section")
		section, ok := findSettingsSection(key)
		if !ok || !section.Editable {
			// A POST to the read-only System section is refused rather than
			// ignored: the UI never offers it, so reaching here means something
			// bypassed the UI.
			h.renderer.Redirect(w, r, "/admin/settings", inertia.WithFlash(inertia.Flash{
				"error": "That settings section cannot be edited.",
			}))
			return
		}

		target := "/admin/settings/" + section.Key

		fields, err := parseInput(r)
		if err != nil {
			h.redirectWithError(w, r, target, "Could not read the submitted settings.")
			return
		}

		current := h.settings.Get(r.Context())
		updated := current
		errs := inertia.ValidationErrors{}

		applySettingsSection(section.Key, fields, &updated, errs)

		if len(errs) > 0 {
			h.renderer.Redirect(w, r, target, inertia.WithValidationErrors(errs))
			return
		}

		changes := current.Diff(updated)
		if len(changes) == 0 {
			h.renderer.Redirect(w, r, target, inertia.WithFlash(inertia.Flash{
				"success": "No changes to save.",
			}))
			return
		}

		saved, err := h.settings.Update(r.Context(), updated)
		if err != nil {
			h.redirectWithError(w, r, target, "Failed to save settings: "+err.Error())
			return
		}

		h.recordChanges(r, changes)

		h.renderer.Redirect(w, r, target, inertia.WithFlash(inertia.Flash{
			"success": settingsSavedMessage(section, saved),
		}))
	}
}

// settingsSavedMessage says what actually happened, including when a change
// reaches shoppers later than it reaches this page.
//
// The configuration is cached per process and the storefront reads it when it
// renders, so a change is live on the next page load rather than in already
// open tabs. Claiming it is instant would be a small lie that costs a support
// ticket.
func settingsSavedMessage(section settingsSection, saved service.StoreSettings) string {
	switch section.Key {
	case "general", "localization":
		return "Settings saved. The storefront picks this up on its next page load."
	case "catalog":
		return "Settings saved. Product defaults apply to newly created products only."
	case "checkout":
		return fmt.Sprintf(
			"Settings saved. New orders are charged %.2f%% tax; orders already placed keep the totals they were charged.",
			saved.TaxRate*100,
		)
	default:
		return "Settings saved."
	}
}

// applySettingsSection validates one section's fields onto the configuration.
//
// Only the named section's fields are touched. Everything else on `updated`
// keeps the value it was loaded with, which is what makes saving one page safe
// for the others.
func applySettingsSection(key string, fields map[string]string, updated *service.StoreSettings, errs inertia.ValidationErrors) {
	switch key {
	case "general":
		name := strings.TrimSpace(fields["store_name"])
		switch {
		case name == "":
			errs["store_name"] = "Store name is required — it is the name shoppers see."
		case len(name) > 255:
			errs["store_name"] = "Store name must be 255 characters or fewer."
		default:
			updated.StoreName = name
		}

		description := strings.TrimSpace(fields["store_description"])
		if len(description) > 1000 {
			errs["store_description"] = "Store description must be 1000 characters or fewer."
		} else {
			updated.StoreDescription = description
		}

		// Optional, but must be valid when given: a malformed contact address
		// published to the storefront is worse than none.
		email := strings.TrimSpace(fields["store_email"])
		if email != "" {
			if _, err := mail.ParseAddress(email); err != nil {
				errs["store_email"] = "Enter a valid email address, or leave this blank."
			}
		}
		if _, ok := errs["store_email"]; !ok {
			updated.StoreEmail = email
		}

		phone := strings.TrimSpace(fields["store_phone"])
		if len(phone) > 50 {
			errs["store_phone"] = "Phone number must be 50 characters or fewer."
		} else {
			updated.StorePhone = phone
		}

	case "localization":
		currency := strings.ToUpper(strings.TrimSpace(fields["currency"]))
		if !isSupportedCurrency(currency) {
			errs["currency"] = "Choose one of the supported currencies."
		} else {
			updated.Currency = currency
		}

	case "catalog":
		perPage, err := strconv.Atoi(strings.TrimSpace(fields["products_per_page"]))
		if err != nil || perPage < 1 || perPage > 60 {
			errs["products_per_page"] = "Products per page must be a whole number between 1 and 60."
		} else {
			updated.ProductsPerPage = perPage
		}

		threshold, err := strconv.Atoi(strings.TrimSpace(fields["default_low_stock_threshold"]))
		if err != nil || threshold < 0 {
			errs["default_low_stock_threshold"] = "Low stock threshold must be zero or a positive whole number."
		} else {
			updated.DefaultLowStockThreshold = threshold
		}

		updated.DefaultProductActive = parseSettingsBool(fields["default_product_active"])
		updated.DefaultTrackInventory = parseSettingsBool(fields["default_track_inventory"])
		updated.DefaultAllowBackorders = parseSettingsBool(fields["default_allow_backorders"])

	case "checkout":
		taxPercent, err := strconv.ParseFloat(strings.TrimSpace(fields["tax_rate_percent"]), 64)
		if err != nil || taxPercent < 0 || taxPercent > 100 {
			errs["tax_rate_percent"] = "Tax rate must be a number between 0 and 100."
		} else {
			// Stored as a fraction; shown as a percentage. See API_CONTRACT.md.
			updated.TaxRate = taxPercent / 100
		}

		shippingCost, err := strconv.ParseFloat(strings.TrimSpace(fields["shipping_cost"]), 64)
		if err != nil || shippingCost < 0 {
			errs["shipping_cost"] = "Shipping fee must be a non-negative number."
		} else {
			updated.ShippingCost = shippingCost
		}

		freeThreshold, err := strconv.ParseFloat(strings.TrimSpace(fields["free_shipping_threshold"]), 64)
		if err != nil || freeThreshold < 0 {
			errs["free_shipping_threshold"] = "Free shipping threshold must be a non-negative number."
		} else {
			updated.FreeShippingThreshold = freeThreshold
		}
	}
}

func isSupportedCurrency(code string) bool {
	for _, currency := range supportedCurrencies() {
		if currency["code"] == code {
			return true
		}
	}
	return false
}

// parseSettingsBool reads a toggle. An absent or unrecognised value is false,
// which is how an unchecked box arrives.
func parseSettingsBool(raw string) bool {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "1", "true", "on", "yes":
		return true
	default:
		return false
	}
}

// recordChanges writes the audit trail.
//
// Fire-and-forget, like the order activity written at checkout: a configuration
// change that succeeded must not be reported as failed because its log entry
// could not be written. A failure is logged for the operator instead.
//
// Only the changes computed by StoreSettings.Diff reach this, and Diff only
// covers the database-backed settings — no environment value has a code path
// that could arrive here.
func (h *AdminSettingsHandler) recordChanges(r *http.Request, changes []service.SettingChange) {
	actorID, actorName := h.settingsActor(r)

	for _, change := range changes {
		_, err := h.queries.CreateSettingsActivity(r.Context(), db.CreateSettingsActivityParams{
			UserID:        actorID,
			ActorName:     actorName,
			SettingKey:    change.Key,
			PreviousValue: change.Previous,
			NewValue:      change.New,
		})
		if err != nil {
			log.Printf("settings: could not record change to %s: %v", change.Key, err)
		}
	}
}

func (h *AdminSettingsHandler) settingsActor(r *http.Request) (pgtype.UUID, string) {
	sess := session.FromContext(r.Context())
	if sess == nil {
		return pgtype.UUID{}, ""
	}

	rawID, ok := middleware.GetUserID(sess)
	if !ok {
		return pgtype.UUID{}, ""
	}

	actorID, err := parseUUID(rawID)
	if err != nil {
		return pgtype.UUID{}, ""
	}

	user, err := h.queries.GetUserByID(r.Context(), actorID)
	if err != nil {
		return actorID, ""
	}
	return actorID, user.Name
}

func (h *AdminSettingsHandler) redirectWithError(w http.ResponseWriter, r *http.Request, target, message string) {
	h.renderer.Redirect(w, r, target, inertia.WithFlash(inertia.Flash{"error": message}))
}
