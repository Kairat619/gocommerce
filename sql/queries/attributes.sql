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
