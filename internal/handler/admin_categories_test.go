package handler

import (
	"strings"
	"testing"
)

func TestCategorySlugify(t *testing.T) {
	tests := map[string]string{
		"Kitchen Appliances":  "kitchen-appliances",
		"  Spaced  Out  ":     "spaced-out",
		"under_scored":        "under-scored",
		"Home & Kitchen":      "home-kitchen",
		"Men's / Women's":     "men-s-women-s",
		"Café Décor":          "caf-d-cor",
		"---Already-Hyphen--": "already-hyphen",
		"Tier 2":              "tier-2",
		"":                    "",
		"!!!":                 "",
		"Электроника":         "",
	}

	for input, want := range tests {
		if got := categorySlugify(input); got != want {
			t.Errorf("categorySlugify(%q) = %q, want %q", input, got, want)
		}
	}
}

// A slug that survives a second pass is one the storefront route can serve
// unchanged, which is what keeps /categories/{slug} stable across saves.
func TestCategorySlugifyIsIdempotent(t *testing.T) {
	inputs := []string{"Kitchen Appliances", "Home & Kitchen", "Tier 2", "already-fine"}

	for _, input := range inputs {
		once := categorySlugify(input)
		if twice := categorySlugify(once); twice != once {
			t.Errorf("categorySlugify(%q) = %q, but re-slugifying gives %q", input, once, twice)
		}
	}
}

func TestCategorySlugifyProducesURLSafeOutput(t *testing.T) {
	const allowed = "abcdefghijklmnopqrstuvwxyz0123456789-"

	inputs := []string{
		"Home & Kitchen",
		"50% Off!",
		"a/b?c=d#e",
		"Ünïcödé",
		"tabs\tand\nnewlines",
	}

	for _, input := range inputs {
		slug := categorySlugify(input)

		for _, r := range slug {
			if !strings.ContainsRune(allowed, r) {
				t.Errorf("categorySlugify(%q) = %q, which contains the unsafe character %q", input, slug, r)
			}
		}
		if strings.HasPrefix(slug, "-") || strings.HasSuffix(slug, "-") {
			t.Errorf("categorySlugify(%q) = %q, which has a stray leading or trailing hyphen", input, slug)
		}
		if strings.Contains(slug, "--") {
			t.Errorf("categorySlugify(%q) = %q, which has a doubled hyphen", input, slug)
		}
	}
}
