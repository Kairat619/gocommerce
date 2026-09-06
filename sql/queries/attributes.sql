-- name: ListAttributes :many
SELECT * FROM attributes
ORDER BY sort_order ASC, name ASC;

-- name: GetAttributeByID :one
SELECT * FROM attributes WHERE id = $1;

-- name: GetAttributeByCode :one
SELECT * FROM attributes WHERE code = $1;

-- name: CreateAttribute :one
INSERT INTO attributes (code, name, type, is_required, is_variant, sort_order)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: ListAttributeOptions :many
SELECT * FROM attribute_options
ORDER BY sort_order ASC, value ASC;

-- name: ListOptionsByAttribute :many
SELECT * FROM attribute_options
WHERE attribute_id = $1
ORDER BY sort_order ASC, value ASC;

-- name: CreateAttributeOption :one
INSERT INTO attribute_options (attribute_id, value, sort_order)
VALUES ($1, $2, $3)
ON CONFLICT (attribute_id, value) DO UPDATE SET value = EXCLUDED.value
RETURNING *;

-- name: ListProductAttributes :many
SELECT pa.*, a.code AS attribute_code, a.name AS attribute_name, a.type AS attribute_type, o.value AS option_value
FROM product_attributes pa
JOIN attributes a ON a.id = pa.attribute_id
LEFT JOIN attribute_options o ON o.id = pa.option_id
WHERE pa.product_id = $1
ORDER BY pa.sort_order ASC, a.name ASC;

-- name: CreateProductAttribute :one
INSERT INTO product_attributes (product_id, attribute_id, option_id, value, sort_order)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: DeleteProductAttributesByProductID :exec
DELETE FROM product_attributes WHERE product_id = $1;

-- ---------------------------------------------------------------------------
-- Admin attribute management
--
-- Everything below backs the admin Attributes screens. The queries above are
-- older and still serve the product form's inline creator; they are left alone.
-- ---------------------------------------------------------------------------

-- name: ListAttributesWithUsage :many
-- Admin index. Both counts are derived rather than stored, so neither can drift:
-- `option_count` is how many values the attribute offers, `product_count` how
-- many distinct products currently carry it.
SELECT a.*,
       (SELECT COUNT(*) FROM attribute_options o WHERE o.attribute_id = a.id)::bigint AS option_count,
       (SELECT COUNT(DISTINCT pa.product_id) FROM product_attributes pa WHERE pa.attribute_id = a.id)::bigint AS product_count
FROM attributes a
ORDER BY a.sort_order ASC, a.name ASC;

-- name: UpdateAttribute :one
-- `type` is deliberately absent. A stored product_attributes row was written to
-- suit the attribute's type (option_id for select/multiselect, value for the
-- rest), so changing type on an attribute in use would silently invalidate it.
-- The handler allows a type change only while product_count is 0, and does it
-- through UpdateAttributeType below.
UPDATE attributes
SET code = $2, name = $3, is_required = $4, is_variant = $5, sort_order = $6
WHERE id = $1
RETURNING *;

-- name: UpdateAttributeType :exec
-- Only ever called for an attribute no product references yet.
UPDATE attributes SET type = $2 WHERE id = $1;

-- name: DeleteAttribute :exec
-- product_attributes.attribute_id is ON DELETE CASCADE, so this would take the
-- product data with it. The handler refuses while the attribute is in use.
DELETE FROM attributes WHERE id = $1;

-- name: CountAttributesWithCode :one
SELECT COUNT(*) FROM attributes
WHERE code = $1
  AND (sqlc.narg('exclude_id')::uuid IS NULL OR id <> sqlc.narg('exclude_id')::uuid);

-- name: CountAttributesWithName :one
SELECT COUNT(*) FROM attributes
WHERE lower(name) = lower(sqlc.arg('name')::text)
  AND (sqlc.narg('exclude_id')::uuid IS NULL OR id <> sqlc.narg('exclude_id')::uuid);

-- name: CountProductsUsingAttribute :one
SELECT COUNT(DISTINCT product_id) FROM product_attributes WHERE attribute_id = $1;

-- ---------------------------------------------------------------------------
-- Values
--
-- Values are diffed by id, never cleared and re-inserted:
-- product_attributes.option_id is ON DELETE SET NULL, so dropping and recreating
-- an option would silently blank the value on every product that carries it.
-- ---------------------------------------------------------------------------

-- name: ListOptionUsage :many
-- Per-value product counts, so the form can warn before removing a value that
-- products already reference.
SELECT o.id AS option_id,
       COUNT(DISTINCT pa.product_id)::bigint AS product_count
FROM attribute_options o
LEFT JOIN product_attributes pa ON pa.option_id = o.id
WHERE o.attribute_id = $1
GROUP BY o.id;

-- name: InsertAttributeOption :one
-- Distinct from CreateAttributeOption above, which the product form's JSON
-- endpoint still uses and which does not carry a caller-chosen sort order.
INSERT INTO attribute_options (attribute_id, value, sort_order)
VALUES ($1, $2, $3)
RETURNING *;

-- name: UpdateAttributeOption :exec
-- Renaming a value in place keeps every product_attributes.option_id pointing at
-- it, so relabelling "Navy" to "Navy Blue" never touches product data.
UPDATE attribute_options SET value = $2, sort_order = $3 WHERE id = $1;

-- name: DeleteAttributeOption :exec
DELETE FROM attribute_options WHERE id = $1;

-- name: CountProductsUsingOption :one
SELECT COUNT(DISTINCT product_id) FROM product_attributes WHERE option_id = $1;
