package handler

import (
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	inertia "github.com/mayahiro/go-inertia"

	"gocommerce/internal/db"
)

// CollectionHandler serves the customer-facing collection pages. It mirrors
// CategoryHandler deliberately: same pagination, same 404 behaviour, same
// serialisation shape, so ProductGrid and Pagination work unchanged.
type CollectionHandler struct {
	renderer *inertia.Renderer
	queries  *db.Queries
}

func NewCollectionHandler(renderer *inertia.Renderer, queries *db.Queries) *CollectionHandler {
	return &CollectionHandler{renderer: renderer, queries: queries}
}

func (h *CollectionHandler) Index() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		collections, err := h.queries.ListActiveCollections(r.Context())
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		out := make([]map[string]any, len(collections))
		for i, c := range collections {
			out[i] = map[string]any{
				"id":            fmt.Sprintf("%x", c.ID.Bytes),
				"name":          c.Name,
				"slug":          c.Slug,
				"description":   c.Description.String,
				"image_url":     c.ImageUrl.String,
				"is_featured":   c.IsFeatured,
				"product_count": c.ProductCount,
			}
		}

		h.renderer.Render(w, r, "Pages/Collections/Index", inertia.Props{
			"collections": out,
		})
	}
}

func (h *CollectionHandler) Show() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		slug := chi.URLParam(r, "slug")

		collection, err := h.queries.GetCollectionBySlug(r.Context(), slug)
		if err != nil {
			h.renderer.RenderError(w, r, "Pages/Errors/404", inertia.Props{}, http.StatusNotFound)
			return
		}

		// A disabled collection is unreachable rather than empty, so an
		// unpublished page never becomes a thin-content URL in search results.
		if !collection.IsActive {
			h.renderer.RenderError(w, r, "Pages/Errors/404", inertia.Props{}, http.StatusNotFound)
			return
		}

		page := getPageParam(r)
		offset := int32((page - 1) * productsPerPage)

		products, err := h.queries.ListActiveCollectionProducts(r.Context(), db.ListActiveCollectionProductsParams{
			CollectionID: collection.ID,
			Limit:        int32(productsPerPage),
			Offset:       offset,
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		total, err := h.queries.CountActiveCollectionProducts(r.Context(), collection.ID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		h.renderer.Render(w, r, "Pages/Collections/Show", inertia.Props{
			"collection": map[string]any{
				"id":               fmt.Sprintf("%x", collection.ID.Bytes),
				"name":             collection.Name,
				"slug":             collection.Slug,
				"description":      collection.Description.String,
				"image_url":        collection.ImageUrl.String,
				"meta_title":       collection.MetaTitle.String,
				"meta_description": collection.MetaDescription.String,
			},
			"products": serializeCollectionProducts(products),
			"pagination": map[string]any{
				"current": page,
				"total":   totalPages(total, productsPerPage),
			},
		})
	}
}

func serializeCollectionProducts(products []db.ListActiveCollectionProductsRow) []map[string]any {
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
