package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	inertia "github.com/mayahiro/go-inertia"

	"gocommerce/internal/db"
)

const (
	maxCollectionImageURLLength        = 512
	maxCollectionMetaDescriptionLength = 500

	// The product picker is paginated server-side so a large catalogue never
	// reaches the browser in one piece.
	collectionPickerPageSize = 8

	// A curated list is hand-ordered, so it has to stay hand-sized. Well beyond
	// any real "Staff Picks", but low enough that one POST cannot be used to
	// write an unbounded number of rows.
	maxCollectionProducts = 500
)

// AdminCollectionHandler owns the admin collection screens. Separate from
// AdminHandler for the same reason AdminCouponHandler is — one merchandising
// concern per unit. It needs the pool as well as the queries because a
// collection and its membership are written in one transaction.
type AdminCollectionHandler struct {
	renderer *inertia.Renderer
	queries  *db.Queries
	pool     *pgxpool.Pool
}

func NewAdminCollectionHandler(renderer *inertia.Renderer, queries *db.Queries, pool *pgxpool.Pool) *AdminCollectionHandler {
	return &AdminCollectionHandler{renderer: renderer, queries: queries, pool: pool}
}

// collectionForm is the JSON body posted by the admin collection form. It
// follows the product, category and coupon forms: numeric fields arrive as
// strings so a blank input stays distinguishable from a zero.
type collectionForm struct {
	Name        string `json:"name"`
	URLKey      string `json:"url_key"`
	Description string `json:"description"`
	ImageURL    string `json:"image_url"`

	IsActive   bool   `json:"is_active"`
	IsFeatured bool   `json:"is_featured"`
	SortOrder  string `json:"sort_order"`

	MetaTitle       string `json:"meta_title"`
	MetaDescription string `json:"meta_description"`
	MetaKeywords    string `json:"meta_keywords"`

	// The curated membership, in the merchant's chosen order. Position is the
	// index in this slice, so the array *is* the ordering — there is no
	// separate position field to fall out of sync with it.
	ProductIDs []string `json:"product_ids"`

	RedirectTo string `json:"redirect_to"`
}

func decodeCollectionForm(r *http.Request) (*collectionForm, error) {
	var form collectionForm
	if err := json.NewDecoder(r.Body).Decode(&form); err != nil {
		return nil, err
	}
	return &form, nil
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

func (h *AdminCollectionHandler) List() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		collections, err := h.queries.ListCollections(r.Context())
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		serialized := make([]map[string]any, len(collections))
		for i, c := range collections {
			serialized[i] = map[string]any{
				"id":            fmt.Sprintf("%x", c.ID.Bytes),
				"name":          c.Name,
				"slug":          c.Slug,
				"description":   c.Description.String,
				"image_url":     c.ImageUrl.String,
				"is_active":     c.IsActive,
				"is_featured":   c.IsFeatured,
				"sort_order":    c.SortOrder,
				"product_count": c.ProductCount,
			}
		}

		h.renderer.Render(w, r, "Pages/Admin/Collections/Index", inertia.Props{
			"collections": serialized,
		})
	}
}

func (h *AdminCollectionHandler) Create() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		h.renderer.Render(w, r, "Pages/Admin/Collections/Create", inertia.Props{
			"product_search": h.productSearch(r),
		})
	}
}

func (h *AdminCollectionHandler) Edit() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		collectionUUID, err := parseUUID(id)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/collections", inertia.WithFlash(inertia.Flash{
				"error": "Invalid collection ID.",
			}))
			return
		}

		collection, err := h.queries.GetCollectionByID(r.Context(), collectionUUID)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/collections", inertia.WithFlash(inertia.Flash{
				"error": "Collection not found.",
			}))
			return
		}

		members, _ := h.queries.ListCollectionProducts(r.Context(), collectionUUID)
		products := make([]map[string]any, len(members))
		for i, p := range members {
			products[i] = map[string]any{
				"id":             fmt.Sprintf("%x", p.ID.Bytes),
				"name":           p.Name,
				"slug":           p.Slug,
				"sku":            p.Sku.String,
				"price":          formatNumeric(p.Price),
				"image_url":      p.ImageUrl.String,
				"is_active":      p.IsActive,
				"stock_quantity": p.StockQuantity,
				"category_name":  p.CategoryName,
			}
		}

		h.renderer.Render(w, r, "Pages/Admin/Collections/Edit", inertia.Props{
			"collection":     serializeAdminCollection(collection, int64(len(products))),
			"products":       products,
			"product_search": h.productSearch(r),
		})
	}
}

func serializeAdminCollection(c db.Collection, productCount int64) map[string]any {
	return map[string]any{
		"id":               fmt.Sprintf("%x", c.ID.Bytes),
		"name":             c.Name,
		"slug":             c.Slug,
		"description":      c.Description.String,
		"image_url":        c.ImageUrl.String,
		"is_active":        c.IsActive,
		"is_featured":      c.IsFeatured,
		"sort_order":       c.SortOrder,
		"meta_title":       c.MetaTitle.String,
		"meta_description": c.MetaDescription.String,
		"meta_keywords":    c.MetaKeywords.String,
		"product_count":    productCount,
	}
}

// productSearch backs the product picker. It is a normal page prop rather than
// an endpoint of its own: the picker asks for it with an Inertia partial reload
// (`only: ["product_search"]`), so searching stays inside the page-prop
// contract and no REST API is introduced.
func (h *AdminCollectionHandler) productSearch(r *http.Request) map[string]any {
	query := r.URL.Query()

	keyword := strings.TrimSpace(query.Get("q"))
	page, err := strconv.Atoi(query.Get("pp"))
	if err != nil || page < 1 {
		page = 1
	}

	// pgtype.Text{Valid: false} is SQL NULL, which the query reads as "no
	// keyword filter" — an empty string would filter for products containing "".
	term := pgtype.Text{String: keyword, Valid: keyword != ""}

	total, err := h.queries.CountProductsForPicker(r.Context(), term)
	if err != nil {
		total = 0
	}

	// A search that shrinks the result set can leave the picker on a page past
	// the end; walk back rather than showing an empty list.
	lastPage := int((total + collectionPickerPageSize - 1) / collectionPickerPageSize)
	if lastPage > 0 && page > lastPage {
		page = lastPage
	}

	rows, err := h.queries.SearchProductsForPicker(r.Context(), db.SearchProductsForPickerParams{
		Keyword: term,
		Limit:   collectionPickerPageSize,
		Offset:  int32((page - 1) * collectionPickerPageSize),
	})
	if err != nil {
		rows = nil
	}

	items := make([]map[string]any, len(rows))
	for i, p := range rows {
		items[i] = map[string]any{
			"id":             fmt.Sprintf("%x", p.ID.Bytes),
			"name":           p.Name,
			"slug":           p.Slug,
			"sku":            p.Sku.String,
			"price":          formatNumeric(p.Price),
			"image_url":      p.ImageUrl.String,
			"is_active":      p.IsActive,
			"stock_quantity": p.StockQuantity,
			"category_name":  p.CategoryName,
		}
	}

	return map[string]any{
		"items":     items,
		"total":     total,
		"page":      page,
		"per_page":  collectionPickerPageSize,
		"last_page": lastPage,
		"keyword":   keyword,
	}
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

func (h *AdminCollectionHandler) Store() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		form, err := decodeCollectionForm(r)
		if err != nil {
			h.redirectWithErrors(w, r, "/admin/collections/create", nil, "Could not read the submitted collection data.")
			return
		}

		errs, slug, productIDs := h.validateCollectionForm(r.Context(), form, nil)
		if len(errs) > 0 {
			h.redirectWithErrors(w, r, "/admin/collections/create", errs, "Please correct the highlighted fields.")
			return
		}

		collection, err := h.persist(r.Context(), nil, form, slug, productIDs)
		if err != nil {
			h.redirectWithErrors(w, r, "/admin/collections/create", nil, "Failed to create collection: "+err.Error())
			return
		}

		target := "/admin/collections"
		if form.RedirectTo == "edit" {
			target = fmt.Sprintf("/admin/collections/%x/edit", collection.ID.Bytes)
		}

		h.renderer.Redirect(w, r, target, inertia.WithFlash(inertia.Flash{
			"success": fmt.Sprintf("Collection %q created with %d product%s.",
				collection.Name, len(productIDs), plural(int64(len(productIDs)))),
		}))
	}
}

func (h *AdminCollectionHandler) Update() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		collectionUUID, err := parseUUID(id)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/collections", inertia.WithFlash(inertia.Flash{
				"error": "Invalid collection ID.",
			}))
			return
		}

		editURL := "/admin/collections/" + id + "/edit"

		form, err := decodeCollectionForm(r)
		if err != nil {
			h.redirectWithErrors(w, r, editURL, nil, "Could not read the submitted collection data.")
			return
		}

		errs, slug, productIDs := h.validateCollectionForm(r.Context(), form, &collectionUUID)
		if len(errs) > 0 {
			h.redirectWithErrors(w, r, editURL, errs, "Please correct the highlighted fields.")
			return
		}

		collection, err := h.persist(r.Context(), &collectionUUID, form, slug, productIDs)
		if err != nil {
			h.redirectWithErrors(w, r, editURL, nil, "Failed to update collection: "+err.Error())
			return
		}

		target := "/admin/collections"
		if form.RedirectTo == "edit" {
			target = editURL
		}

		h.renderer.Redirect(w, r, target, inertia.WithFlash(inertia.Flash{
			"success": fmt.Sprintf("Collection %q updated.", collection.Name),
		}))
	}
}

func (h *AdminCollectionHandler) Delete() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		collectionUUID, err := parseUUID(id)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/collections", inertia.WithFlash(inertia.Flash{
				"error": "Invalid collection ID.",
			}))
			return
		}

		collection, err := h.queries.GetCollectionByID(r.Context(), collectionUUID)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/collections", inertia.WithFlash(inertia.Flash{
				"error": "Collection not found.",
			}))
			return
		}

		count, _ := h.queries.CountProductsInCollection(r.Context(), collectionUUID)

		if err := h.queries.DeleteCollection(r.Context(), collectionUUID); err != nil {
			h.renderer.Redirect(w, r, "/admin/collections", inertia.WithFlash(inertia.Flash{
				"error": "Failed to delete collection.",
			}))
			return
		}

		// Unlike a category, a collection never blocks its own deletion: only
		// the membership rows go, and the products themselves are untouched.
		message := fmt.Sprintf("Collection %q deleted.", collection.Name)
		if count > 0 {
			verb := "stay"
			if count == 1 {
				verb = "stays"
			}
			message = fmt.Sprintf(
				"Collection %q deleted. Its %d product%s %s in the catalogue.",
				collection.Name, count, plural(count), verb,
			)
		}

		h.renderer.Redirect(w, r, "/admin/collections", inertia.WithFlash(inertia.Flash{
			"success": message,
		}))
	}
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

// persist writes the collection and its membership in one transaction, so a
// half-applied product list is never committed. Membership is replaced wholesale
// rather than diffed: the posted array is the complete curated list, and its
// index order is the stored position.
func (h *AdminCollectionHandler) persist(
	ctx context.Context,
	id *pgtype.UUID,
	form *collectionForm,
	slug string,
	productIDs []pgtype.UUID,
) (db.Collection, error) {
	tx, err := h.pool.Begin(ctx)
	if err != nil {
		return db.Collection{}, err
	}
	defer tx.Rollback(ctx)

	qtx := h.queries.WithTx(tx)

	var collection db.Collection

	if id == nil {
		collection, err = qtx.CreateCollection(ctx, db.CreateCollectionParams{
			Name:            strings.TrimSpace(form.Name),
			Slug:            slug,
			Description:     optionalText(form.Description),
			ImageUrl:        optionalText(form.ImageURL),
			IsActive:        form.IsActive,
			IsFeatured:      form.IsFeatured,
			SortOrder:       parseInt32(form.SortOrder),
			MetaTitle:       optionalText(form.MetaTitle),
			MetaDescription: optionalText(form.MetaDescription),
			MetaKeywords:    optionalText(form.MetaKeywords),
		})
	} else {
		collection, err = qtx.UpdateCollection(ctx, db.UpdateCollectionParams{
			ID:              *id,
			Name:            strings.TrimSpace(form.Name),
			Slug:            slug,
			Description:     optionalText(form.Description),
			ImageUrl:        optionalText(form.ImageURL),
			IsActive:        form.IsActive,
			IsFeatured:      form.IsFeatured,
			SortOrder:       parseInt32(form.SortOrder),
			MetaTitle:       optionalText(form.MetaTitle),
			MetaDescription: optionalText(form.MetaDescription),
			MetaKeywords:    optionalText(form.MetaKeywords),
		})
	}
	if err != nil {
		return db.Collection{}, err
	}

	if id != nil {
		if err := qtx.ClearCollectionProducts(ctx, collection.ID); err != nil {
			return db.Collection{}, err
		}
	}

	for position, productID := range productIDs {
		if err := qtx.AddProductToCollection(ctx, db.AddProductToCollectionParams{
			CollectionID: collection.ID,
			ProductID:    productID,
			Position:     int32(position),
		}); err != nil {
			return db.Collection{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return db.Collection{}, err
	}

	return collection, nil
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

// validateCollectionForm mirrors the client-side rules in
// Components/Admin/Collections/collectionFormState.js and stays authoritative.
// It returns the resolved slug and membership so the caller does not recompute
// them.
func (h *AdminCollectionHandler) validateCollectionForm(
	ctx context.Context,
	form *collectionForm,
	excludeID *pgtype.UUID,
) (inertia.ValidationErrors, string, []pgtype.UUID) {
	errs := inertia.ValidationErrors{}

	name := strings.TrimSpace(form.Name)
	switch {
	case name == "":
		errs["name"] = "Collection name is required."
	case len(name) > maxNameLength:
		errs["name"] = fmt.Sprintf("Collection name must be %d characters or fewer.", maxNameLength)
	default:
		h.validateCollectionName(ctx, errs, name, excludeID)
	}

	slug := h.validateCollectionSlug(ctx, errs, form, name, excludeID)

	validateQuantity(errs, "sort_order", form.SortOrder, false)

	if len(strings.TrimSpace(form.ImageURL)) > maxCollectionImageURLLength {
		errs["image_url"] = "That image address is too long to store. Upload the image instead of pasting a link."
	}

	if len(strings.TrimSpace(form.MetaTitle)) > maxMetaTitleLength {
		errs["meta_title"] = fmt.Sprintf("Meta title must be %d characters or fewer.", maxMetaTitleLength)
	}
	if len(strings.TrimSpace(form.MetaDescription)) > maxCollectionMetaDescriptionLength {
		errs["meta_description"] = fmt.Sprintf("Meta description must be %d characters or fewer.", maxCollectionMetaDescriptionLength)
	}
	if len(strings.TrimSpace(form.MetaKeywords)) > maxMetaKeywordsLength {
		errs["meta_keywords"] = fmt.Sprintf("Meta keywords must be %d characters or fewer.", maxMetaKeywordsLength)
	}

	productIDs := h.validateCollectionProducts(ctx, errs, form.ProductIDs)

	return errs, slug, productIDs
}

// A collection has no parent, so its name is compared against every other
// collection rather than against siblings. Two "Summer Picks" in one navigation
// menu would be indistinguishable to a merchant.
func (h *AdminCollectionHandler) validateCollectionName(
	ctx context.Context,
	errs inertia.ValidationErrors,
	name string,
	excludeID *pgtype.UUID,
) {
	params := db.CountCollectionsWithNameParams{Name: name}
	if excludeID != nil {
		params.ExcludeID = *excludeID
	}

	if count, err := h.queries.CountCollectionsWithName(ctx, params); err == nil && count > 0 {
		errs["name"] = fmt.Sprintf("A collection named %q already exists.", name)
	}
}

// validateCollectionSlug keeps `/collections/{slug}` unique and routable. On
// edit the form posts the collection's current URL key, so renaming a
// collection never silently moves its public page.
func (h *AdminCollectionHandler) validateCollectionSlug(
	ctx context.Context,
	errs inertia.ValidationErrors,
	form *collectionForm,
	name string,
	excludeID *pgtype.UUID,
) string {
	// Deliberately the same slugifier as categories: one URL grammar across the
	// storefront, and the key previewed in the form is the key that gets stored.
	slug := categorySlugify(form.URLKey)
	if slug == "" {
		slug = categorySlugify(name)
	}

	if slug == "" {
		if name != "" {
			errs["url_key"] = "Enter a URL key — one could not be generated from the collection name."
		}
		return slug
	}
	if len(slug) > maxSlugLength {
		errs["url_key"] = fmt.Sprintf("URL key must be %d characters or fewer.", maxSlugLength)
		return slug
	}

	params := db.CountCollectionsWithSlugParams{Slug: slug}
	if excludeID != nil {
		params.ExcludeID = *excludeID
	}
	if count, err := h.queries.CountCollectionsWithSlug(ctx, params); err == nil && count > 0 {
		errs["url_key"] = fmt.Sprintf("The URL key %q is already used by another collection.", slug)
	}

	return slug
}

// validateCollectionProducts parses the posted membership, drops duplicates
// while keeping first position, and refuses the save if any id does not name a
// real product — a stale picker must not silently write half a list.
func (h *AdminCollectionHandler) validateCollectionProducts(
	ctx context.Context,
	errs inertia.ValidationErrors,
	raw []string,
) []pgtype.UUID {
	if len(raw) > maxCollectionProducts {
		errs["product_ids"] = fmt.Sprintf(
			"A collection can hold at most %d products. Split this one into several collections.",
			maxCollectionProducts,
		)
		return nil
	}

	ids := make([]pgtype.UUID, 0, len(raw))
	seen := make(map[[16]byte]bool, len(raw))

	for _, value := range raw {
		productUUID, err := parseUUID(strings.TrimSpace(value))
		if err != nil {
			errs["product_ids"] = "The product list contains an entry that is not a valid product. Remove it and try again."
			return nil
		}
		if seen[productUUID.Bytes] {
			continue
		}
		seen[productUUID.Bytes] = true
		ids = append(ids, productUUID)
	}

	if len(ids) == 0 {
		return ids
	}

	// One COUNT rather than a lookup per product: the list only has to be
	// entirely real, not individually reported.
	count, err := h.queries.CountValidProductIDs(ctx, ids)
	if err != nil {
		errs["product_ids"] = "Could not verify the selected products. Try again."
		return nil
	}
	if int(count) != len(ids) {
		errs["product_ids"] = "One or more selected products no longer exist. Remove them and try again."
		return nil
	}

	return ids
}

func (h *AdminCollectionHandler) redirectWithErrors(
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
