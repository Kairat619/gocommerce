package handler

import (
	"strings"
	"testing"

	inertia "github.com/mayahiro/go-inertia"

	"gocommerce/internal/service"
)

// A real DSN carries the password in its userinfo. databaseHost is the only
// thing standing between that string and a browser, so it gets a test rather
// than a comment.
func TestDatabaseHostNeverLeaksCredentials(t *testing.T) {
	cases := []struct {
		name string
		dsn  string
		want string
	}{
		{
			name: "password in userinfo is stripped",
			dsn:  "postgres://gocommerce:sup3r-s3cret@db.example.com:5432/gocommerce?sslmode=disable",
			want: "db.example.com",
		},
		{
			name: "no port",
			dsn:  "postgres://user:pw@localhost/gocommerce",
			want: "localhost",
		},
		{
			name: "no credentials at all",
			dsn:  "postgres://localhost:5432/gocommerce",
			want: "localhost",
		},
		{
			// Rather than risk returning a fragment of something unparseable,
			// the function returns nothing at all.
			name: "unparseable dsn yields nothing",
			dsn:  "host=localhost user=gocommerce password=sup3r-s3cret dbname=gocommerce",
			want: "",
		},
		{
			name: "empty dsn yields nothing",
			dsn:  "",
			want: "",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := databaseHost(tc.dsn)
			if got != tc.want {
				t.Errorf("databaseHost(%q) = %q, want %q", tc.dsn, got, tc.want)
			}
			// The belt-and-braces assertion: whatever comes back, it must not
			// contain the password from any of the inputs above.
			for _, secret := range []string{"sup3r-s3cret", "pw"} {
				if strings.Contains(got, secret) {
					t.Errorf("databaseHost(%q) leaked %q in %q", tc.dsn, secret, got)
				}
			}
		})
	}
}

// The audit trail must describe only settings that live in store_settings.
// Diff is what feeds it, so if Diff can never emit an environment value, the
// audit trail can never contain one.
func TestDiffOnlyReportsChangedSettings(t *testing.T) {
	before := service.DefaultStoreSettings()

	after := before
	after.Currency = "KZT"
	after.StoreName = "Sharapat"

	changes := before.Diff(after)
	if len(changes) != 2 {
		t.Fatalf("expected 2 changes, got %d: %+v", len(changes), changes)
	}

	byKey := map[string]service.SettingChange{}
	for _, change := range changes {
		byKey[change.Key] = change
	}

	if c := byKey["currency"]; c.Previous != "USD" || c.New != "KZT" {
		t.Errorf("currency change = %q -> %q, want USD -> KZT", c.Previous, c.New)
	}
	if c := byKey["store_name"]; c.Previous != "ShopNest" || c.New != "Sharapat" {
		t.Errorf("store_name change = %q -> %q, want ShopNest -> Sharapat", c.Previous, c.New)
	}
}

func TestDiffIsEmptyWhenNothingChanged(t *testing.T) {
	settings := service.DefaultStoreSettings()
	if changes := settings.Diff(settings); len(changes) != 0 {
		t.Errorf("expected no changes, got %+v", changes)
	}
}

// The tax rate is stored as a fraction and shown as a percentage. An audit line
// reading "0.08000000000000002" would be useless, and one reading "0.08" when
// the administrator typed "8" would be confusing.
func TestDiffRendersTaxRateAsPercent(t *testing.T) {
	before := service.DefaultStoreSettings() // 0.08
	after := before
	after.TaxRate = 0.0825

	changes := before.Diff(after)
	if len(changes) != 1 {
		t.Fatalf("expected 1 change, got %+v", changes)
	}
	if changes[0].Key != "tax_rate_percent" {
		t.Fatalf("expected tax_rate_percent, got %q", changes[0].Key)
	}
	if changes[0].Previous != "8" || changes[0].New != "8.25" {
		t.Errorf("tax rate change = %q -> %q, want 8 -> 8.25", changes[0].Previous, changes[0].New)
	}
}

// Saving one section must leave every other section's values exactly as they
// were. This is the invariant that makes per-section saving safe, and it is one
// careless `updated = service.StoreSettings{...}` away from being lost.
func TestApplySectionTouchesOnlyItsOwnFields(t *testing.T) {
	current := service.DefaultStoreSettings()
	current.TaxRate = 0.15
	current.StoreName = "Original"
	current.Currency = "EUR"
	current.ProductsPerPage = 24

	updated := current
	errs := inertia.ValidationErrors{}
	applySettingsSection("general", map[string]string{
		"store_name":        "Renamed",
		"store_description": "A shop",
		"store_email":       "",
		"store_phone":       "",
	}, &updated, errs)

	if len(errs) != 0 {
		t.Fatalf("unexpected validation errors: %+v", errs)
	}
	if updated.StoreName != "Renamed" {
		t.Errorf("store name = %q, want Renamed", updated.StoreName)
	}
	if updated.TaxRate != 0.15 {
		t.Errorf("tax rate = %v, want it untouched at 0.15", updated.TaxRate)
	}
	if updated.Currency != "EUR" {
		t.Errorf("currency = %q, want it untouched at EUR", updated.Currency)
	}
	if updated.ProductsPerPage != 24 {
		t.Errorf("products per page = %d, want it untouched at 24", updated.ProductsPerPage)
	}
}

func TestApplySectionRejectsBadInput(t *testing.T) {
	cases := []struct {
		name    string
		section string
		fields  map[string]string
		wantKey string
	}{
		{"blank store name", "general", map[string]string{"store_name": "  "}, "store_name"},
		{"malformed email", "general", map[string]string{"store_name": "Shop", "store_email": "not-an-address"}, "store_email"},
		{"unsupported currency", "localization", map[string]string{"currency": "XYZ"}, "currency"},
		{"page size of zero", "catalog", map[string]string{"products_per_page": "0", "default_low_stock_threshold": "0"}, "products_per_page"},
		{"page size beyond the cap", "catalog", map[string]string{"products_per_page": "500", "default_low_stock_threshold": "0"}, "products_per_page"},
		{"negative threshold", "catalog", map[string]string{"products_per_page": "12", "default_low_stock_threshold": "-1"}, "default_low_stock_threshold"},
		{"tax above 100%", "checkout", map[string]string{"tax_rate_percent": "101", "shipping_cost": "0", "free_shipping_threshold": "0"}, "tax_rate_percent"},
		{"negative shipping", "checkout", map[string]string{"tax_rate_percent": "8", "shipping_cost": "-5", "free_shipping_threshold": "0"}, "shipping_cost"},
		{"non-numeric tax", "checkout", map[string]string{"tax_rate_percent": "eight", "shipping_cost": "0", "free_shipping_threshold": "0"}, "tax_rate_percent"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			updated := service.DefaultStoreSettings()
			errs := inertia.ValidationErrors{}

			applySettingsSection(tc.section, tc.fields, &updated, errs)

			if _, ok := errs[tc.wantKey]; !ok {
				t.Errorf("expected a validation error on %q, got %+v", tc.wantKey, errs)
			}
		})
	}
}

// The percentage the form posts becomes the fraction the checkout reads.
// Conflating the two would misprice every order by a factor of a hundred.
func TestCheckoutSectionStoresTaxAsFraction(t *testing.T) {
	updated := service.DefaultStoreSettings()
	errs := inertia.ValidationErrors{}

	applySettingsSection("checkout", map[string]string{
		"tax_rate_percent":        "8.25",
		"shipping_cost":           "4.99",
		"free_shipping_threshold": "75",
	}, &updated, errs)

	if len(errs) != 0 {
		t.Fatalf("unexpected validation errors: %+v", errs)
	}
	if updated.TaxRate != 0.0825 {
		t.Errorf("tax rate = %v, want 0.0825 (8.25%% as a fraction)", updated.TaxRate)
	}
	if updated.ShippingCost != 4.99 {
		t.Errorf("shipping cost = %v, want 4.99", updated.ShippingCost)
	}
	if updated.FreeShippingThreshold != 75 {
		t.Errorf("free shipping threshold = %v, want 75", updated.FreeShippingThreshold)
	}
}

// The System section has no writable fields. applySettingsSection is the only
// thing that mutates the configuration, so it must do nothing for "system"
// even if a request somehow reaches it.
func TestSystemSectionWritesNothing(t *testing.T) {
	current := service.DefaultStoreSettings()
	updated := current
	errs := inertia.ValidationErrors{}

	applySettingsSection("system", map[string]string{
		"store_name":    "Injected",
		"currency":      "XYZ",
		"session_state": "configured",
	}, &updated, errs)

	if changes := current.Diff(updated); len(changes) != 0 {
		t.Errorf("system section mutated the configuration: %+v", changes)
	}
}

// Every section in the navigation must be one applySettingsSection knows how to
// handle, or a page would render a form whose Save silently does nothing.
func TestEveryEditableSectionIsApplied(t *testing.T) {
	for _, section := range settingsSections {
		if !section.Editable {
			continue
		}

		t.Run(section.Key, func(t *testing.T) {
			// Valid input for every field this section owns, so a section that
			// applySettingsSection does not handle shows up as "nothing
			// changed" rather than as a validation error.
			fields := map[string]string{
				"store_name":                  "Changed",
				"store_description":           "Changed",
				"store_email":                 "shop@example.com",
				"store_phone":                 "+1 555 0100",
				"currency":                    "GBP",
				"products_per_page":           "24",
				"default_product_active":      "false",
				"default_track_inventory":     "false",
				"default_allow_backorders":    "true",
				"default_low_stock_threshold": "5",
				"tax_rate_percent":            "20",
				"shipping_cost":               "1.50",
				"free_shipping_threshold":     "30",
			}

			current := service.DefaultStoreSettings()
			updated := current
			errs := inertia.ValidationErrors{}

			applySettingsSection(section.Key, fields, &updated, errs)

			if len(errs) != 0 {
				t.Fatalf("valid input produced errors: %+v", errs)
			}
			if changes := current.Diff(updated); len(changes) == 0 {
				t.Errorf("section %q is in the navigation but applySettingsSection ignores it", section.Key)
			}
		})
	}
}

// The section list drives the sidebar, the index cards and the search index, so
// a duplicate or empty key would quietly break navigation.
func TestSettingsSectionsAreWellFormed(t *testing.T) {
	seen := map[string]bool{}

	for _, section := range settingsSections {
		if section.Key == "" || section.Label == "" || section.Description == "" {
			t.Errorf("section %+v is missing a key, label or description", section)
		}
		if seen[section.Key] {
			t.Errorf("duplicate section key %q", section.Key)
		}
		seen[section.Key] = true

		if section.Editable && len(section.Fields) == 0 {
			t.Errorf("editable section %q owns no fields, so its audit trail would always be empty", section.Key)
		}
		if !section.Editable && len(section.Fields) != 0 {
			t.Errorf("read-only section %q claims fields it cannot change", section.Key)
		}
	}
}
