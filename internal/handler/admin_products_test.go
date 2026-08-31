package handler

import (
	"testing"

	inertia "github.com/mayahiro/go-inertia"
)

func TestValidateMoney(t *testing.T) {
	tests := []struct {
		name      string
		raw       string
		required  bool
		wantError bool
	}{
		{"blank optional", "", false, false},
		{"blank required", "", true, true},
		{"valid", "19.99", true, false},
		{"zero", "0", true, false},
		{"negative", "-1", true, true},
		{"not a number", "abc", true, true},
		{"too large", "100000000", true, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errs := inertia.ValidationErrors{}
			validateMoney(errs, "price", tt.raw, tt.required)
			if got := len(errs) > 0; got != tt.wantError {
				t.Fatalf("validateMoney(%q, required=%v) error=%v, want %v", tt.raw, tt.required, got, tt.wantError)
			}
		})
	}
}

func TestValidateQuantity(t *testing.T) {
	tests := []struct {
		raw       string
		required  bool
		wantError bool
	}{
		{"", false, false},
		{"", true, true},
		{"0", true, false},
		{"25", true, false},
		{"-3", true, true},
		{"1.5", true, true},
		{"lots", true, true},
	}

	for _, tt := range tests {
		errs := inertia.ValidationErrors{}
		validateQuantity(errs, "stock_quantity", tt.raw, tt.required)
		if got := len(errs) > 0; got != tt.wantError {
			t.Errorf("validateQuantity(%q, required=%v) error=%v, want %v", tt.raw, tt.required, got, tt.wantError)
		}
	}
}

func TestValidateVariantsRejectsDuplicateSKU(t *testing.T) {
	errs := inertia.ValidationErrors{}
	validateVariants(errs, []productVariantInput{
		{Name: "Small / Red", Sku: "TEE-S-RED", Price: "10.00", StockQuantity: "5"},
		{Name: "Small / Blue", Sku: "tee-s-red", Price: "10.00", StockQuantity: "5"},
	})

	if _, ok := errs["variants.1.sku"]; !ok {
		t.Fatalf("expected a duplicate SKU error on variant 1, got %v", errs)
	}
	if _, ok := errs["variants.0.sku"]; ok {
		t.Fatalf("did not expect an error on the first variant, got %v", errs)
	}
}

func TestValidateVariantsRequiresNameAndPrice(t *testing.T) {
	errs := inertia.ValidationErrors{}
	validateVariants(errs, []productVariantInput{{Name: "  ", Price: "", StockQuantity: ""}})

	for _, field := range []string{"variants.0.name", "variants.0.price", "variants.0.stock_quantity"} {
		if _, ok := errs[field]; !ok {
			t.Errorf("expected an error for %s, got %v", field, errs)
		}
	}
}

func TestValidateImagesFlagsMissingURL(t *testing.T) {
	errs := inertia.ValidationErrors{}
	validateImages(errs, []productImageInput{{URL: "https://cdn.example/a.jpg"}, {URL: "  "}})

	if _, ok := errs["images.1.url"]; !ok {
		t.Fatalf("expected an error for the blank image URL, got %v", errs)
	}
	if len(errs) != 1 {
		t.Fatalf("expected exactly one error, got %v", errs)
	}
}

func TestPrimaryImageURL(t *testing.T) {
	tests := []struct {
		name   string
		images []productImageInput
		want   string
	}{
		{"none", nil, ""},
		{
			"explicit primary",
			[]productImageInput{{URL: "a.jpg"}, {URL: "b.jpg", IsPrimary: true}},
			"b.jpg",
		},
		{
			"falls back to first",
			[]productImageInput{{URL: " "}, {URL: "c.jpg"}},
			"c.jpg",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := primaryImageURL(tt.images); got != tt.want {
				t.Fatalf("primaryImageURL() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestNormalizeTags(t *testing.T) {
	got := normalizeTags([]string{" Linen ", "linen", "", "Summer"})
	want := []string{"Linen", "Summer"}

	if len(got) != len(want) {
		t.Fatalf("normalizeTags() = %v, want %v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("normalizeTags() = %v, want %v", got, want)
		}
	}
}

func TestOptionalNumericIsNullForBlank(t *testing.T) {
	if optionalNumeric("").Valid {
		t.Fatal("blank input should produce SQL NULL")
	}
	if optionalNumeric("not a number").Valid {
		t.Fatal("unparseable input should produce SQL NULL")
	}
	if !optionalNumeric("0").Valid {
		t.Fatal(`"0" should produce a valid zero, not NULL`)
	}
}

func TestOptionalNumericStringRoundTrip(t *testing.T) {
	if got := optionalNumericString(optionalNumeric("")); got != "" {
		t.Fatalf("NULL numeric should serialize to an empty string, got %q", got)
	}
	if got := optionalNumericString(optionalNumeric("12.5")); got != "12.50" {
		t.Fatalf("optionalNumericString() = %q, want %q", got, "12.50")
	}
}

func TestParseInt32(t *testing.T) {
	tests := map[string]int32{"": 0, "7": 7, "-2": -2, "abc": 0, " 12 ": 12}
	for raw, want := range tests {
		if got := parseInt32(raw); got != want {
			t.Errorf("parseInt32(%q) = %d, want %d", raw, got, want)
		}
	}
}

func TestSlugify(t *testing.T) {
	tests := map[string]string{
		"Merino Wool Overcoat": "merino-wool-overcoat",
		"  Spaced  Out  ":      "spaced-out",
		"under_scored":         "under-scored",
	}
	for input, want := range tests {
		if got := slugify(input); got != want {
			t.Errorf("slugify(%q) = %q, want %q", input, got, want)
		}
	}
}
