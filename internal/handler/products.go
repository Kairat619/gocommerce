package handler

import (
	"fmt"
	"math"
	"math/big"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	inertia "github.com/mayahiro/go-inertia"

	"gocommerce/internal/db"
)

func floatToNumeric(f float64) pgtype.Numeric {
	cents := int64(math.Round(f * 100))
	return pgtype.Numeric{
		Int:   big.NewInt(cents),
		Exp:   -2,
		Valid: true,
	}
}

const productsPerPage = 12

type ProductHandler struct {
	renderer *inertia.Renderer
	queries  *db.Queries
}

func NewProductHandler(renderer *inertia.Renderer, queries *db.Queries) *ProductHandler {
	return &ProductHandler{renderer: renderer, queries: queries}
}

func (h *ProductHandler) Index() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		page := getPageParam(r)
		offset := int32((page - 1) * productsPerPage)

		search := r.URL.Query().Get("q")
		categorySlug := r.URL.Query().Get("category")
		minPriceStr := r.URL.Query().Get("min_price")
		maxPriceStr := r.URL.Query().Get("max_price")

		var pgSearch pgtype.Text
		if search != "" {
			pgSearch = pgtype.Text{String: search, Valid: true}
		}

		var pgCategory pgtype.Text
		if categorySlug != "" {
			pgCategory = pgtype.Text{String: categorySlug, Valid: true}
		}

		var minPriceNum, maxPriceNum pgtype.Numeric
		if minPriceStr != "" {
			if v, e := strconv.ParseFloat(minPriceStr, 64); e == nil {
				minPriceNum = floatToNumeric(v)
			}
		}
		if maxPriceStr != "" {
			if v, e := strconv.ParseFloat(maxPriceStr, 64); e == nil {
				maxPriceNum = floatToNumeric(v)
			}
		}

		results, err := h.queries.FilterProducts(r.Context(), db.FilterProductsParams{
			Limit:    int32(productsPerPage),
			Offset:   offset,
			Search:   pgSearch,
			Category: pgCategory,
			MinPrice: minPriceNum,
			MaxPrice: maxPriceNum,
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		serializedProducts := serializeFilterProducts(results)

		total, err := h.queries.CountFilterProducts(r.Context(), db.CountFilterProductsParams{
			Search:   pgSearch,
			Category: pgCategory,
			MinPrice: minPriceNum,
			MaxPrice: maxPriceNum,
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		categories, _ := h.queries.ListActiveCategories(r.Context())

		h.renderer.Render(w, r, "Pages/Products/Index", inertia.Props{
			"products":   serializedProducts,
			"categories": serializeCategoriesWithCount(categories),
			"pagination": map[string]any{
				"current": page,
				"total":   totalPages(total, productsPerPage),
			},
			"search":    search,
			"category":  categorySlug,
			"min_price": minPriceStr,
			"max_price": maxPriceStr,
		})
	}
}

func (h *ProductHandler) Show() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		slug := chi.URLParam(r, "slug")

		product, err := h.queries.GetProductBySlug(r.Context(), slug)
		if err != nil {
			h.renderer.RenderError(w, r, "Pages/Errors/404", inertia.Props{}, http.StatusNotFound)
			return
		}

		images, _ := h.queries.ListProductImages(r.Context(), product.ID)
		variants, _ := h.queries.ListActiveProductVariants(r.Context(), product.ID)

		// Get related products (same category)
		relatedProducts, _ := h.queries.ListProductsByCategory(r.Context(), db.ListProductsByCategoryParams{
			Slug:   product.CategorySlug,
			Limit:  4,
			Offset: 0,
		})

		// Filter out current product from related
		var filteredRelated []map[string]any
		for _, rp := range relatedProducts {
			if fmt.Sprintf("%x", rp.ID.Bytes) != fmt.Sprintf("%x", product.ID.Bytes) {
				filteredRelated = append(filteredRelated, map[string]any{
					"id":            fmt.Sprintf("%x", rp.ID.Bytes),
					"name":          rp.Name,
					"slug":          rp.Slug,
					"price":         formatNumeric(rp.Price),
					"image_url":     rp.ImageUrl.String,
					"category_name": rp.CategoryName,
				})
			}
		}

		h.renderer.Render(w, r, "Pages/Products/Show", inertia.Props{
			"product":          serializeProductWithCategory(product),
			"images":           serializeProductImages(images),
			"variants":         serializeProductVariants(variants),
			"related_products": filteredRelated,
		})
	}
}

func getPageParam(r *http.Request) int {
	p, err := strconv.Atoi(r.URL.Query().Get("page"))
	if err != nil || p < 1 {
		return 1
	}
	return p
}

func totalPages(total int64, perPage int) int {
	if total == 0 {
		return 1
	}
	pages := int(total) / perPage
	if int(total)%perPage > 0 {
		pages++
	}
	return pages
}

func serializeFilterProducts(products []db.FilterProductsRow) []map[string]any {
	out := make([]map[string]any, len(products))
	for i, p := range products {
		out[i] = map[string]any{
			"id":               fmt.Sprintf("%x", p.ID.Bytes),
			"name":             p.Name,
			"slug":             p.Slug,
			"description":      p.Description.String,
			"price":            formatNumeric(p.Price),
			"compare_at_price": formatNumeric(p.CompareAtPrice),
			"sku":              p.Sku.String,
			"image_url":        p.ImageUrl.String,
			"is_featured":      p.IsFeatured,
			"stock_quantity":   p.StockQuantity,
			"category_name":    p.CategoryName,
			"category_slug":    p.CategorySlug,
		}
	}
	return out
}

func serializeProductWithCategory(p db.GetProductBySlugRow) map[string]any {
	return map[string]any{
		"id":               fmt.Sprintf("%x", p.ID.Bytes),
		"name":             p.Name,
		"slug":             p.Slug,
		"description":      p.Description.String,
		"price":            formatNumeric(p.Price),
		"compare_at_price": formatNumeric(p.CompareAtPrice),
		"sku":              p.Sku.String,
		"barcode":          p.Barcode.String,
		"image_url":        p.ImageUrl.String,
		"is_featured":      p.IsFeatured,
		"stock_quantity":   p.StockQuantity,
		"weight":           formatNumeric(p.Weight),
		"meta_title":       p.MetaTitle.String,
		"meta_description": p.MetaDescription.String,
		"category_name":    p.CategoryName,
		"category_slug":    p.CategorySlug,
	}
}

func serializeProductImages(images []db.ProductImage) []map[string]any {
	out := make([]map[string]any, len(images))
	for i, img := range images {
		out[i] = map[string]any{
			"id":         fmt.Sprintf("%x", img.ID.Bytes),
			"url":        img.Url,
			"alt_text":   img.AltText.String,
			"sort_order": img.SortOrder,
			"is_primary": img.IsPrimary,
		}
	}
	return out
}

func serializeProductVariants(variants []db.ProductVariant) []map[string]any {
	out := make([]map[string]any, len(variants))
	for i, v := range variants {
		out[i] = map[string]any{
			"id":             fmt.Sprintf("%x", v.ID.Bytes),
			"name":           v.Name,
			"sku":            v.Sku.String,
			"price":          formatNumeric(v.Price),
			"stock_quantity": v.StockQuantity,
			"is_active":      v.IsActive,
		}
	}
	return out
}

func formatNumeric(n pgtype.Numeric) string {
	if !n.Valid {
		return "0.00"
	}
	f, err := n.Float64Value()
	if err != nil {
		return "0.00"
	}
	return fmt.Sprintf("%.2f", f.Float64)
}
