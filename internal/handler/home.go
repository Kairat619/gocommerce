package handler

import (
	"fmt"
	"net/http"

	inertia "github.com/mayahiro/go-inertia"

	"gocommerce/internal/db"
)

// Home renders the storefront landing page via Inertia.
func Home(renderer *inertia.Renderer, queries *db.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		featured, _ := queries.ListFeaturedProducts(r.Context(), 8)
		categories, _ := queries.ListActiveCategories(r.Context())

		err := renderer.Render(w, r, "Pages/Welcome", inertia.Props{
			"message":           "Welcome to ShopNest — curated home & lifestyle essentials.",
			"featured_products": serializeFeaturedProducts(featured),
			"categories":        serializeCategoriesWithCount(categories),
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}

func serializeFeaturedProducts(products []db.ListFeaturedProductsRow) []map[string]any {
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
