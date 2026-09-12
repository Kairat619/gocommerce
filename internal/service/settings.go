package service

import (
	"context"
	"fmt"
	"math"
	"math/big"
	"strconv"
	"strings"
	"sync"

	"github.com/jackc/pgx/v5/pgtype"

	"gocommerce/internal/db"
)

// ---------------------------------------------------------------------------
// Store configuration
//
// One struct, one row, one source of truth. Everything the administrator can
// configure lives here and is read from here — the storefront's brand name, the
// currency every price is rendered in, the catalogue page size, the defaults a
// new product starts with, and the tax and shipping the checkout applies.
//
// Before this, most of those were constants in two places at once: the currency
// was "USD" in internal/handler/admin_products.go AND "USD" in
// frontend/src/lib/money.js, which is a split that can only ever be discovered
// by it going wrong.
//
// WHAT IS NOT HERE, AND MUST NOT BE PUT HERE
//
// Secrets. SESSION_KEY, the R2 credentials and DATABASE_URL are read from the
// environment by internal/config and stay there. They are not settings; they
// are deployment configuration, they are not editable by an administrator, and
// moving them into this table to make the settings page look fuller would
// publish them to anyone who can reach the admin.
// ---------------------------------------------------------------------------

// rateToNumeric converts a tax rate to a pgtype.Numeric with 4-decimal
// precision (the tax_rate column is DECIMAL(6,4)), e.g. 0.0825 -> 8.25%.
func rateToNumeric(f float64) pgtype.Numeric {
	units := int64(math.Round(f * 10000))
	return pgtype.Numeric{
		Int:   big.NewInt(units),
		Exp:   -4,
		Valid: true,
	}
}

// StoreSettings is the whole store configuration.
type StoreSettings struct {
	// Checkout. Unchanged in meaning and in use since they were introduced —
	// service/order.go applies them to every order.
	TaxRate               float64
	ShippingCost          float64
	FreeShippingThreshold float64

	// Identity, shown to shoppers.
	StoreName        string
	StoreDescription string
	StoreEmail       string
	StorePhone       string

	// Display currency for every amount in the application.
	Currency string

	// Storefront catalogue page size.
	ProductsPerPage int

	// The values a newly created product starts with. They seed the create
	// form; they never touch an existing product.
	DefaultProductActive     bool
	DefaultTrackInventory    bool
	DefaultAllowBackorders   bool
	DefaultLowStockThreshold int
}

// DefaultStoreSettings returns the built-in defaults used when no settings row
// exists yet, or when loading fails.
//
// These reproduce the constants the application shipped with before the
// configuration existed, so a database that is unreachable degrades to the
// behaviour that was previously compiled in rather than to zero values — a
// StoreName of "" and a Currency of "" would render an unbranded storefront
// with unformattable prices.
func DefaultStoreSettings() StoreSettings {
	return StoreSettings{
		TaxRate:               TaxRate,
		ShippingCost:          ShippingCost,
		FreeShippingThreshold: FreeShippingThreshold,

		// "ShopNest" is what the storefront has always displayed (it was
		// BRAND_NAME in frontend/src/lib/brand.js). The unused appName prop
		// said "GoCommerce"; adopting that here would rebrand the shop.
		StoreName: "ShopNest",

		Currency:        "USD",
		ProductsPerPage: 12,

		DefaultProductActive:     true,
		DefaultTrackInventory:    true,
		DefaultAllowBackorders:   false,
		DefaultLowStockThreshold: 0,
	}
}

type SettingsService struct {
	queries *db.Queries

	// The configuration is read on essentially every request — the shared
	// props carry the store name and currency to every page — and written by
	// one administrator occasionally. Caching the row turns that read into a
	// map lookup.
	//
	// The cache is invalidated by Update, which is the only writer. It is
	// per-process, so a multi-replica deployment sees a change on the replica
	// that served the save immediately and on the others at their next miss —
	// which is why the settings UI says a change reaches the storefront on its
	// next page load rather than claiming it is instantaneous everywhere.
	mu     sync.RWMutex
	cached *StoreSettings
}

func NewSettingsService(queries *db.Queries) *SettingsService {
	return &SettingsService{queries: queries}
}

// Get loads the store settings, falling back to defaults on any error.
func (s *SettingsService) Get(ctx context.Context) StoreSettings {
	s.mu.RLock()
	cached := s.cached
	s.mu.RUnlock()
	if cached != nil {
		return *cached
	}

	row, err := s.queries.GetStoreSettings(ctx)
	if err != nil {
		// Deliberately not cached: a transient database error must not pin the
		// defaults in memory for the life of the process.
		return DefaultStoreSettings()
	}

	settings := fromRow(row)

	s.mu.Lock()
	s.cached = &settings
	s.mu.Unlock()

	return settings
}

// Update persists the whole configuration and returns the stored values.
//
// The caller loads the current settings, applies one section's fields and
// passes the result back, so saving one page can never blank another page's
// values. See the comment on UpsertStoreSettings.
func (s *SettingsService) Update(ctx context.Context, in StoreSettings) (StoreSettings, error) {
	row, err := s.queries.UpsertStoreSettings(ctx, db.UpsertStoreSettingsParams{
		TaxRate:               rateToNumeric(in.TaxRate),
		ShippingCost:          floatToNumeric(in.ShippingCost),
		FreeShippingThreshold: floatToNumeric(in.FreeShippingThreshold),

		StoreName:        strings.TrimSpace(in.StoreName),
		StoreDescription: strings.TrimSpace(in.StoreDescription),
		StoreEmail:       strings.TrimSpace(in.StoreEmail),
		StorePhone:       strings.TrimSpace(in.StorePhone),

		Currency:        strings.ToUpper(strings.TrimSpace(in.Currency)),
		ProductsPerPage: int32(in.ProductsPerPage),

		DefaultProductActive:     in.DefaultProductActive,
		DefaultTrackInventory:    in.DefaultTrackInventory,
		DefaultAllowBackorders:   in.DefaultAllowBackorders,
		DefaultLowStockThreshold: int32(in.DefaultLowStockThreshold),
	})
	if err != nil {
		return StoreSettings{}, err
	}

	out := fromRow(row)

	s.mu.Lock()
	s.cached = &out
	s.mu.Unlock()

	return out, nil
}

// fromRow maps the stored row onto the struct, falling back to the built-in
// default for any value the database cannot produce.
func fromRow(row db.StoreSetting) StoreSettings {
	settings := DefaultStoreSettings()

	if v, err := row.TaxRate.Float64Value(); err == nil && v.Valid {
		settings.TaxRate = v.Float64
	}
	if v, err := row.ShippingCost.Float64Value(); err == nil && v.Valid {
		settings.ShippingCost = v.Float64
	}
	if v, err := row.FreeShippingThreshold.Float64Value(); err == nil && v.Valid {
		settings.FreeShippingThreshold = v.Float64
	}

	// An empty store name would render an unbranded storefront, so the default
	// stands in. The other text fields are genuinely optional — an empty
	// contact phone means the store has not published one, which is a real
	// state and not a missing value.
	if name := strings.TrimSpace(row.StoreName); name != "" {
		settings.StoreName = name
	}
	settings.StoreDescription = row.StoreDescription
	settings.StoreEmail = row.StoreEmail
	settings.StorePhone = row.StorePhone

	if currency := strings.TrimSpace(row.Currency); len(currency) == 3 {
		settings.Currency = strings.ToUpper(currency)
	}
	if row.ProductsPerPage > 0 {
		settings.ProductsPerPage = int(row.ProductsPerPage)
	}

	settings.DefaultProductActive = row.DefaultProductActive
	settings.DefaultTrackInventory = row.DefaultTrackInventory
	settings.DefaultAllowBackorders = row.DefaultAllowBackorders
	if row.DefaultLowStockThreshold >= 0 {
		settings.DefaultLowStockThreshold = int(row.DefaultLowStockThreshold)
	}

	return settings
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

// SettingChange is one field that moved, rendered for the audit trail.
type SettingChange struct {
	Key      string
	Previous string
	New      string
}

// Diff reports which settings differ between two configurations.
//
// The keys are the same snake_case names the admin form posts and the page
// props carry, so an audit line traces back to a field without a lookup table.
//
// Money and rates are rendered at the precision they are stored at, not at
// float precision: an audit line reading "0.08000000000000002" is not a record
// anybody can act on.
func (before StoreSettings) Diff(after StoreSettings) []SettingChange {
	var changes []SettingChange

	add := func(key, prev, next string) {
		if prev != next {
			changes = append(changes, SettingChange{Key: key, Previous: prev, New: next})
		}
	}

	add("tax_rate_percent", formatRate(before.TaxRate), formatRate(after.TaxRate))
	add("shipping_cost", formatAmount(before.ShippingCost), formatAmount(after.ShippingCost))
	add("free_shipping_threshold", formatAmount(before.FreeShippingThreshold), formatAmount(after.FreeShippingThreshold))

	add("store_name", before.StoreName, after.StoreName)
	add("store_description", before.StoreDescription, after.StoreDescription)
	add("store_email", before.StoreEmail, after.StoreEmail)
	add("store_phone", before.StorePhone, after.StorePhone)

	add("currency", before.Currency, after.Currency)
	add("products_per_page", strconv.Itoa(before.ProductsPerPage), strconv.Itoa(after.ProductsPerPage))

	add("default_product_active", strconv.FormatBool(before.DefaultProductActive), strconv.FormatBool(after.DefaultProductActive))
	add("default_track_inventory", strconv.FormatBool(before.DefaultTrackInventory), strconv.FormatBool(after.DefaultTrackInventory))
	add("default_allow_backorders", strconv.FormatBool(before.DefaultAllowBackorders), strconv.FormatBool(after.DefaultAllowBackorders))
	add("default_low_stock_threshold", strconv.Itoa(before.DefaultLowStockThreshold), strconv.Itoa(after.DefaultLowStockThreshold))

	return changes
}

// formatRate renders a tax rate the way the form shows it — as a percentage,
// because "8" is what the administrator typed and 0.08 is only how it is
// stored.
func formatRate(rate float64) string {
	return strconv.FormatFloat(math.Round(rate*10000)/100, 'f', -1, 64)
}

func formatAmount(amount float64) string {
	return fmt.Sprintf("%.2f", amount)
}
