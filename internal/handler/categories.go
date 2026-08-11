package handler

import (
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	inertia "github.com/mayahiro/go-inertia"

	"gocommerce/internal/db"
)

type CategoryHandler struct {
	renderer *inertia.Renderer
	queries  *db.Queries
}

func NewCategoryHandler(renderer *inertia.Renderer, queries *db.Queries) *CategoryHandler {
	return &CategoryHandler{renderer: renderer, queries: queries}
}

func (h *CategoryHandler) Index() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		categories, err := h.queries.ListActiveCategories(r.Context())
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		h.renderer.Render(w, r, "Pages/Categories/Index", inertia.Props{
			"categories": serializeCategoriesWithCount(categories),
		})
	}
}

func (h *CategoryHandler) Show() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		slug := chi.URLParam(r, "slug")

		category, err := h.queries.GetCategoryBySlug(r.Context(), slug)
		if err != nil {
			h.renderer.RenderError(w, r, "Pages/Errors/404", inertia.Props{}, http.StatusNotFound)
			return
		}

		page := getPageParam(r)
		offset := int32((page - 1) * productsPerPage)

		products, err := h.queries.ListProductsByCategory(r.Context(), db.ListProductsByCategoryParams{
			Slug:   slug,
			Limit:  int32(productsPerPage),
			Offset: offset,
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		total, err := h.queries.CountProductsByCategory(r.Context(), slug)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		h.renderer.Render(w, r, "Pages/Categories/Show", inertia.Props{
			"category": map[string]any{
				"id":          fmt.Sprintf("%x", category.ID.Bytes),
				"name":        category.Name,
				"slug":        category.Slug,
				"description": category.Description.String,
			},
			"products": serializeCategoryProducts(products),
			"pagination": map[string]any{
				"current": page,
				"total":   totalPages(total, productsPerPage),
			},
		})
	}
}

func serializeCategoriesWithCount(categories []db.ListActiveCategoriesRow) []map[string]any {
	out := make([]map[string]any, len(categories))
	for i, c := range categories {
		out[i] = map[string]any{
			"id":            fmt.Sprintf("%x", c.ID.Bytes),
			"name":          c.Name,
			"slug":          c.Slug,
			"description":   c.Description.String,
			"product_count": c.ProductCount,
		}
	}
	return out
}

func serializeCategoryProducts(products []db.ListProductsByCategoryRow) []map[string]any {
	out := make([]map[string]any, len(products))
	for i, p := range products {
		out[i] = map[string]any{
			"id":             fmt.Sprintf("%x", p.ID.Bytes),
			"name":           p.Name,
			"slug":           p.Slug,
			"description":    p.Description.String,
			"price":          formatNumeric(p.Price),
			"image_url":      p.ImageUrl.String,
			"stock_quantity": p.StockQuantity,
			"category_name":  p.CategoryName,
			"category_slug":  p.CategorySlug,
		}
	}
	return out
}
