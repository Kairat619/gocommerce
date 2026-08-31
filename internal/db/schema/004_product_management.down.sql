DROP TABLE IF EXISTS product_attributes;
DROP TABLE IF EXISTS attribute_options;
DROP TABLE IF EXISTS attributes;

ALTER TABLE product_variants
    DROP COLUMN IF EXISTS barcode,
    DROP COLUMN IF EXISTS image_url,
    DROP COLUMN IF EXISTS weight,
    DROP COLUMN IF EXISTS options,
    DROP COLUMN IF EXISTS sort_order;

ALTER TABLE products
    DROP COLUMN IF EXISTS short_description,
    DROP COLUMN IF EXISTS brand,
    DROP COLUMN IF EXISTS tags,
    DROP COLUMN IF EXISTS cost_price,
    DROP COLUMN IF EXISTS track_inventory,
    DROP COLUMN IF EXISTS allow_backorders,
    DROP COLUMN IF EXISTS low_stock_threshold,
    DROP COLUMN IF EXISTS length,
    DROP COLUMN IF EXISTS width,
    DROP COLUMN IF EXISTS height,
    DROP COLUMN IF EXISTS meta_keywords,
    DROP COLUMN IF EXISTS sort_order;
