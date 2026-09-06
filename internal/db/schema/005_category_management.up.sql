-- GoCommerce Schema V5: Category management (search engine fields)
-- Additive only. Existing categories, product-category links and storefront
-- category URLs are untouched; every new column is nullable.

ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255),
    ADD COLUMN IF NOT EXISTS meta_description TEXT,
    ADD COLUMN IF NOT EXISTS meta_keywords VARCHAR(500);
