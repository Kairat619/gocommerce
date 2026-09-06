package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	inertia "github.com/mayahiro/go-inertia"

	"gocommerce/internal/db"
)

const (
	maxAttributeCodeLength  = 100
	maxAttributeValueLength = 255

	// Generous, but bounded: one POST must not be able to write an unbounded
	// number of option rows.
	maxAttributeOptions = 200
)

// optionTypes are the attribute types whose values come from a fixed list.
// Every other type stores a free-typed value on the product instead, so the
// values editor is hidden for them and any posted options are ignored.
var optionTypes = map[string]bool{"select": true, "multiselect": true}

// AdminAttributeHandler owns the admin attribute screens.
//
// Attributes are Commerce Core foundation: `is_variant` already drives variant
// combinations in the product form, and product_attributes rows reference both
// the attribute and its options. So this handler is markedly more conservative
// than the category or collection ones — see persist() for the diffing rules.
type AdminAttributeHandler struct {
	renderer *inertia.Renderer
	queries  *db.Queries
	pool     *pgxpool.Pool
}

func NewAdminAttributeHandler(renderer *inertia.Renderer, queries *db.Queries, pool *pgxpool.Pool) *AdminAttributeHandler {
	return &AdminAttributeHandler{renderer: renderer, queries: queries, pool: pool}
}

// attributeOptionForm is one row of the values editor.
//
// ID is empty for a value the merchant has just added and carries the existing
// attribute_options id for one that is already stored. That distinction is what
// lets persist() rename a value in place instead of deleting and recreating it,
// which would blank product_attributes.option_id (ON DELETE SET NULL) on every
// product carrying it.
type attributeOptionForm struct {
	ID    string `json:"id"`
	Value string `json:"value"`
}

type attributeForm struct {
	Name string `json:"name"`
	Code string `json:"code"`
	Type string `json:"type"`

	IsRequired bool   `json:"is_required"`
	IsVariant  bool   `json:"is_variant"`
	SortOrder  string `json:"sort_order"`

	// Order in this slice is the stored sort_order, exactly as with a
	// collection's products.
	Options []attributeOptionForm `json:"options"`

	RedirectTo string `json:"redirect_to"`
}

func decodeAttributeForm(r *http.Request) (*attributeForm, error) {
	var form attributeForm
	if err := json.NewDecoder(r.Body).Decode(&form); err != nil {
		return nil, err
	}
	return &form, nil
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

func (h *AdminAttributeHandler) List() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		attributes, err := h.queries.ListAttributesWithUsage(r.Context())
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		serialized := make([]map[string]any, len(attributes))
		for i, a := range attributes {
			serialized[i] = map[string]any{
				"id":            fmt.Sprintf("%x", a.ID.Bytes),
				"code":          a.Code,
				"name":          a.Name,
				"type":          a.Type,
				"is_required":   a.IsRequired,
				"is_variant":    a.IsVariant,
				"sort_order":    a.SortOrder,
				"option_count":  a.OptionCount,
				"product_count": a.ProductCount,
			}
		}

		h.renderer.Render(w, r, "Pages/Admin/Attributes/Index", inertia.Props{
			"attributes": serialized,
		})
	}
}

func (h *AdminAttributeHandler) Create() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		h.renderer.Render(w, r, "Pages/Admin/Attributes/Create", inertia.Props{})
	}
}

func (h *AdminAttributeHandler) Edit() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		attributeUUID, err := parseUUID(id)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/attributes", inertia.WithFlash(inertia.Flash{
				"error": "Invalid attribute ID.",
			}))
			return
		}

		attribute, err := h.queries.GetAttributeByID(r.Context(), attributeUUID)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/attributes", inertia.WithFlash(inertia.Flash{
				"error": "Attribute not found.",
			}))
			return
		}

		options, _ := h.queries.ListOptionsByAttribute(r.Context(), attributeUUID)
		usage, _ := h.queries.ListOptionUsage(r.Context(), attributeUUID)
		productCount, _ := h.queries.CountProductsUsingAttribute(r.Context(), attributeUUID)

		// Per-value product counts, so the editor can warn before a value that
		// products already carry is removed.
		usageByOption := make(map[[16]byte]int64, len(usage))
		for _, row := range usage {
			usageByOption[row.OptionID.Bytes] = row.ProductCount
		}

		serializedOptions := make([]map[string]any, len(options))
		for i, o := range options {
			serializedOptions[i] = map[string]any{
				"id":            fmt.Sprintf("%x", o.ID.Bytes),
				"value":         o.Value,
				"sort_order":    o.SortOrder,
				"product_count": usageByOption[o.ID.Bytes],
			}
		}

		h.renderer.Render(w, r, "Pages/Admin/Attributes/Edit", inertia.Props{
			"attribute": map[string]any{
				"id":            fmt.Sprintf("%x", attribute.ID.Bytes),
				"code":          attribute.Code,
				"name":          attribute.Name,
				"type":          attribute.Type,
				"is_required":   attribute.IsRequired,
				"is_variant":    attribute.IsVariant,
				"sort_order":    attribute.SortOrder,
				"product_count": productCount,
			},
			"options": serializedOptions,
		})
	}
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

func (h *AdminAttributeHandler) Store() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		form, err := decodeAttributeForm(r)
		if err != nil {
			h.redirectWithErrors(w, r, "/admin/attributes/create", nil, "Could not read the submitted attribute data.")
			return
		}

		errs, code := h.validateAttributeForm(r.Context(), form, nil)
		if len(errs) > 0 {
			h.redirectWithErrors(w, r, "/admin/attributes/create", errs, "Please correct the highlighted fields.")
			return
		}

		attribute, err := h.persist(r.Context(), nil, form, code)
		if err != nil {
			h.redirectWithErrors(w, r, "/admin/attributes/create", nil, "Failed to create attribute: "+err.Error())
			return
		}

		target := "/admin/attributes"
		if form.RedirectTo == "edit" {
			target = fmt.Sprintf("/admin/attributes/%x/edit", attribute.ID.Bytes)
		}

		h.renderer.Redirect(w, r, target, inertia.WithFlash(inertia.Flash{
			"success": fmt.Sprintf("Attribute %q created.", attribute.Name),
		}))
	}
}

func (h *AdminAttributeHandler) Update() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		attributeUUID, err := parseUUID(id)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/attributes", inertia.WithFlash(inertia.Flash{
				"error": "Invalid attribute ID.",
			}))
			return
		}

		editURL := "/admin/attributes/" + id + "/edit"

		form, err := decodeAttributeForm(r)
		if err != nil {
			h.redirectWithErrors(w, r, editURL, nil, "Could not read the submitted attribute data.")
			return
		}

		errs, code := h.validateAttributeForm(r.Context(), form, &attributeUUID)
		if len(errs) > 0 {
			h.redirectWithErrors(w, r, editURL, errs, "Please correct the highlighted fields.")
			return
		}

		attribute, err := h.persist(r.Context(), &attributeUUID, form, code)
		if err != nil {
			h.redirectWithErrors(w, r, editURL, nil, "Failed to update attribute: "+err.Error())
			return
		}

		target := "/admin/attributes"
		if form.RedirectTo == "edit" {
			target = editURL
		}

		h.renderer.Redirect(w, r, target, inertia.WithFlash(inertia.Flash{
			"success": fmt.Sprintf("Attribute %q updated.", attribute.Name),
		}))
	}
}

// Delete refuses while any product carries the attribute.
//
// product_attributes.attribute_id is ON DELETE CASCADE, so going ahead would
// quietly delete the merchant's product data along with the attribute. There is
// no disabled state to fall back on, so the safe answer is to refuse and say
// what is in the way — the same contract as deleting a category with products.
func (h *AdminAttributeHandler) Delete() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		attributeUUID, err := parseUUID(id)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/attributes", inertia.WithFlash(inertia.Flash{
				"error": "Invalid attribute ID.",
			}))
			return
		}

		attribute, err := h.queries.GetAttributeByID(r.Context(), attributeUUID)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/attributes", inertia.WithFlash(inertia.Flash{
				"error": "Attribute not found.",
			}))
			return
		}

		if count, err := h.queries.CountProductsUsingAttribute(r.Context(), attributeUUID); err == nil && count > 0 {
			h.renderer.Redirect(w, r, "/admin/attributes", inertia.WithFlash(inertia.Flash{
				"error": fmt.Sprintf(
					"%q is used by %d product%s. Remove it from those products before deleting it.",
					attribute.Name, count, plural(count),
				),
			}))
			return
		}

		if err := h.queries.DeleteAttribute(r.Context(), attributeUUID); err != nil {
			h.renderer.Redirect(w, r, "/admin/attributes", inertia.WithFlash(inertia.Flash{
				"error": "Failed to delete attribute.",
			}))
			return
		}

		h.renderer.Redirect(w, r, "/admin/attributes", inertia.WithFlash(inertia.Flash{
			"success": fmt.Sprintf("Attribute %q deleted.", attribute.Name),
		}))
	}
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

// variantCapable keeps is_variant honest.
//
// A variant axis is built by combining values from a fixed list, so the flag is
// only meaningful for the option types. The form already forces it false
// elsewhere, but the server is authoritative: without this, posting
// type=text with is_variant=true would leave a flag that the product form's
// variant builder could still act on — options survive a type change, so
// `is_variant && options.length > 0` would be true for an attribute that has no
// business offering variants.
func variantCapable(attributeType string, requested bool) bool {
	return optionTypes[attributeType] && requested
}

// persist writes the attribute and its values in one transaction.
//
// Values are **diffed by id**, never cleared and re-inserted. A posted row that
// carries an id is updated in place, so renaming "Navy" to "Navy Blue" leaves
// every product_attributes.option_id pointing at the same row; only ids the
// merchant actually removed are deleted. Clearing the list first — the approach
// used for collection membership, where the join table carries no outside
// references — would blank the stored value on every product using the
// attribute, because product_attributes.option_id is ON DELETE SET NULL.
func (h *AdminAttributeHandler) persist(
	ctx context.Context,
	id *pgtype.UUID,
	form *attributeForm,
	code string,
) (db.Attribute, error) {
	tx, err := h.pool.Begin(ctx)
	if err != nil {
		return db.Attribute{}, err
	}
	defer tx.Rollback(ctx)

	qtx := h.queries.WithTx(tx)

	var attribute db.Attribute

	if id == nil {
		attribute, err = qtx.CreateAttribute(ctx, db.CreateAttributeParams{
			Code:       code,
			Name:       strings.TrimSpace(form.Name),
			Type:       form.Type,
			IsRequired: form.IsRequired,
			IsVariant:  variantCapable(form.Type, form.IsVariant),
			SortOrder:  parseInt32(form.SortOrder),
		})
		if err != nil {
			return db.Attribute{}, err
		}
	} else {
		attribute, err = qtx.UpdateAttribute(ctx, db.UpdateAttributeParams{
			ID:         *id,
			Code:       code,
			Name:       strings.TrimSpace(form.Name),
			IsRequired: form.IsRequired,
			IsVariant:  variantCapable(form.Type, form.IsVariant),
			SortOrder:  parseInt32(form.SortOrder),
		})
		if err != nil {
			return db.Attribute{}, err
		}

		// Type is not part of UpdateAttribute. It may only change while nothing
		// references the attribute; validateAttributeForm has already refused
		// the change otherwise.
		if form.Type != attribute.Type {
			if err := qtx.UpdateAttributeType(ctx, db.UpdateAttributeTypeParams{
				ID:   attribute.ID,
				Type: form.Type,
			}); err != nil {
				return db.Attribute{}, err
			}
			attribute.Type = form.Type
		}
	}

	if err := h.persistOptions(ctx, qtx, attribute, form); err != nil {
		return db.Attribute{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return db.Attribute{}, err
	}

	return attribute, nil
}

func (h *AdminAttributeHandler) persistOptions(
	ctx context.Context,
	qtx *db.Queries,
	attribute db.Attribute,
	form *attributeForm,
) error {
	// A type that stores a free-typed value has no option list. Existing rows
	// are left untouched rather than deleted: if the merchant switches the type
	// back, the values are still there.
	if !optionTypes[attribute.Type] {
		return nil
	}

	existing, err := qtx.ListOptionsByAttribute(ctx, attribute.ID)
	if err != nil {
		return err
	}

	known := make(map[[16]byte]bool, len(existing))
	for _, o := range existing {
		known[o.ID.Bytes] = true
	}

	kept := make(map[[16]byte]bool, len(form.Options))

	for position, option := range form.Options {
		value := strings.TrimSpace(option.Value)
		if value == "" {
			continue
		}

		// Position in the posted list is the stored order, so the array itself
		// is the ordering and there is no separate field to fall out of sync.
		sortOrder := int32((position + 1) * 10)

		optionUUID, err := parseUUID(strings.TrimSpace(option.ID))
		if err == nil && known[optionUUID.Bytes] {
			kept[optionUUID.Bytes] = true
			if err := qtx.UpdateAttributeOption(ctx, db.UpdateAttributeOptionParams{
				ID:        optionUUID,
				Value:     value,
				SortOrder: sortOrder,
			}); err != nil {
				return err
			}
			continue
		}

		created, err := qtx.InsertAttributeOption(ctx, db.InsertAttributeOptionParams{
			AttributeID: attribute.ID,
			Value:       value,
			SortOrder:   sortOrder,
		})
		if err != nil {
			return err
		}
		kept[created.ID.Bytes] = true
	}

	// Only the rows the merchant actually removed are deleted.
	for _, o := range existing {
		if kept[o.ID.Bytes] {
			continue
		}
		if err := qtx.DeleteAttributeOption(ctx, o.ID); err != nil {
			return err
		}
	}

	return nil
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

// validateAttributeForm mirrors the client-side rules in
// Components/Admin/Attributes/attributeFormState.js and stays authoritative.
func (h *AdminAttributeHandler) validateAttributeForm(
	ctx context.Context,
	form *attributeForm,
	excludeID *pgtype.UUID,
) (inertia.ValidationErrors, string) {
	errs := inertia.ValidationErrors{}

	name := strings.TrimSpace(form.Name)
	switch {
	case name == "":
		errs["name"] = "Attribute name is required."
	case len(name) > maxNameLength:
		errs["name"] = fmt.Sprintf("Attribute name must be %d characters or fewer.", maxNameLength)
	default:
		params := db.CountAttributesWithNameParams{Name: name}
		if excludeID != nil {
			params.ExcludeID = *excludeID
		}
		if count, err := h.queries.CountAttributesWithName(ctx, params); err == nil && count > 0 {
			errs["name"] = fmt.Sprintf("An attribute named %q already exists.", name)
		}
	}

	code := h.validateAttributeCode(ctx, errs, form, name, excludeID)

	if !attributeTypes[form.Type] {
		errs["type"] = "Choose a valid attribute type."
	} else {
		h.validateTypeChange(ctx, errs, form, excludeID)
	}

	validateQuantity(errs, "sort_order", form.SortOrder, false)

	h.validateAttributeOptions(errs, form)

	return errs, code
}

func (h *AdminAttributeHandler) validateAttributeCode(
	ctx context.Context,
	errs inertia.ValidationErrors,
	form *attributeForm,
	name string,
	excludeID *pgtype.UUID,
) string {
	// categorySlugify, not slugify: slugify() only rewrites spaces and
	// underscores and passes every other character through, so it would happily
	// accept "???" or a code containing a slash or a quote. categorySlugify
	// drops everything outside [a-z0-9-], which is also exactly what the
	// client-side slugify in productFormState.js produces — so the code
	// previewed in the form is the code that gets stored.
	code := categorySlugify(form.Code)
	if code == "" {
		code = categorySlugify(name)
	}

	if code == "" {
		if name != "" {
			errs["code"] = "Enter a code — one could not be generated from the attribute name."
		}
		return code
	}
	if len(code) > maxAttributeCodeLength {
		errs["code"] = fmt.Sprintf("Code must be %d characters or fewer.", maxAttributeCodeLength)
		return code
	}

	params := db.CountAttributesWithCodeParams{Code: code}
	if excludeID != nil {
		params.ExcludeID = *excludeID
	}
	if count, err := h.queries.CountAttributesWithCode(ctx, params); err == nil && count > 0 {
		errs["code"] = fmt.Sprintf("The code %q is already used by another attribute.", code)
	}

	return code
}

// validateTypeChange refuses to re-type an attribute that products already
// carry. A stored product_attributes row was written to suit the old type — an
// option_id for select/multiselect, a free-typed value for everything else — so
// switching would leave that data meaningless without rewriting it.
func (h *AdminAttributeHandler) validateTypeChange(
	ctx context.Context,
	errs inertia.ValidationErrors,
	form *attributeForm,
	excludeID *pgtype.UUID,
) {
	if excludeID == nil {
		return
	}

	current, err := h.queries.GetAttributeByID(ctx, *excludeID)
	if err != nil || current.Type == form.Type {
		return
	}

	count, err := h.queries.CountProductsUsingAttribute(ctx, *excludeID)
	if err != nil {
		errs["type"] = "Could not verify how this attribute is used. Try again."
		return
	}
	if count > 0 {
		errs["type"] = fmt.Sprintf(
			"This attribute is used by %d product%s, so its type can no longer change. Create a new attribute instead.",
			count, plural(count),
		)
	}
}

func (h *AdminAttributeHandler) validateAttributeOptions(errs inertia.ValidationErrors, form *attributeForm) {
	if !optionTypes[form.Type] {
		return
	}

	if len(form.Options) > maxAttributeOptions {
		errs["options"] = fmt.Sprintf("An attribute can have at most %d values.", maxAttributeOptions)
		return
	}

	seen := make(map[string]bool, len(form.Options))
	filled := 0

	for _, option := range form.Options {
		value := strings.TrimSpace(option.Value)
		if value == "" {
			continue
		}
		filled++

		if len(value) > maxAttributeValueLength {
			errs["options"] = fmt.Sprintf("Each value must be %d characters or fewer.", maxAttributeValueLength)
			return
		}

		// attribute_options is UNIQUE (attribute_id, value); comparing
		// case-insensitively here refuses "Red" alongside "red" with a readable
		// message rather than letting both through as distinct values.
		key := strings.ToLower(value)
		if seen[key] {
			errs["options"] = fmt.Sprintf("%q appears more than once. Each value must be unique.", value)
			return
		}
		seen[key] = true
	}

	if filled == 0 {
		errs["options"] = "Add at least one value, or choose a type that does not use a fixed list."
	}
}

func (h *AdminAttributeHandler) redirectWithErrors(
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
