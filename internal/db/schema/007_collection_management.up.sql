-- Collection management.
--
-- A collection is a *curated merchandising group*: "Summer Essentials",
-- "Staff Picks", "Gifts under 10 000 ₸". It is deliberately not a second
-- category system.
--
--   categories   structural catalogue placement. One per product
--                (products.category_id, NOT NULL, ON DELETE RESTRICT), a tree
--                with parent_id, and the thing /categories/{slug} browses.
--
--   collections  merchandising. Many per product, many products per
--                collection, hand-ordered by the merchant, and free to overlap
--                with each other and with any category.
--
-- Nothing in this migration touches an existing table, so every product,
-- category, product-category link and storefront URL keeps working exactly as
-- before. A store that never creates a collection is unaffected.
--
-- Scope note, in the spirit of 006: membership is *manual only*. There is no
-- rules/conditions table, because there is no engine to evaluate one — the
-- admin form must never offer a control the backend would ignore.

CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name VARCHAR(255) NOT NULL,

    -- Public address: /collections/{slug}. Globally unique, unlike a category
    -- name which only has to be unique among its siblings — a collection has no
    -- parent to be a sibling within.
    slug VARCHAR(255) NOT NULL UNIQUE,

    -- Customer-facing. Stored as the sanitised HTML the shared rich-text editor
    -- produces, exactly like categories.description.
    description TEXT,

    image_url VARCHAR(512),

    -- Reachable at /collections/{slug} and listed on /collections.
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Promoted on the storefront (home page rails, navigation). A featured but
    -- inactive collection stays hidden: is_active is the authority.
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,

    -- Orders the collections themselves on /collections. Lower first, ties
    -- broken by name, matching the categories convention.
    sort_order INTEGER NOT NULL DEFAULT 0,

    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords VARCHAR(500),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_collections_slug ON collections(slug);
CREATE INDEX idx_collections_is_active ON collections(is_active);
CREATE INDEX idx_collections_is_featured ON collections(is_featured);
CREATE INDEX idx_collections_sort_order ON collections(sort_order);

-- ---------------------------------------------------------------------------
-- Membership
-- ---------------------------------------------------------------------------

CREATE TABLE collection_products (
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,

    -- CASCADE, not RESTRICT: unlike a category, collection membership is not
    -- structural. Deleting a product should drop it from its collections, never
    -- refuse the delete.
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    -- The merchant's curated order within this collection. Lower first; ties
    -- broken by the product name so the storefront order is always total.
    position INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One row per product per collection. Adding a product twice is a no-op
    -- rather than a duplicate listing.
    PRIMARY KEY (collection_id, product_id)
);

CREATE INDEX idx_collection_products_product ON collection_products(product_id);
CREATE INDEX idx_collection_products_order ON collection_products(collection_id, position);
