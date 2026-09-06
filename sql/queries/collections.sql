-- name: ListCollections :many
-- Admin index. product_count comes from the join table rather than a stored
-- counter so it cannot drift.
SELECT c.*, COUNT(cp.product_id)::bigint AS product_count
FROM collections c
LEFT JOIN collection_products cp ON cp.collection_id = c.id
GROUP BY c.id
ORDER BY c.sort_order ASC, c.name ASC;

-- name: GetCollectionByID :one
SELECT * FROM collections WHERE id = $1;

-- name: GetCollectionBySlug :one
SELECT * FROM collections WHERE slug = $1;

-- name: CreateCollection :one
INSERT INTO collections (
    name, slug, description, image_url,
    is_active, is_featured, sort_order,
    meta_title, meta_description, meta_keywords
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: UpdateCollection :one
UPDATE collections
SET name = $2, slug = $3, description = $4, image_url = $5,
    is_active = $6, is_featured = $7, sort_order = $8,
    meta_title = $9, meta_description = $10, meta_keywords = $11,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteCollection :exec
-- collection_products is ON DELETE CASCADE, so membership goes with it. The
-- products themselves are untouched.
DELETE FROM collections WHERE id = $1;

-- name: CountCollectionsWithSlug :one
-- Uniqueness check for the admin form. sqlc.narg('exclude_id') is the
-- collection being edited, so saving it unchanged is not a conflict.
SELECT COUNT(*) FROM collections
WHERE slug = $1
  AND (sqlc.narg('exclude_id')::uuid IS NULL OR id <> sqlc.narg('exclude_id')::uuid);

-- name: CountCollectionsWithName :one
-- Collections have no parent, so a name is compared against every other
-- collection. Case-insensitive, like the category sibling check.
SELECT COUNT(*) FROM collections
WHERE lower(name) = lower(sqlc.arg('name')::text)
  AND (sqlc.narg('exclude_id')::uuid IS NULL OR id <> sqlc.narg('exclude_id')::uuid);

-- name: CountActiveCollections :one
SELECT COUNT(*) FROM collections WHERE is_active = true;

-- ---------------------------------------------------------------------------
-- Membership
-- ---------------------------------------------------------------------------

-- name: ListCollectionProducts :many
-- The admin editor's list: every member in curated order, including products
-- that are currently inactive so the merchant can see and fix them.
SELECT p.*, cp.position, c.name AS category_name, c.slug AS category_slug
FROM collection_products cp
JOIN products p ON p.id = cp.product_id
JOIN categories c ON c.id = p.category_id
WHERE cp.collection_id = $1
ORDER BY cp.position ASC, p.name ASC;

-- name: AddProductToCollection :exec
-- Idempotent: re-adding a product already in the collection just re-seats it
-- rather than failing on the primary key.
INSERT INTO collection_products (collection_id, product_id, position)
VALUES ($1, $2, $3)
ON CONFLICT (collection_id, product_id) DO UPDATE SET position = EXCLUDED.position;

-- name: ClearCollectionProducts :exec
DELETE FROM collection_products WHERE collection_id = $1;

-- name: CountProductsInCollection :one
SELECT COUNT(*) FROM collection_products WHERE collection_id = $1;

-- name: CountValidProductIDs :one
-- How many of the posted product ids actually exist. The form refuses to save
-- a membership list containing a product that has since been deleted.
SELECT COUNT(*) FROM products WHERE id = ANY(sqlc.arg('ids')::uuid[]);

-- ---------------------------------------------------------------------------
-- Admin product picker
-- ---------------------------------------------------------------------------

-- name: SearchProductsForPicker :many
-- Backs the collection product selector. Paginated and searched server-side so
-- the browser never loads the whole catalogue. Matches name or SKU.
SELECT p.id, p.name, p.slug, p.sku, p.price, p.image_url, p.is_active,
       p.stock_quantity, c.name AS category_name
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE (sqlc.narg('keyword')::text IS NULL
       OR p.name ILIKE '%' || sqlc.narg('keyword')::text || '%'
       OR p.sku ILIKE '%' || sqlc.narg('keyword')::text || '%')
ORDER BY p.name ASC
LIMIT $1 OFFSET $2;

-- name: CountProductsForPicker :one
SELECT COUNT(*)
FROM products p
WHERE (sqlc.narg('keyword')::text IS NULL
       OR p.name ILIKE '%' || sqlc.narg('keyword')::text || '%'
       OR p.sku ILIKE '%' || sqlc.narg('keyword')::text || '%');

-- name: ListProductsByIDs :many
-- Rehydrates a staged selection (create form) or a posted list after a
-- validation bounce, without a query per product.
SELECT p.id, p.name, p.slug, p.sku, p.price, p.image_url, p.is_active,
       p.stock_quantity, c.name AS category_name
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.id = ANY(sqlc.arg('ids')::uuid[]);

-- ---------------------------------------------------------------------------
-- Storefront
-- ---------------------------------------------------------------------------

-- name: ListActiveCollections :many
-- /collections. Only counts products a shopper can actually buy into.
SELECT c.*, COUNT(cp.product_id)::bigint AS product_count
FROM collections c
LEFT JOIN collection_products cp ON cp.collection_id = c.id
LEFT JOIN products p ON p.id = cp.product_id AND p.is_active = true
WHERE c.is_active = true
GROUP BY c.id
ORDER BY c.sort_order ASC, c.name ASC;

-- name: ListFeaturedCollections :many
SELECT c.*, COUNT(cp.product_id)::bigint AS product_count
FROM collections c
LEFT JOIN collection_products cp ON cp.collection_id = c.id
WHERE c.is_active = true AND c.is_featured = true
GROUP BY c.id
ORDER BY c.sort_order ASC, c.name ASC;

-- name: ListActiveCollectionProducts :many
-- /collections/{slug}. Curated order is the storefront order; inactive
-- products drop out.
SELECT p.*, c.name AS category_name, c.slug AS category_slug
FROM collection_products cp
JOIN products p ON p.id = cp.product_id
JOIN categories c ON c.id = p.category_id
WHERE cp.collection_id = $1 AND p.is_active = true
ORDER BY cp.position ASC, p.name ASC
LIMIT $2 OFFSET $3;

-- name: CountActiveCollectionProducts :one
SELECT COUNT(*)
FROM collection_products cp
JOIN products p ON p.id = cp.product_id
WHERE cp.collection_id = $1 AND p.is_active = true;
