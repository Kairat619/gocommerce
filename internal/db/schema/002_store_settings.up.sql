-- GoCommerce Schema V2: Store settings (admin-configurable tax & shipping)

-- -------------------------------------------
-- Store Settings (single-row singleton)
-- -------------------------------------------
CREATE TABLE store_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    tax_rate DECIMAL(6, 4) NOT NULL DEFAULT 0.08 CHECK (tax_rate >= 0),
    shipping_cost DECIMAL(10, 2) NOT NULL DEFAULT 9.99 CHECK (shipping_cost >= 0),
    free_shipping_threshold DECIMAL(10, 2) NOT NULL DEFAULT 100.00 CHECK (free_shipping_threshold >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the singleton row with current defaults.
INSERT INTO store_settings (id, tax_rate, shipping_cost, free_shipping_threshold)
VALUES (1, 0.08, 9.99, 100.00)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
    CREATE TRIGGER trg_store_settings_updated_at BEFORE UPDATE ON store_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN null;
END $$;
