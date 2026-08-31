-- GoCommerce Schema V4: Product management (attributes, richer product fields)
-- All changes are additive so existing products, orders and storefront queries
-- keep working unchanged.

-- -------------------------------------------
-- Products: merchandising, cost and inventory fields
-- -------------------------------------------
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS short_description VARCHAR(500),
    ADD COLUMN IF NOT EXISTS brand VARCHAR(255),
    ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10, 2) CHECK (cost_price >= 0),
    ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS allow_backorders BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 0 CHECK (low_stock_threshold >= 0),
    ADD COLUMN IF NOT EXISTS length DECIMAL(8, 2) CHECK (length >= 0),
    ADD COLUMN IF NOT EXISTS width DECIMAL(8, 2) CHECK (width >= 0),
    ADD COLUMN IF NOT EXISTS height DECIMAL(8, 2) CHECK (height >= 0),
    ADD COLUMN IF NOT EXISTS meta_keywords VARCHAR(500),
    ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products(sort_order);

-- -------------------------------------------
-- Product variants: per-variant identity and shipping data
-- -------------------------------------------
ALTER TABLE product_variants
    ADD COLUMN IF NOT EXISTS barcode VARCHAR(100),
    ADD COLUMN IF NOT EXISTS image_url VARCHAR(512),
    ADD COLUMN IF NOT EXISTS weight DECIMAL(8, 2) CHECK (weight >= 0),
    ADD COLUMN IF NOT EXISTS options JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- -------------------------------------------
-- Attributes
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'text'
        CHECK (type IN ('text', 'textarea', 'number', 'boolean', 'select', 'multiselect')),
    is_required BOOLEAN NOT NULL DEFAULT false,
    is_variant BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attributes_code ON attributes(code);

CREATE TABLE IF NOT EXISTS attribute_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attribute_id UUID NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (attribute_id, value)
);

CREATE INDEX IF NOT EXISTS idx_attribute_options_attribute ON attribute_options(attribute_id);

CREATE TABLE IF NOT EXISTS product_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    attribute_id UUID NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
    option_id UUID REFERENCES attribute_options(id) ON DELETE SET NULL,
    value TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_attributes_product ON product_attributes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_attributes_attribute ON product_attributes(attribute_id);

DO $$ BEGIN
    CREATE TRIGGER trg_attributes_updated_at BEFORE UPDATE ON attributes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- -------------------------------------------
-- Baseline attribute set so the Products form is usable out of the box
-- -------------------------------------------
INSERT INTO attributes (code, name, type, is_variant, sort_order) VALUES
    ('color', 'Color', 'select', true, 10),
    ('size', 'Size', 'select', true, 20),
    ('material', 'Material', 'select', true, 30),
    ('style', 'Style', 'select', false, 40)
ON CONFLICT (code) DO NOTHING;

INSERT INTO attribute_options (attribute_id, value, sort_order)
SELECT a.id, v.value, v.sort_order
FROM attributes a
JOIN (VALUES
    ('color', 'Black', 10), ('color', 'White', 20), ('color', 'Navy', 30),
    ('color', 'Beige', 40), ('color', 'Olive', 50),
    ('size', 'XS', 10), ('size', 'S', 20), ('size', 'M', 30),
    ('size', 'L', 40), ('size', 'XL', 50),
    ('material', 'Cotton', 10), ('material', 'Linen', 20), ('material', 'Wool', 30),
    ('material', 'Leather', 40),
    ('style', 'Classic', 10), ('style', 'Modern', 20), ('style', 'Minimal', 30)
) AS v(code, value, sort_order) ON v.code = a.code
ON CONFLICT (attribute_id, value) DO NOTHING;
