package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	inertia "github.com/mayahiro/go-inertia"

	"gocommerce/internal/db"
	"gocommerce/internal/service"
)

const (
	maxCouponCodeLength        = 64
	maxCouponDescriptionLength = 500
)

// AdminCouponHandler owns the admin coupon screens. It is separate from
// AdminHandler for the same reason admin_categories.go is a separate file —
// one promotion concern per unit — and holds only what it needs.
type AdminCouponHandler struct {
	renderer *inertia.Renderer
	queries  *db.Queries
}

func NewAdminCouponHandler(renderer *inertia.Renderer, queries *db.Queries) *AdminCouponHandler {
	return &AdminCouponHandler{renderer: renderer, queries: queries}
}

// couponForm is the JSON body posted by the admin coupon form. Like the product
// and category forms every numeric field arrives as a string, so "no limit"
// (empty) is distinguishable from a literal 0.
type couponForm struct {
	Code        string `json:"code"`
	Description string `json:"description"`
	IsActive    bool   `json:"is_active"`

	DiscountType      string `json:"discount_type"`
	DiscountValue     string `json:"discount_value"`
	MaxDiscountAmount string `json:"max_discount_amount"`

	MinOrderAmount   string `json:"min_order_amount"`
	MinOrderQuantity string `json:"min_order_quantity"`

	MaxUses            string `json:"max_uses"`
	MaxUsesPerCustomer string `json:"max_uses_per_customer"`

	// Datetime-local values ("2026-09-10T09:00"), interpreted in the server's
	// zone — the same zone the admin list and the engine compare against.
	StartsAt string `json:"starts_at"`
	EndsAt   string `json:"ends_at"`

	RedirectTo string `json:"redirect_to"`
}

func decodeCouponForm(r *http.Request) (*couponForm, error) {
	var form couponForm
	if err := json.NewDecoder(r.Body).Decode(&form); err != nil {
		return nil, err
	}
	return &form, nil
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

func (h *AdminCouponHandler) List() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		coupons, err := h.queries.ListCoupons(r.Context())
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		serialized := make([]map[string]any, len(coupons))
		for i, c := range coupons {
			serialized[i] = serializeCoupon(c)
		}

		h.renderer.Render(w, r, "Pages/Admin/Coupons/Index", inertia.Props{
			"coupons": serialized,
		})
	}
}

func (h *AdminCouponHandler) Create() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		h.renderer.Render(w, r, "Pages/Admin/Coupons/Create", inertia.Props{})
	}
}

func (h *AdminCouponHandler) Edit() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		couponUUID, err := parseUUID(chi.URLParam(r, "id"))
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/coupons", inertia.WithFlash(inertia.Flash{
				"error": "Invalid coupon ID.",
			}))
			return
		}

		coupon, err := h.queries.GetCouponByID(r.Context(), couponUUID)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/coupons", inertia.WithFlash(inertia.Flash{
				"error": "Coupon not found.",
			}))
			return
		}

		h.renderer.Render(w, r, "Pages/Admin/Coupons/Edit", inertia.Props{
			"coupon": serializeCoupon(coupon),
		})
	}
}

// serializeCoupon shapes a coupon for the admin pages. Money and dates go out
// as strings so the form can round-trip them into inputs without a float or a
// timezone conversion changing what the merchant typed.
func serializeCoupon(c db.Coupon) map[string]any {
	return map[string]any{
		"id":          fmt.Sprintf("%x", c.ID.Bytes),
		"code":        c.Code,
		"description": c.Description,
		"is_active":   c.IsActive,

		"discount_type":       c.DiscountType,
		"discount_value":      optionalNumericString(c.DiscountValue),
		"max_discount_amount": optionalNumericString(c.MaxDiscountAmount),

		"min_order_amount":   optionalNumericString(c.MinOrderAmount),
		"min_order_quantity": c.MinOrderQuantity,

		"max_uses":              nullableInt32(c.MaxUses),
		"max_uses_per_customer": nullableInt32(c.MaxUsesPerCustomer),
		"used_count":            c.UsedCount,

		"starts_at": formatDatetimeLocal(c.StartsAt),
		"ends_at":   formatDatetimeLocal(c.EndsAt),

		// Derived here so the list and the form agree on what "live" means
		// without either of them re-implementing the engine's date rules.
		"lifecycle": couponLifecycle(c),
	}
}

// couponLifecycle answers the question the merchant actually asks of the list:
// is this coupon working right now? It is display-only — the engine in
// service/coupon.go decides the real thing.
func couponLifecycle(c db.Coupon) string {
	if !c.IsActive {
		return "disabled"
	}

	now := time.Now()
	if c.StartsAt.Valid && now.Before(c.StartsAt.Time) {
		return "scheduled"
	}
	if c.EndsAt.Valid && !now.Before(c.EndsAt.Time) {
		return "expired"
	}
	if c.MaxUses.Valid && c.UsedCount >= c.MaxUses.Int32 {
		return "used_up"
	}
	return "active"
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

func (h *AdminCouponHandler) Store() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		form, err := decodeCouponForm(r)
		if err != nil {
			h.redirectWithErrors(w, r, "/admin/coupons/create", nil, "Could not read the submitted coupon data.")
			return
		}

		errs, values := h.validateCouponForm(r.Context(), form, nil)
		if len(errs) > 0 {
			h.redirectWithErrors(w, r, "/admin/coupons/create", errs, "Please correct the highlighted fields.")
			return
		}

		coupon, err := h.queries.CreateCoupon(r.Context(), db.CreateCouponParams{
			Code:               values.Code,
			Description:        values.Description,
			IsActive:           form.IsActive,
			DiscountType:       values.DiscountType,
			DiscountValue:      values.DiscountValue,
			MaxDiscountAmount:  values.MaxDiscountAmount,
			MinOrderAmount:     values.MinOrderAmount,
			MinOrderQuantity:   values.MinOrderQuantity,
			MaxUses:            values.MaxUses,
			MaxUsesPerCustomer: values.MaxUsesPerCustomer,
			StartsAt:           values.StartsAt,
			EndsAt:             values.EndsAt,
		})
		if err != nil {
			h.redirectWithErrors(w, r, "/admin/coupons/create", nil, "Failed to create coupon: "+err.Error())
			return
		}

		target := "/admin/coupons"
		if form.RedirectTo == "edit" {
			target = fmt.Sprintf("/admin/coupons/%x/edit", coupon.ID.Bytes)
		}

		h.renderer.Redirect(w, r, target, inertia.WithFlash(inertia.Flash{
			"success": fmt.Sprintf("Coupon %q created.", coupon.Code),
		}))
	}
}

func (h *AdminCouponHandler) Update() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		couponUUID, err := parseUUID(id)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/coupons", inertia.WithFlash(inertia.Flash{
				"error": "Invalid coupon ID.",
			}))
			return
		}

		editURL := "/admin/coupons/" + id + "/edit"

		form, err := decodeCouponForm(r)
		if err != nil {
			h.redirectWithErrors(w, r, editURL, nil, "Could not read the submitted coupon data.")
			return
		}

		errs, values := h.validateCouponForm(r.Context(), form, &couponUUID)
		if len(errs) > 0 {
			h.redirectWithErrors(w, r, editURL, errs, "Please correct the highlighted fields.")
			return
		}

		coupon, err := h.queries.UpdateCoupon(r.Context(), db.UpdateCouponParams{
			ID:                 couponUUID,
			Code:               values.Code,
			Description:        values.Description,
			IsActive:           form.IsActive,
			DiscountType:       values.DiscountType,
			DiscountValue:      values.DiscountValue,
			MaxDiscountAmount:  values.MaxDiscountAmount,
			MinOrderAmount:     values.MinOrderAmount,
			MinOrderQuantity:   values.MinOrderQuantity,
			MaxUses:            values.MaxUses,
			MaxUsesPerCustomer: values.MaxUsesPerCustomer,
			StartsAt:           values.StartsAt,
			EndsAt:             values.EndsAt,
		})
		if err != nil {
			h.redirectWithErrors(w, r, editURL, nil, "Failed to update coupon: "+err.Error())
			return
		}

		target := "/admin/coupons"
		if form.RedirectTo == "edit" {
			target = editURL
		}

		h.renderer.Redirect(w, r, target, inertia.WithFlash(inertia.Flash{
			"success": fmt.Sprintf("Coupon %q updated.", coupon.Code),
		}))
	}
}

func (h *AdminCouponHandler) Delete() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		couponUUID, err := parseUUID(chi.URLParam(r, "id"))
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/coupons", inertia.WithFlash(inertia.Flash{
				"error": "Invalid coupon ID.",
			}))
			return
		}

		if err := h.queries.DeleteCoupon(r.Context(), couponUUID); err != nil {
			h.renderer.Redirect(w, r, "/admin/coupons", inertia.WithFlash(inertia.Flash{
				"error": "Failed to delete coupon.",
			}))
			return
		}

		// Redemption rows cascade with the coupon, but past orders keep their
		// coupon_code and discount, so order history is unaffected.
		h.renderer.Redirect(w, r, "/admin/coupons", inertia.WithFlash(inertia.Flash{
			"success": "Coupon deleted.",
		}))
	}
}

func (h *AdminCouponHandler) redirectWithErrors(
	w http.ResponseWriter,
	r *http.Request,
	url string,
	errs inertia.ValidationErrors,
	message string,
) {
	opts := []inertia.RedirectOption{inertia.WithFlash(inertia.Flash{"error": message})}
	if len(errs) > 0 {
		opts = append(opts, inertia.WithValidationErrors(errs))
	}
	h.renderer.Redirect(w, r, url, opts...)
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

// couponValues holds the parsed, storage-ready form so Store and Update do not
// re-parse what validation already converted.
type couponValues struct {
	Code               string
	Description        string
	DiscountType       string
	DiscountValue      pgtype.Numeric
	MaxDiscountAmount  pgtype.Numeric
	MinOrderAmount     pgtype.Numeric
	MinOrderQuantity   int32
	MaxUses            pgtype.Int4
	MaxUsesPerCustomer pgtype.Int4
	StartsAt           pgtype.Timestamptz
	EndsAt             pgtype.Timestamptz
}

// validateCouponForm mirrors the client-side rules in
// Components/Admin/Coupons/couponFormState.js and stays authoritative:
// uniqueness in particular can only be settled here.
func (h *AdminCouponHandler) validateCouponForm(
	ctx context.Context,
	form *couponForm,
	excludeID *pgtype.UUID,
) (inertia.ValidationErrors, couponValues) {
	errs := inertia.ValidationErrors{}
	values := couponValues{}

	values.Code = h.validateCouponCode(ctx, errs, form.Code, excludeID)

	description := strings.TrimSpace(form.Description)
	if len(description) > maxCouponDescriptionLength {
		errs["description"] = fmt.Sprintf("Internal note must be %d characters or fewer.", maxCouponDescriptionLength)
	}
	values.Description = description

	values.DiscountType, values.DiscountValue, values.MaxDiscountAmount = validateCouponDiscount(errs, form)

	values.MinOrderAmount = validateCouponMoney(errs, "min_order_amount", form.MinOrderAmount, 0)
	values.MinOrderQuantity = int32(validateCouponCount(errs, "min_order_quantity", form.MinOrderQuantity, 0))

	values.MaxUses = validateCouponLimit(errs, "max_uses", form.MaxUses)
	values.MaxUsesPerCustomer = validateCouponLimit(errs, "max_uses_per_customer", form.MaxUsesPerCustomer)

	values.StartsAt, values.EndsAt = validateCouponDates(errs, form)

	return errs, values
}

func (h *AdminCouponHandler) validateCouponCode(
	ctx context.Context,
	errs inertia.ValidationErrors,
	raw string,
	excludeID *pgtype.UUID,
) string {
	code := service.NormalizeCode(raw)

	switch {
	case code == "":
		errs["code"] = "Coupon code is required."
		return code
	case len(code) > maxCouponCodeLength:
		errs["code"] = fmt.Sprintf("Coupon code must be %d characters or fewer.", maxCouponCodeLength)
		return code
	}

	// Customers type this at checkout and it travels in URLs and emails, so it
	// is held to letters, digits, hyphens and underscores.
	for _, r := range code {
		valid := (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' || r == '_'
		if !valid {
			errs["code"] = "Coupon code can only contain letters, numbers, hyphens and underscores."
			return code
		}
	}

	exclude := pgtype.UUID{Valid: false}
	if excludeID != nil {
		exclude = *excludeID
	}

	count, err := h.queries.CountCouponsByCode(ctx, db.CountCouponsByCodeParams{
		Code:      code,
		ExcludeID: exclude,
	})
	if err == nil && count > 0 {
		errs["code"] = "Another coupon already uses that code."
	}

	return code
}

// validateCouponDiscount enforces the rules of the selected type and returns
// only the fields that type actually uses, so a value left behind by switching
// type is never stored.
func validateCouponDiscount(errs inertia.ValidationErrors, form *couponForm) (string, pgtype.Numeric, pgtype.Numeric) {
	discountType := strings.TrimSpace(form.DiscountType)

	zero := floatToNumeric(0)
	none := pgtype.Numeric{Valid: false}

	switch discountType {
	case service.DiscountTypeFreeShipping:
		// Carries no amount at all; the shipping line is simply zeroed.
		return discountType, zero, none

	case service.DiscountTypePercentage:
		value := validateCouponMoney(errs, "discount_value", form.DiscountValue, -1)
		if _, failed := errs["discount_value"]; !failed {
			switch percent := numericFloat(value); {
			case percent <= 0:
				errs["discount_value"] = "Enter a percentage greater than 0."
			case percent > 100:
				errs["discount_value"] = "A percentage discount cannot exceed 100%."
			}
		}

		// The cap is optional; blank means uncapped.
		capValue := none
		if strings.TrimSpace(form.MaxDiscountAmount) != "" {
			capValue = validateCouponMoney(errs, "max_discount_amount", form.MaxDiscountAmount, -1)
			if _, failed := errs["max_discount_amount"]; !failed && numericFloat(capValue) <= 0 {
				errs["max_discount_amount"] = "Enter a maximum discount greater than 0, or leave it blank for no cap."
			}
		}
		return discountType, value, capValue

	case service.DiscountTypeFixed:
		value := validateCouponMoney(errs, "discount_value", form.DiscountValue, -1)
		if _, failed := errs["discount_value"]; !failed && numericFloat(value) <= 0 {
			errs["discount_value"] = "Enter a discount amount greater than 0."
		}
		// A cap on a fixed amount is meaningless, so it is never stored.
		return discountType, value, none

	default:
		errs["discount_type"] = "Choose a discount type."
		return discountType, zero, none
	}
}

// validateCouponMoney parses a money field. A blank value yields `fallback`
// when that is >= 0, and is reported as required otherwise.
func validateCouponMoney(errs inertia.ValidationErrors, field, raw string, fallback float64) pgtype.Numeric {
	value := strings.TrimSpace(raw)

	if value == "" {
		if fallback < 0 {
			errs[field] = "This value is required."
			return floatToNumeric(0)
		}
		return floatToNumeric(fallback)
	}

	parsed, err := strconv.ParseFloat(value, 64)
	if err != nil {
		errs[field] = "Enter a valid amount."
		return floatToNumeric(0)
	}
	if parsed < 0 {
		errs[field] = "Value cannot be negative."
		return floatToNumeric(0)
	}

	return floatToNumeric(parsed)
}

func validateCouponCount(errs inertia.ValidationErrors, field, raw string, fallback int) int {
	value := strings.TrimSpace(raw)
	if value == "" {
		return fallback
	}

	parsed, err := strconv.Atoi(value)
	if err != nil {
		errs[field] = "Enter a whole number."
		return fallback
	}
	if parsed < 0 {
		errs[field] = "Value cannot be negative."
		return fallback
	}
	return parsed
}

// validateCouponLimit parses a usage limit, where blank means unlimited. Zero is
// refused because a limit of zero would make the coupon unusable, which the
// merchant almost certainly did not intend — disabling it is the way to do that.
func validateCouponLimit(errs inertia.ValidationErrors, field, raw string) pgtype.Int4 {
	value := strings.TrimSpace(raw)
	if value == "" {
		return pgtype.Int4{Valid: false}
	}

	parsed, err := strconv.Atoi(value)
	if err != nil {
		errs[field] = "Enter a whole number, or leave blank for unlimited."
		return pgtype.Int4{Valid: false}
	}
	if parsed < 1 {
		errs[field] = "Enter a limit of at least 1, or leave blank for unlimited."
		return pgtype.Int4{Valid: false}
	}

	return pgtype.Int4{Int32: int32(parsed), Valid: true}
}

// validateCouponDates parses the two datetime-local values and refuses a window
// that could never open.
func validateCouponDates(errs inertia.ValidationErrors, form *couponForm) (pgtype.Timestamptz, pgtype.Timestamptz) {
	starts := parseDatetimeLocal(errs, "starts_at", form.StartsAt)
	ends := parseDatetimeLocal(errs, "ends_at", form.EndsAt)

	if starts.Valid && ends.Valid && !ends.Time.After(starts.Time) {
		errs["ends_at"] = "The end date must be after the start date."
	}

	return starts, ends
}

// parseDatetimeLocal reads the value an <input type="datetime-local"> posts.
// Blank is legitimate and means "no bound", which is why it is not an error.
func parseDatetimeLocal(errs inertia.ValidationErrors, field, raw string) pgtype.Timestamptz {
	value := strings.TrimSpace(raw)
	if value == "" {
		return pgtype.Timestamptz{Valid: false}
	}

	for _, layout := range []string{"2006-01-02T15:04:05", "2006-01-02T15:04", "2006-01-02"} {
		if parsed, err := time.ParseInLocation(layout, value, time.Local); err == nil {
			return pgtype.Timestamptz{Time: parsed, Valid: true}
		}
	}

	errs[field] = "Enter a valid date and time."
	return pgtype.Timestamptz{Valid: false}
}

// formatDatetimeLocal is the inverse, so an edited coupon reloads showing the
// same wall-clock time the merchant originally entered.
func formatDatetimeLocal(ts pgtype.Timestamptz) string {
	if !ts.Valid {
		return ""
	}
	return ts.Time.In(time.Local).Format("2006-01-02T15:04")
}

func nullableInt32(v pgtype.Int4) any {
	if !v.Valid {
		return nil
	}
	return v.Int32
}

func numericFloat(n pgtype.Numeric) float64 {
	if !n.Valid {
		return 0
	}
	v, err := n.Float64Value()
	if err != nil || !v.Valid {
		return 0
	}
	return v.Float64
}
