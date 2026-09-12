-- Additive migration, so the rollback is a clean subtraction: the three
-- original store_settings columns (tax_rate, shipping_cost,
-- free_shipping_threshold) and every row's values in them are untouched
-- throughout. Dropping the new columns returns the configuration to the
-- constants compiled into the application.

DROP TABLE IF EXISTS settings_activity;

ALTER TABLE store_settings
    DROP COLUMN IF EXISTS default_low_stock_threshold,
    DROP COLUMN IF EXISTS default_allow_backorders,
    DROP COLUMN IF EXISTS default_track_inventory,
    DROP COLUMN IF EXISTS default_product_active,
    DROP COLUMN IF EXISTS products_per_page,
    DROP COLUMN IF EXISTS currency,
    DROP COLUMN IF EXISTS store_phone,
    DROP COLUMN IF EXISTS store_email,
    DROP COLUMN IF EXISTS store_description,
    DROP COLUMN IF EXISTS store_name;
