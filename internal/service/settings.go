package service

import (
	"context"
	"math"
	"math/big"

	"github.com/jackc/pgx/v5/pgtype"

	"gocommerce/internal/db"
)

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

// StoreSettings holds the admin-configurable checkout values as plain floats.
type StoreSettings struct {
	TaxRate               float64
	ShippingCost          float64
	FreeShippingThreshold float64
}

// DefaultStoreSettings returns the built-in defaults used when no settings row
// exists yet (or when loading fails).
func DefaultStoreSettings() StoreSettings {
	return StoreSettings{
		TaxRate:               TaxRate,
		ShippingCost:          ShippingCost,
		FreeShippingThreshold: FreeShippingThreshold,
	}
}

type SettingsService struct {
	queries *db.Queries
}

func NewSettingsService(queries *db.Queries) *SettingsService {
	return &SettingsService{queries: queries}
}

// Get loads the store settings, falling back to defaults on any error.
func (s *SettingsService) Get(ctx context.Context) StoreSettings {
	row, err := s.queries.GetStoreSettings(ctx)
	if err != nil {
		return DefaultStoreSettings()
	}

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
	return settings
}

// Update persists new store settings and returns the stored values.
func (s *SettingsService) Update(ctx context.Context, in StoreSettings) (StoreSettings, error) {
	row, err := s.queries.UpsertStoreSettings(ctx, db.UpsertStoreSettingsParams{
		TaxRate:               rateToNumeric(in.TaxRate),
		ShippingCost:          floatToNumeric(in.ShippingCost),
		FreeShippingThreshold: floatToNumeric(in.FreeShippingThreshold),
	})
	if err != nil {
		return StoreSettings{}, err
	}

	out := DefaultStoreSettings()
	if v, err := row.TaxRate.Float64Value(); err == nil && v.Valid {
		out.TaxRate = v.Float64
	}
	if v, err := row.ShippingCost.Float64Value(); err == nil && v.Valid {
		out.ShippingCost = v.Float64
	}
	if v, err := row.FreeShippingThreshold.Float64Value(); err == nil && v.Valid {
		out.FreeShippingThreshold = v.Float64
	}
	return out, nil
}
