package handler

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	inertia "github.com/mayahiro/go-inertia"

	"gocommerce/internal/db"
)

const (
	maxNameLength             = 255
	maxShortDescriptionLength = 500
	maxSkuLength              = 100
	maxMetaTitleLength        = 255
	maxMetaKeywordsLength     = 500
	maxSlugLength             = 255
	storeCurrency             = "USD"
)

type productImageInput struct {
	URL       string `json:"url"`
	AltText   string `json:"alt_text"`
	IsPrimary bool   `json:"is_primary"`
}

type productAttributeInput struct {
	AttributeID string `json:"attribute_id"`
	OptionID    string `json:"option_id"`
	Value       string `json:"value"`
}

type productVariantInput struct {
	ID            string            `json:"id"`
	Name          string            `json:"name"`
	Sku           string            `json:"sku"`
	Barcode       string            `json:"barcode"`
	Price         string            `json:"price"`
	StockQuantity string            `json:"stock_quantity"`
	Weight        string            `json:"weight"`
	ImageURL      string            `json:"image_url"`
	IsActive      bool              `json:"is_active"`
	Options       map[string]string `json:"options"`
}

// productForm is the payload posted by the admin product form. Numeric fields
// arrive as strings so a blank input can be told apart from a zero.
type productForm struct {
	Name             string `json:"name"`
	URLKey           string `json:"url_key"`
	ShortDescription string `json:"short_description"`
	Description      string `json:"description"`
	CategoryID       string `json:"category_id"`
	Brand            string `json:"brand"`

	Tags []string `json:"tags"`

	Price          string `json:"price"`
	CompareAtPrice string `json:"compare_at_price"`
	CostPrice      string `json:"cost_price"`

	Sku               string `json:"sku"`
	Barcode           string `json:"barcode"`
	StockQuantity     string `json:"stock_quantity"`
	LowStockThreshold string `json:"low_stock_threshold"`
	TrackInventory    bool   `json:"track_inventory"`
	AllowBackorders   bool   `json:"allow_backorders"`

	Weight string `json:"weight"`
	Length string `json:"length"`
	Width  string `json:"width"`
	Height string `json:"height"`

	IsActive   bool   `json:"is_active"`
	IsFeatured bool   `json:"is_featured"`
	SortOrder  string `json:"sort_order"`

	MetaTitle       string `json:"meta_title"`
	MetaDescription string `json:"meta_description"`
	MetaKeywords    string `json:"meta_keywords"`

	Images     []productImageInput     `json:"images"`
	Attributes []productAttributeInput `json:"attributes"`
	Variants   []productVariantInput   `json:"variants"`

	RedirectTo string `json:"redirect_to"`
}

func decodeProductForm(r *http.Request) (*productForm, error) {
	var form productForm
	if err := json.NewDecoder(r.Body).Decode(&form); err != nil {
		return nil, err
	}
	return &form, nil
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

func (h *AdminHandler) CreateProduct() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		h.renderer.Render(w, r, "Pages/Admin/Products/Create", h.productFormProps(r.Context()))
	}
}

func (h *AdminHandler) EditProduct() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		productUUID, err := parseUUID(id)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/products", inertia.WithFlash(inertia.Flash{
				"error": "Invalid product ID.",
			}))
			return
		}

		product, err := h.queries.GetProductByID(r.Context(), productUUID)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/products", inertia.WithFlash(inertia.Flash{
				"error": "Product not found.",
			}))
			return
		}

		images, _ := h.queries.ListProductImages(r.Context(), productUUID)
		variants, _ := h.queries.ListProductVariants(r.Context(), productUUID)
		attributes, _ := h.queries.ListProductAttributes(r.Context(), productUUID)

		props := h.productFormProps(r.Context())
		props["product"] = serializeAdminProduct(product)
		props["product_images"] = serializeAdminImages(images)
		props["product_variants"] = serializeAdminVariants(variants)
		props["product_attributes"] = serializeAdminProductAttributes(attributes)

		h.renderer.Render(w, r, "Pages/Admin/Products/Edit", props)
	}
}

// ---------------------------------------------------------------------------
// Create / update
// ---------------------------------------------------------------------------

func (h *AdminHandler) StoreProduct() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		form, err := decodeProductForm(r)
		if err != nil {
			h.redirectWithErrors(w, r, "/admin/products/create", nil, "Could not read the submitted product data.")
			return
		}

		errs := h.validateProductForm(r.Context(), form, nil)
		if len(errs) > 0 {
			h.redirectWithErrors(w, r, "/admin/products/create", errs, "Please correct the highlighted fields.")
			return
		}

		product, err := h.persistProduct(r.Context(), nil, form)
		if err != nil {
			h.redirectWithErrors(w, r, "/admin/products/create", nil, "Failed to create product: "+err.Error())
			return
		}

		target := "/admin/products"
		if form.RedirectTo == "edit" {
			target = fmt.Sprintf("/admin/products/%x/edit", product.ID.Bytes)
		}

		h.renderer.Redirect(w, r, target, inertia.WithFlash(inertia.Flash{
			"success": fmt.Sprintf("Product %q created.", product.Name),
		}))
	}
}

func (h *AdminHandler) UpdateProduct() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		productUUID, err := parseUUID(id)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/products", inertia.WithFlash(inertia.Flash{
				"error": "Invalid product ID.",
			}))
			return
		}

		editURL := "/admin/products/" + id + "/edit"

		form, err := decodeProductForm(r)
		if err != nil {
			h.redirectWithErrors(w, r, editURL, nil, "Could not read the submitted product data.")
			return
		}

		errs := h.validateProductForm(r.Context(), form, &productUUID)
		if len(errs) > 0 {
			h.redirectWithErrors(w, r, editURL, errs, "Please correct the highlighted fields.")
			return
		}

		product, err := h.persistProduct(r.Context(), &productUUID, form)
		if err != nil {
			h.redirectWithErrors(w, r, editURL, nil, "Failed to update product: "+err.Error())
			return
		}

		target := "/admin/products"
		if form.RedirectTo == "edit" {
			target = editURL
		}

		h.renderer.Redirect(w, r, target, inertia.WithFlash(inertia.Flash{
			"success": fmt.Sprintf("Product %q updated.", product.Name),
		}))
	}
}

func (h *AdminHandler) redirectWithErrors(w http.ResponseWriter, r *http.Request, url string, errs inertia.ValidationErrors, message string) {
	opts := []inertia.RedirectOption{inertia.WithFlash(inertia.Flash{"error": message})}
	if len(errs) > 0 {
		opts = append(opts, inertia.WithValidationErrors(errs))
	}
	h.renderer.Redirect(w, r, url, opts...)
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

// persistProduct writes the product together with its images, variants and
// attributes in one transaction so a partial save is never committed.
func (h *AdminHandler) persistProduct(ctx context.Context, id *pgtype.UUID, form *productForm) (db.Product, error) {
	tx, err := h.pool.Begin(ctx)
	if err != nil {
		return db.Product{}, err
	}
	defer tx.Rollback(ctx)

	qtx := h.queries.WithTx(tx)

	categoryID, err := parseUUID(form.CategoryID)
	if err != nil {
		return db.Product{}, errors.New("invalid category")
	}

	slug := slugify(strings.TrimSpace(form.URLKey))
	if slug == "" {
		slug = slugify(form.Name)
	}

	var product db.Product
	if id == nil {
		product, err = qtx.CreateProduct(ctx, db.CreateProductParams{
			CategoryID:        categoryID,
			Name:              strings.TrimSpace(form.Name),
			Slug:              slug,
			Description:       optionalText(form.Description),
			ShortDescription:  optionalText(form.ShortDescription),
			Price:             requiredNumeric(form.Price),
			CompareAtPrice:    optionalNumeric(form.CompareAtPrice),
			CostPrice:         optionalNumeric(form.CostPrice),
			Sku:               optionalText(form.Sku),
			Barcode:           optionalText(form.Barcode),
			ImageUrl:          optionalText(primaryImageURL(form.Images)),
			IsActive:          form.IsActive,
			IsFeatured:        form.IsFeatured,
			StockQuantity:     parseInt32(form.StockQuantity),
			Weight:            optionalNumeric(form.Weight),
			MetaTitle:         optionalText(form.MetaTitle),
			MetaDescription:   optionalText(form.MetaDescription),
			MetaKeywords:      optionalText(form.MetaKeywords),
			Brand:             optionalText(form.Brand),
			Tags:              normalizeTags(form.Tags),
			TrackInventory:    form.TrackInventory,
			AllowBackorders:   form.AllowBackorders,
			LowStockThreshold: parseInt32(form.LowStockThreshold),
			Length:            optionalNumeric(form.Length),
			Width:             optionalNumeric(form.Width),
			Height:            optionalNumeric(form.Height),
			SortOrder:         parseInt32(form.SortOrder),
		})
	} else {
		product, err = qtx.UpdateProduct(ctx, db.UpdateProductParams{
			ID:                *id,
			CategoryID:        categoryID,
			Name:              strings.TrimSpace(form.Name),
			Slug:              slug,
			Description:       optionalText(form.Description),
			ShortDescription:  optionalText(form.ShortDescription),
			Price:             requiredNumeric(form.Price),
			CompareAtPrice:    optionalNumeric(form.CompareAtPrice),
			CostPrice:         optionalNumeric(form.CostPrice),
			Sku:               optionalText(form.Sku),
			Barcode:           optionalText(form.Barcode),
			ImageUrl:          optionalText(primaryImageURL(form.Images)),
			IsActive:          form.IsActive,
			IsFeatured:        form.IsFeatured,
			StockQuantity:     parseInt32(form.StockQuantity),
			Weight:            optionalNumeric(form.Weight),
			MetaTitle:         optionalText(form.MetaTitle),
			MetaDescription:   optionalText(form.MetaDescription),
			MetaKeywords:      optionalText(form.MetaKeywords),
			Brand:             optionalText(form.Brand),
			Tags:              normalizeTags(form.Tags),
			TrackInventory:    form.TrackInventory,
			AllowBackorders:   form.AllowBackorders,
			LowStockThreshold: parseInt32(form.LowStockThreshold),
			Length:            optionalNumeric(form.Length),
			Width:             optionalNumeric(form.Width),
			Height:            optionalNumeric(form.Height),
			SortOrder:         parseInt32(form.SortOrder),
		})
	}
	if err != nil {
		return db.Product{}, err
	}

	if err := syncProductImages(ctx, qtx, product.ID, form.Images); err != nil {
		return db.Product{}, err
	}
	if err := syncProductVariants(ctx, qtx, product.ID, form.Variants); err != nil {
		return db.Product{}, err
	}
	if err := syncProductAttributes(ctx, qtx, product.ID, form.Attributes); err != nil {
		return db.Product{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return db.Product{}, err
	}
	return product, nil
}

// syncProductImages replaces the gallery. Nothing references product_images by
// id, so a full replace keeps the submitted order authoritative.
func syncProductImages(ctx context.Context, q *db.Queries, productID pgtype.UUID, images []productImageInput) error {
	if err := q.DeleteProductImagesByProductID(ctx, productID); err != nil {
		return err
	}

	primaryAssigned := false
	for i, img := range images {
		url := strings.TrimSpace(img.URL)
		if url == "" {
			continue
		}

		isPrimary := img.IsPrimary && !primaryAssigned
		if isPrimary {
			primaryAssigned = true
		}

		if _, err := q.CreateProductImage(ctx, db.CreateProductImageParams{
			ProductID: productID,
			Url:       url,
			AltText:   optionalText(img.AltText),
			SortOrder: int32(i),
			IsPrimary: isPrimary,
		}); err != nil {
			return err
		}
	}
	return nil
}

// syncProductVariants updates variants in place so order_items.variant_id
// references on past orders survive an edit.
func syncProductVariants(ctx context.Context, q *db.Queries, productID pgtype.UUID, variants []productVariantInput) error {
	keep := make([]pgtype.UUID, 0, len(variants))
	for _, v := range variants {
		if id, err := parseUUID(v.ID); err == nil {
			keep = append(keep, id)
		}
	}

	if err := q.DeleteVariantsNotIn(ctx, db.DeleteVariantsNotInParams{
		ProductID: productID,
		KeepIds:   keep,
	}); err != nil {
		return err
	}

	for i, v := range variants {
		options, err := json.Marshal(nonNilOptions(v.Options))
		if err != nil {
			return err
		}

		existingID, idErr := parseUUID(v.ID)
		if idErr == nil {
			_, err = q.UpdateProductVariant(ctx, db.UpdateProductVariantParams{
				ID:            existingID,
				Name:          strings.TrimSpace(v.Name),
				Sku:           optionalText(v.Sku),
				Barcode:       optionalText(v.Barcode),
				Price:         requiredNumeric(v.Price),
				StockQuantity: parseInt32(v.StockQuantity),
				IsActive:      v.IsActive,
				ImageUrl:      optionalText(v.ImageURL),
				Weight:        optionalNumeric(v.Weight),
				Options:       options,
				SortOrder:     int32(i),
			})
		} else {
			_, err = q.CreateProductVariant(ctx, db.CreateProductVariantParams{
				ProductID:     productID,
				Name:          strings.TrimSpace(v.Name),
				Sku:           optionalText(v.Sku),
				Barcode:       optionalText(v.Barcode),
				Price:         requiredNumeric(v.Price),
				StockQuantity: parseInt32(v.StockQuantity),
				IsActive:      v.IsActive,
				ImageUrl:      optionalText(v.ImageURL),
				Weight:        optionalNumeric(v.Weight),
				Options:       options,
				SortOrder:     int32(i),
			})
		}
		if err != nil {
			return err
		}
	}
	return nil
}

func syncProductAttributes(ctx context.Context, q *db.Queries, productID pgtype.UUID, attributes []productAttributeInput) error {
	if err := q.DeleteProductAttributesByProductID(ctx, productID); err != nil {
		return err
	}

	for i, attr := range attributes {
		attributeID, err := parseUUID(attr.AttributeID)
		if err != nil {
			continue
		}

		var optionID pgtype.UUID
		if parsed, err := parseUUID(attr.OptionID); err == nil {
			optionID = parsed
		}

		value := strings.TrimSpace(attr.Value)
		if value == "" && !optionID.Valid {
			continue
		}

		if _, err := q.CreateProductAttribute(ctx, db.CreateProductAttributeParams{
			ProductID:   productID,
			AttributeID: attributeID,
			OptionID:    optionID,
			Value:       optionalText(value),
			SortOrder:   int32(i),
		}); err != nil {
			return err
		}
	}
	return nil
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

func (h *AdminHandler) validateProductForm(ctx context.Context, form *productForm, excludeID *pgtype.UUID) inertia.ValidationErrors {
	errs := inertia.ValidationErrors{}

	name := strings.TrimSpace(form.Name)
	switch {
	case name == "":
		errs["name"] = "Product name is required."
	case len(name) > maxNameLength:
		errs["name"] = fmt.Sprintf("Product name must be %d characters or fewer.", maxNameLength)
	}

	if len(strings.TrimSpace(form.ShortDescription)) > maxShortDescriptionLength {
		errs["short_description"] = fmt.Sprintf("Short description must be %d characters or fewer.", maxShortDescriptionLength)
	}

	if strings.TrimSpace(form.CategoryID) == "" {
		errs["category_id"] = "Select a category for this product."
	} else if _, err := parseUUID(form.CategoryID); err != nil {
		errs["category_id"] = "Select a valid category."
	}

	price, priceOK := validateMoney(errs, "price", form.Price, true)
	compareAt, compareOK := validateMoney(errs, "compare_at_price", form.CompareAtPrice, false)
	validateMoney(errs, "cost_price", form.CostPrice, false)

	if priceOK && compareOK && strings.TrimSpace(form.CompareAtPrice) != "" && compareAt > 0 && compareAt <= price {
		errs["compare_at_price"] = "Compare-at price must be higher than the selling price."
	}

	validateQuantity(errs, "stock_quantity", form.StockQuantity, true)
	validateQuantity(errs, "low_stock_threshold", form.LowStockThreshold, false)
	validateQuantity(errs, "sort_order", form.SortOrder, false)

	validateMeasure(errs, "weight", form.Weight)
	validateMeasure(errs, "length", form.Length)
	validateMeasure(errs, "width", form.Width)
	validateMeasure(errs, "height", form.Height)

	if len(strings.TrimSpace(form.MetaTitle)) > maxMetaTitleLength {
		errs["meta_title"] = fmt.Sprintf("Meta title must be %d characters or fewer.", maxMetaTitleLength)
	}
	if len(strings.TrimSpace(form.MetaKeywords)) > maxMetaKeywordsLength {
		errs["meta_keywords"] = fmt.Sprintf("Meta keywords must be %d characters or fewer.", maxMetaKeywordsLength)
	}

	h.validateSlug(ctx, errs, form, name, excludeID)
	h.validateSku(ctx, errs, form.Sku, excludeID)
	validateImages(errs, form.Images)
	validateVariants(errs, form.Variants)

	return errs
}

func (h *AdminHandler) validateSlug(ctx context.Context, errs inertia.ValidationErrors, form *productForm, name string, excludeID *pgtype.UUID) {
	slug := slugify(strings.TrimSpace(form.URLKey))
	if slug == "" {
		slug = slugify(name)
	}

	if slug == "" {
		if name != "" {
			errs["url_key"] = "Enter a URL key — one could not be generated from the product name."
		}
		return
	}
	if len(slug) > maxSlugLength {
		errs["url_key"] = fmt.Sprintf("URL key must be %d characters or fewer.", maxSlugLength)
		return
	}

	params := db.CountProductsWithSlugParams{Slug: slug}
	if excludeID != nil {
		params.ExcludeID = *excludeID
	}
	if count, err := h.queries.CountProductsWithSlug(ctx, params); err == nil && count > 0 {
		errs["url_key"] = fmt.Sprintf("The URL key %q is already used by another product.", slug)
	}
}

func (h *AdminHandler) validateSku(ctx context.Context, errs inertia.ValidationErrors, sku string, excludeID *pgtype.UUID) {
	sku = strings.TrimSpace(sku)
	if sku == "" {
		return
	}

	if len(sku) > maxSkuLength {
		errs["sku"] = fmt.Sprintf("SKU must be %d characters or fewer.", maxSkuLength)
		return
	}
	if strings.ContainsAny(sku, " \t\n") {
		errs["sku"] = "SKU cannot contain spaces."
		return
	}

	params := db.CountProductsWithSKUParams{Sku: pgtype.Text{String: sku, Valid: true}}
	if excludeID != nil {
		params.ExcludeID = *excludeID
	}
	if count, err := h.queries.CountProductsWithSKU(ctx, params); err == nil && count > 0 {
		errs["sku"] = fmt.Sprintf("SKU %q is already used by another product.", sku)
	}
}

func validateImages(errs inertia.ValidationErrors, images []productImageInput) {
	for i, img := range images {
		if strings.TrimSpace(img.URL) == "" {
			errs[fmt.Sprintf("images.%d.url", i)] = "This image has no URL. Remove it and upload again."
		}
	}
}

func validateVariants(errs inertia.ValidationErrors, variants []productVariantInput) {
	seenSku := map[string]int{}

	for i, v := range variants {
		if strings.TrimSpace(v.Name) == "" {
			errs[fmt.Sprintf("variants.%d.name", i)] = "Variant name is required."
		}

		validateMoney(errs, fmt.Sprintf("variants.%d.price", i), v.Price, true)
		validateQuantity(errs, fmt.Sprintf("variants.%d.stock_quantity", i), v.StockQuantity, true)
		validateMeasure(errs, fmt.Sprintf("variants.%d.weight", i), v.Weight)

		sku := strings.TrimSpace(v.Sku)
		if sku == "" {
			continue
		}
		if len(sku) > maxSkuLength {
			errs[fmt.Sprintf("variants.%d.sku", i)] = fmt.Sprintf("SKU must be %d characters or fewer.", maxSkuLength)
			continue
		}
		if first, ok := seenSku[strings.ToLower(sku)]; ok {
			errs[fmt.Sprintf("variants.%d.sku", i)] = fmt.Sprintf("Duplicate SKU — already used by variant %d.", first+1)
			continue
		}
		seenSku[strings.ToLower(sku)] = i
	}
}

func validateMoney(errs inertia.ValidationErrors, field, raw string, required bool) (float64, bool) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		if required {
			errs[field] = "This field is required."
			return 0, false
		}
		return 0, true
	}

	value, err := strconv.ParseFloat(raw, 64)
	if err != nil {
		errs[field] = "Enter a valid amount."
		return 0, false
	}
	if value < 0 {
		errs[field] = "Amount cannot be negative."
		return value, false
	}
	if value > 99999999.99 {
		errs[field] = "Amount is too large."
		return value, false
	}
	return value, true
}

func validateQuantity(errs inertia.ValidationErrors, field, raw string, required bool) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		if required {
			errs[field] = "This field is required."
		}
		return
	}

	value, err := strconv.Atoi(raw)
	if err != nil {
		errs[field] = "Enter a whole number."
		return
	}
	if value < 0 {
		errs[field] = "Value cannot be negative."
	}
}

func validateMeasure(errs inertia.ValidationErrors, field, raw string) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return
	}

	value, err := strconv.ParseFloat(raw, 64)
	if err != nil {
		errs[field] = "Enter a valid number."
		return
	}
	if value < 0 {
		errs[field] = "Value cannot be negative."
	}
}

// ---------------------------------------------------------------------------
// Shared form props
// ---------------------------------------------------------------------------

// productFormProps returns the reference data the create and edit forms share:
// the full category tree, the attribute catalogue and the known brands.
func (h *AdminHandler) productFormProps(ctx context.Context) inertia.Props {
	categories, _ := h.queries.ListCategories(ctx)
	serializedCategories := make([]map[string]any, len(categories))
	for i, c := range categories {
		serializedCategories[i] = map[string]any{
			"id":        fmt.Sprintf("%x", c.ID.Bytes),
			"parent_id": nullableUUID(c.ParentID),
			"name":      c.Name,
			"slug":      c.Slug,
			"is_active": c.IsActive,
		}
	}

	attributes, _ := h.queries.ListAttributes(ctx)
	options, _ := h.queries.ListAttributeOptions(ctx)

	optionsByAttribute := map[string][]map[string]any{}
	for _, o := range options {
		key := fmt.Sprintf("%x", o.AttributeID.Bytes)
		optionsByAttribute[key] = append(optionsByAttribute[key], map[string]any{
			"id":    fmt.Sprintf("%x", o.ID.Bytes),
			"value": o.Value,
		})
	}

	serializedAttributes := make([]map[string]any, len(attributes))
	for i, a := range attributes {
		id := fmt.Sprintf("%x", a.ID.Bytes)
		opts := optionsByAttribute[id]
		if opts == nil {
			opts = []map[string]any{}
		}
		serializedAttributes[i] = map[string]any{
			"id":          id,
			"code":        a.Code,
			"name":        a.Name,
			"type":        a.Type,
			"is_required": a.IsRequired,
			"is_variant":  a.IsVariant,
			"options":     opts,
		}
	}

	brandRows, _ := h.queries.ListProductBrands(ctx)
	brands := make([]string, 0, len(brandRows))
	for _, b := range brandRows {
		if b.Valid && b.String != "" {
			brands = append(brands, b.String)
		}
	}

	return inertia.Props{
		"categories": serializedCategories,
		"attributes": serializedAttributes,
		"brands":     brands,
		"currency":   storeCurrency,
		"tax_rate":   h.settings.Get(ctx).TaxRate,
	}
}

// ---------------------------------------------------------------------------
// Attribute maintenance (called over XHR from the product form)
// ---------------------------------------------------------------------------

type attributeInput struct {
	Name      string   `json:"name"`
	Type      string   `json:"type"`
	IsVariant bool     `json:"is_variant"`
	Options   []string `json:"options"`
}

var attributeTypes = map[string]bool{
	"text": true, "textarea": true, "number": true,
	"boolean": true, "select": true, "multiselect": true,
}

func (h *AdminHandler) StoreAttribute() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var input attributeInput
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Could not read the attribute data."})
			return
		}

		name := strings.TrimSpace(input.Name)
		if name == "" {
			writeJSON(w, http.StatusUnprocessableEntity, map[string]any{"error": "Attribute name is required."})
			return
		}
		if !attributeTypes[input.Type] {
			input.Type = "text"
		}

		code := slugify(name)
		if code == "" {
			writeJSON(w, http.StatusUnprocessableEntity, map[string]any{"error": "Attribute name must contain letters or numbers."})
			return
		}

		existing, err := h.queries.GetAttributeByCode(r.Context(), code)
		if err == nil {
			writeJSON(w, http.StatusConflict, map[string]any{
				"error": fmt.Sprintf("An attribute named %q already exists.", existing.Name),
			})
			return
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}

		attribute, err := h.queries.CreateAttribute(r.Context(), db.CreateAttributeParams{
			Code:      code,
			Name:      name,
			Type:      input.Type,
			IsVariant: input.IsVariant,
			SortOrder: 100,
		})
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}

		serializedOptions := []map[string]any{}
		for i, value := range input.Options {
			value = strings.TrimSpace(value)
			if value == "" {
				continue
			}
			option, err := h.queries.CreateAttributeOption(r.Context(), db.CreateAttributeOptionParams{
				AttributeID: attribute.ID,
				Value:       value,
				SortOrder:   int32(i * 10),
			})
			if err != nil {
				continue
			}
			serializedOptions = append(serializedOptions, map[string]any{
				"id":    fmt.Sprintf("%x", option.ID.Bytes),
				"value": option.Value,
			})
		}

		writeJSON(w, http.StatusCreated, map[string]any{
			"id":          fmt.Sprintf("%x", attribute.ID.Bytes),
			"code":        attribute.Code,
			"name":        attribute.Name,
			"type":        attribute.Type,
			"is_required": attribute.IsRequired,
			"is_variant":  attribute.IsVariant,
			"options":     serializedOptions,
		})
	}
}

func (h *AdminHandler) StoreAttributeOption() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		attributeID, err := parseUUID(chi.URLParam(r, "id"))
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Invalid attribute."})
			return
		}

		var input struct {
			Value string `json:"value"`
		}
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Could not read the option data."})
			return
		}

		value := strings.TrimSpace(input.Value)
		if value == "" {
			writeJSON(w, http.StatusUnprocessableEntity, map[string]any{"error": "Option value is required."})
			return
		}

		option, err := h.queries.CreateAttributeOption(r.Context(), db.CreateAttributeOptionParams{
			AttributeID: attributeID,
			Value:       value,
			SortOrder:   100,
		})
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}

		writeJSON(w, http.StatusCreated, map[string]any{
			"id":           fmt.Sprintf("%x", option.ID.Bytes),
			"attribute_id": fmt.Sprintf("%x", option.AttributeID.Bytes),
			"value":        option.Value,
		})
	}
}

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

func serializeAdminProduct(p db.GetProductByIDRow) map[string]any {
	return map[string]any{
		"id":                  fmt.Sprintf("%x", p.ID.Bytes),
		"category_id":         fmt.Sprintf("%x", p.CategoryID.Bytes),
		"name":                p.Name,
		"url_key":             p.Slug,
		"slug":                p.Slug,
		"description":         p.Description.String,
		"short_description":   p.ShortDescription.String,
		"price":               formatNumeric(p.Price),
		"compare_at_price":    optionalNumericString(p.CompareAtPrice),
		"cost_price":          optionalNumericString(p.CostPrice),
		"sku":                 p.Sku.String,
		"barcode":             p.Barcode.String,
		"image_url":           p.ImageUrl.String,
		"brand":               p.Brand.String,
		"tags":                p.Tags,
		"is_active":           p.IsActive,
		"is_featured":         p.IsFeatured,
		"stock_quantity":      p.StockQuantity,
		"track_inventory":     p.TrackInventory,
		"allow_backorders":    p.AllowBackorders,
		"low_stock_threshold": p.LowStockThreshold,
		"weight":              optionalNumericString(p.Weight),
		"length":              optionalNumericString(p.Length),
		"width":               optionalNumericString(p.Width),
		"height":              optionalNumericString(p.Height),
		"sort_order":          p.SortOrder,
		"meta_title":          p.MetaTitle.String,
		"meta_description":    p.MetaDescription.String,
		"meta_keywords":       p.MetaKeywords.String,
		"category_name":       p.CategoryName,
		"category_slug":       p.CategorySlug,
	}
}

func serializeAdminImages(images []db.ProductImage) []map[string]any {
	out := make([]map[string]any, len(images))
	for i, img := range images {
		out[i] = map[string]any{
			"id":         fmt.Sprintf("%x", img.ID.Bytes),
			"url":        img.Url,
			"alt_text":   img.AltText.String,
			"is_primary": img.IsPrimary,
		}
	}
	return out
}

func serializeAdminVariants(variants []db.ProductVariant) []map[string]any {
	out := make([]map[string]any, len(variants))
	for i, v := range variants {
		options := map[string]string{}
		if len(v.Options) > 0 {
			_ = json.Unmarshal(v.Options, &options)
		}
		out[i] = map[string]any{
			"id":             fmt.Sprintf("%x", v.ID.Bytes),
			"name":           v.Name,
			"sku":            v.Sku.String,
			"barcode":        v.Barcode.String,
			"price":          formatNumeric(v.Price),
			"stock_quantity": v.StockQuantity,
			"weight":         optionalNumericString(v.Weight),
			"image_url":      v.ImageUrl.String,
			"is_active":      v.IsActive,
			"options":        options,
		}
	}
	return out
}

func serializeAdminProductAttributes(rows []db.ListProductAttributesRow) []map[string]any {
	out := make([]map[string]any, len(rows))
	for i, row := range rows {
		out[i] = map[string]any{
			"attribute_id":   fmt.Sprintf("%x", row.AttributeID.Bytes),
			"attribute_code": row.AttributeCode,
			"attribute_name": row.AttributeName,
			"attribute_type": row.AttributeType,
			"option_id":      nullableUUID(row.OptionID),
			"value":          row.Value.String,
		}
	}
	return out
}

// ---------------------------------------------------------------------------
// Field helpers
// ---------------------------------------------------------------------------

func optionalText(s string) pgtype.Text {
	s = strings.TrimSpace(s)
	return pgtype.Text{String: s, Valid: s != ""}
}

// optionalNumeric returns SQL NULL for blank input so "not set" and "zero" stay
// distinguishable in the database.
func optionalNumeric(s string) pgtype.Numeric {
	s = strings.TrimSpace(s)
	if s == "" {
		return pgtype.Numeric{}
	}
	value, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return pgtype.Numeric{}
	}
	return floatToNumeric(value)
}

func requiredNumeric(s string) pgtype.Numeric {
	value, _ := strconv.ParseFloat(strings.TrimSpace(s), 64)
	return floatToNumeric(value)
}

func optionalNumericString(n pgtype.Numeric) string {
	if !n.Valid {
		return ""
	}
	return formatNumeric(n)
}

func parseInt32(s string) int32 {
	value, err := strconv.ParseInt(strings.TrimSpace(s), 10, 32)
	if err != nil {
		return 0
	}
	return int32(value)
}

func nullableUUID(u pgtype.UUID) any {
	if !u.Valid {
		return nil
	}
	return fmt.Sprintf("%x", u.Bytes)
}

func normalizeTags(tags []string) []string {
	out := make([]string, 0, len(tags))
	seen := map[string]bool{}
	for _, tag := range tags {
		tag = strings.TrimSpace(tag)
		if tag == "" || seen[strings.ToLower(tag)] {
			continue
		}
		seen[strings.ToLower(tag)] = true
		out = append(out, tag)
	}
	return out
}

func nonNilOptions(options map[string]string) map[string]string {
	if options == nil {
		return map[string]string{}
	}
	return options
}

// primaryImageURL keeps products.image_url in step with the gallery so the
// storefront and the admin product list keep rendering a thumbnail.
func primaryImageURL(images []productImageInput) string {
	for _, img := range images {
		if img.IsPrimary && strings.TrimSpace(img.URL) != "" {
			return strings.TrimSpace(img.URL)
		}
	}
	for _, img := range images {
		if strings.TrimSpace(img.URL) != "" {
			return strings.TrimSpace(img.URL)
		}
	}
	return ""
}
