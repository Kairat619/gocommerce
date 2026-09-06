package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	inertia "github.com/mayahiro/go-inertia"

	"gocommerce/internal/db"
)

const (
	maxCategoryImageURLLength        = 512
	maxCategoryMetaDescriptionLength = 500
)

// categoryForm is the payload posted by the admin category form. Like the
// product form it arrives as JSON, and numeric fields arrive as strings so a
// blank input can be told apart from a zero.
type categoryForm struct {
	Name        string `json:"name"`
	URLKey      string `json:"url_key"`
	Description string `json:"description"`
	ParentID    string `json:"parent_id"`
	ImageURL    string `json:"image_url"`
	SortOrder   string `json:"sort_order"`
	IsActive    bool   `json:"is_active"`

	MetaTitle       string `json:"meta_title"`
	MetaDescription string `json:"meta_description"`
	MetaKeywords    string `json:"meta_keywords"`

	RedirectTo string `json:"redirect_to"`
}

func decodeCategoryForm(r *http.Request) (*categoryForm, error) {
	var form categoryForm
	if err := json.NewDecoder(r.Body).Decode(&form); err != nil {
		return nil, err
	}
	return &form, nil
}

// categorySlugify reduces a name or URL key to the lowercase alphanumeric and
// hyphen form `/categories/{slug}` expects. Unlike slugify() it drops every
// other character rather than passing it through, so a name like
// "Home & Kitchen" cannot produce a slug that needs escaping in a URL. A name
// with no ASCII letters or digits yields "" and the merchant is asked for a
// URL key instead of being given a broken address.
func categorySlugify(s string) string {
	var b strings.Builder
	pendingHyphen := false

	for _, r := range strings.ToLower(strings.TrimSpace(s)) {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			if pendingHyphen && b.Len() > 0 {
				b.WriteByte('-')
			}
			b.WriteRune(r)
			pendingHyphen = false
			continue
		}
		pendingHyphen = true
	}

	return b.String()
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

func (h *AdminHandler) ListCategories() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		categories, err := h.queries.ListCategories(r.Context())
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		serialized := make([]map[string]any, len(categories))
		for i, c := range categories {
			serialized[i] = map[string]any{
				"id":          fmt.Sprintf("%x", c.ID.Bytes),
				"parent_id":   nullableUUID(c.ParentID),
				"name":        c.Name,
				"slug":        c.Slug,
				"description": c.Description.String,
				"image_url":   c.ImageUrl.String,
				"sort_order":  c.SortOrder,
				"is_active":   c.IsActive,
			}
		}

		h.renderer.Render(w, r, "Pages/Admin/Categories/Index", inertia.Props{
			"categories": serialized,
		})
	}
}

func (h *AdminHandler) CreateCategory() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		h.renderer.Render(w, r, "Pages/Admin/Categories/Create", h.categoryFormProps(r.Context()))
	}
}

func (h *AdminHandler) EditCategory() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		categoryUUID, err := parseUUID(id)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/categories", inertia.WithFlash(inertia.Flash{
				"error": "Invalid category ID.",
			}))
			return
		}

		category, err := h.queries.GetCategoryByID(r.Context(), categoryUUID)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/categories", inertia.WithFlash(inertia.Flash{
				"error": "Category not found.",
			}))
			return
		}

		productCount, _ := h.queries.CountProductsInCategory(r.Context(), categoryUUID)

		props := h.categoryFormProps(r.Context())
		props["category"] = serializeAdminCategory(category, productCount)

		h.renderer.Render(w, r, "Pages/Admin/Categories/Edit", props)
	}
}

// categoryFormProps returns the reference data the create and edit forms share.
// The whole tree is sent once so the parent picker can search, expand and show
// a breadcrumb path without a request per keystroke.
func (h *AdminHandler) categoryFormProps(ctx context.Context) inertia.Props {
	categories, _ := h.queries.ListCategories(ctx)

	serialized := make([]map[string]any, len(categories))
	for i, c := range categories {
		serialized[i] = map[string]any{
			"id":        fmt.Sprintf("%x", c.ID.Bytes),
			"parent_id": nullableUUID(c.ParentID),
			"name":      c.Name,
			"slug":      c.Slug,
			"is_active": c.IsActive,
		}
	}

	return inertia.Props{"categories": serialized}
}

func serializeAdminCategory(c db.Category, productCount int64) map[string]any {
	return map[string]any{
		"id":               fmt.Sprintf("%x", c.ID.Bytes),
		"parent_id":        nullableUUID(c.ParentID),
		"name":             c.Name,
		"slug":             c.Slug,
		"description":      c.Description.String,
		"image_url":        c.ImageUrl.String,
		"sort_order":       c.SortOrder,
		"is_active":        c.IsActive,
		"meta_title":       c.MetaTitle.String,
		"meta_description": c.MetaDescription.String,
		"meta_keywords":    c.MetaKeywords.String,
		"product_count":    productCount,
	}
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

func (h *AdminHandler) StoreCategory() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		form, err := decodeCategoryForm(r)
		if err != nil {
			h.redirectWithErrors(w, r, "/admin/categories/create", nil, "Could not read the submitted category data.")
			return
		}

		errs, parentID, slug := h.validateCategoryForm(r.Context(), form, nil)
		if len(errs) > 0 {
			h.redirectWithErrors(w, r, "/admin/categories/create", errs, "Please correct the highlighted fields.")
			return
		}

		category, err := h.queries.CreateCategory(r.Context(), db.CreateCategoryParams{
			ParentID:        parentID,
			Name:            strings.TrimSpace(form.Name),
			Slug:            slug,
			Description:     optionalText(form.Description),
			ImageUrl:        optionalText(form.ImageURL),
			SortOrder:       parseInt32(form.SortOrder),
			IsActive:        form.IsActive,
			MetaTitle:       optionalText(form.MetaTitle),
			MetaDescription: optionalText(form.MetaDescription),
			MetaKeywords:    optionalText(form.MetaKeywords),
		})
		if err != nil {
			h.redirectWithErrors(w, r, "/admin/categories/create", nil, "Failed to create category: "+err.Error())
			return
		}

		target := "/admin/categories"
		if form.RedirectTo == "edit" {
			target = fmt.Sprintf("/admin/categories/%x/edit", category.ID.Bytes)
		}

		h.renderer.Redirect(w, r, target, inertia.WithFlash(inertia.Flash{
			"success": fmt.Sprintf("Category %q created.", category.Name),
		}))
	}
}

func (h *AdminHandler) UpdateCategory() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		categoryUUID, err := parseUUID(id)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/categories", inertia.WithFlash(inertia.Flash{
				"error": "Invalid category ID.",
			}))
			return
		}

		editURL := "/admin/categories/" + id + "/edit"

		form, err := decodeCategoryForm(r)
		if err != nil {
			h.redirectWithErrors(w, r, editURL, nil, "Could not read the submitted category data.")
			return
		}

		errs, parentID, slug := h.validateCategoryForm(r.Context(), form, &categoryUUID)
		if len(errs) > 0 {
			h.redirectWithErrors(w, r, editURL, errs, "Please correct the highlighted fields.")
			return
		}

		category, err := h.queries.UpdateCategory(r.Context(), db.UpdateCategoryParams{
			ID:              categoryUUID,
			ParentID:        parentID,
			Name:            strings.TrimSpace(form.Name),
			Slug:            slug,
			Description:     optionalText(form.Description),
			ImageUrl:        optionalText(form.ImageURL),
			SortOrder:       parseInt32(form.SortOrder),
			IsActive:        form.IsActive,
			MetaTitle:       optionalText(form.MetaTitle),
			MetaDescription: optionalText(form.MetaDescription),
			MetaKeywords:    optionalText(form.MetaKeywords),
		})
		if err != nil {
			h.redirectWithErrors(w, r, editURL, nil, "Failed to update category: "+err.Error())
			return
		}

		target := "/admin/categories"
		if form.RedirectTo == "edit" {
			target = editURL
		}

		h.renderer.Redirect(w, r, target, inertia.WithFlash(inertia.Flash{
			"success": fmt.Sprintf("Category %q updated.", category.Name),
		}))
	}
}

func (h *AdminHandler) DeleteCategory() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		categoryUUID, err := parseUUID(id)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/categories", inertia.WithFlash(inertia.Flash{
				"error": "Invalid category ID.",
			}))
			return
		}

		// products.category_id is ON DELETE RESTRICT, so check first and say why
		// rather than letting the constraint surface as a raw Postgres error.
		if count, err := h.queries.CountProductsInCategory(r.Context(), categoryUUID); err == nil && count > 0 {
			h.renderer.Redirect(w, r, "/admin/categories", inertia.WithFlash(inertia.Flash{
				"error": fmt.Sprintf(
					"This category still has %d product%s. Move them to another category before deleting it.",
					count, plural(count),
				),
			}))
			return
		}

		children, _ := h.queries.CountChildCategories(r.Context(), categoryUUID)

		if err := h.queries.DeleteCategory(r.Context(), categoryUUID); err != nil {
			h.renderer.Redirect(w, r, "/admin/categories", inertia.WithFlash(inertia.Flash{
				"error": "Failed to delete category.",
			}))
			return
		}

		message := "Category deleted."
		if children > 0 {
			// parent_id is ON DELETE SET NULL, so the children survive as roots.
			message = fmt.Sprintf(
				"Category deleted. %d subcategor%s moved to the top level.",
				children, map[bool]string{true: "y was", false: "ies were"}[children == 1],
			)
		}

		h.renderer.Redirect(w, r, "/admin/categories", inertia.WithFlash(inertia.Flash{
			"success": message,
		}))
	}
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

// validateCategoryForm mirrors the client-side rules in
// Components/Admin/Categories/categoryFormState.js and stays authoritative. It
// returns the resolved parent and slug so the caller does not recompute them.
func (h *AdminHandler) validateCategoryForm(
	ctx context.Context,
	form *categoryForm,
	excludeID *pgtype.UUID,
) (inertia.ValidationErrors, pgtype.UUID, string) {
	errs := inertia.ValidationErrors{}

	name := strings.TrimSpace(form.Name)
	switch {
	case name == "":
		errs["name"] = "Category name is required."
	case len(name) > maxNameLength:
		errs["name"] = fmt.Sprintf("Category name must be %d characters or fewer.", maxNameLength)
	}

	parentID := h.validateCategoryParent(ctx, errs, form.ParentID, excludeID)

	// A duplicate-name check against an unresolved parent would compare the
	// wrong siblings, so skip it while the parent itself is in error.
	if _, parentFailed := errs["parent_id"]; name != "" && !parentFailed {
		h.validateCategoryName(ctx, errs, name, parentID, excludeID)
	}

	slug := h.validateCategorySlug(ctx, errs, form, name, excludeID)

	validateQuantity(errs, "sort_order", form.SortOrder, false)

	if len(strings.TrimSpace(form.ImageURL)) > maxCategoryImageURLLength {
		errs["image_url"] = "That image address is too long to store. Upload the image instead of pasting a link."
	}

	if len(strings.TrimSpace(form.MetaTitle)) > maxMetaTitleLength {
		errs["meta_title"] = fmt.Sprintf("Meta title must be %d characters or fewer.", maxMetaTitleLength)
	}
	if len(strings.TrimSpace(form.MetaDescription)) > maxCategoryMetaDescriptionLength {
		errs["meta_description"] = fmt.Sprintf("Meta description must be %d characters or fewer.", maxCategoryMetaDescriptionLength)
	}
	if len(strings.TrimSpace(form.MetaKeywords)) > maxMetaKeywordsLength {
		errs["meta_keywords"] = fmt.Sprintf("Meta keywords must be %d characters or fewer.", maxMetaKeywordsLength)
	}

	return errs, parentID, slug
}

// validateCategoryParent resolves the posted parent and refuses any choice that
// would close a loop in the tree. The UI hides these options already; this is
// the authority.
func (h *AdminHandler) validateCategoryParent(
	ctx context.Context,
	errs inertia.ValidationErrors,
	raw string,
	excludeID *pgtype.UUID,
) pgtype.UUID {
	none := pgtype.UUID{Valid: false}

	if strings.TrimSpace(raw) == "" {
		return none
	}

	parentUUID, err := parseUUID(raw)
	if err != nil {
		errs["parent_id"] = "Select a valid parent category."
		return none
	}

	if _, err := h.queries.GetCategoryByID(ctx, parentUUID); err != nil {
		errs["parent_id"] = "That parent category no longer exists. Pick another one."
		return none
	}

	if excludeID == nil {
		return parentUUID
	}

	if parentUUID.Bytes == excludeID.Bytes {
		errs["parent_id"] = "A category cannot be its own parent."
		return none
	}

	subtree, err := h.queries.ListCategorySubtreeIDs(ctx, *excludeID)
	if err != nil {
		errs["parent_id"] = "Could not verify the category tree. Try again."
		return none
	}

	for _, id := range subtree {
		if id.Bytes == parentUUID.Bytes {
			errs["parent_id"] = "A category cannot be moved beneath one of its own subcategories."
			return none
		}
	}

	return parentUUID
}

func (h *AdminHandler) validateCategoryName(
	ctx context.Context,
	errs inertia.ValidationErrors,
	name string,
	parentID pgtype.UUID,
	excludeID *pgtype.UUID,
) {
	params := db.CountSiblingCategoriesWithNameParams{Name: name, ParentID: parentID}
	if excludeID != nil {
		params.ExcludeID = *excludeID
	}

	count, err := h.queries.CountSiblingCategoriesWithName(ctx, params)
	if err != nil || count == 0 {
		return
	}

	if parentID.Valid {
		errs["name"] = fmt.Sprintf("A category named %q already exists under this parent.", name)
		return
	}
	errs["name"] = fmt.Sprintf("A top-level category named %q already exists.", name)
}

// validateCategorySlug keeps `/categories/{slug}` unique and routable. On edit
// the form posts the category's current URL key, so a rename never silently
// moves the storefront page.
func (h *AdminHandler) validateCategorySlug(
	ctx context.Context,
	errs inertia.ValidationErrors,
	form *categoryForm,
	name string,
	excludeID *pgtype.UUID,
) string {
	slug := categorySlugify(form.URLKey)
	if slug == "" {
		slug = categorySlugify(name)
	}

	if slug == "" {
		if name != "" {
			errs["url_key"] = "Enter a URL key — one could not be generated from the category name."
		}
		return slug
	}
	if len(slug) > maxSlugLength {
		errs["url_key"] = fmt.Sprintf("URL key must be %d characters or fewer.", maxSlugLength)
		return slug
	}

	params := db.CountCategoriesWithSlugParams{Slug: slug}
	if excludeID != nil {
		params.ExcludeID = *excludeID
	}
	if count, err := h.queries.CountCategoriesWithSlug(ctx, params); err == nil && count > 0 {
		errs["url_key"] = fmt.Sprintf("The URL key %q is already used by another category.", slug)
	}

	return slug
}

func plural(n int64) string {
	if n == 1 {
		return ""
	}
	return "s"
}
