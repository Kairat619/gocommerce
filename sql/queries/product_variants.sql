-- name: GetProductVariantByID :one
SELECT * FROM product_variants WHERE id = $1;

-- name: CreateProductVariant :one
INSERT INTO product_variants (
    product_id, name, sku, barcode, price, stock_quantity, is_active,
    image_url, weight, options, sort_order
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING *;

-- name: UpdateProductVariant :one
UPDATE product_variants
SET name = $2,
    sku = $3,
    barcode = $4,
    price = $5,
    stock_quantity = $6,
    is_active = $7,
    image_url = $8,
    weight = $9,
    options = $10,
    sort_order = $11
WHERE id = $1
RETURNING *;

-- name: DeleteProductVariant :exec
DELETE FROM product_variants WHERE id = $1;

-- name: ListProductVariants :many
SELECT * FROM product_variants
WHERE product_id = $1
ORDER BY sort_order ASC, created_at ASC;

-- name: ListActiveProductVariants :many
SELECT * FROM product_variants
WHERE product_id = $1 AND is_active = true
ORDER BY sort_order ASC, created_at ASC;

-- name: UpdateVariantStock :exec
UPDATE product_variants SET stock_quantity = $2 WHERE id = $1;

-- name: GetVariantBySKU :one
SELECT * FROM product_variants WHERE sku = $1;

-- name: DeleteVariantsByProductID :exec
DELETE FROM product_variants WHERE product_id = $1;

-- name: DeleteVariantsNotIn :exec
DELETE FROM product_variants
WHERE product_id = $1 AND NOT (id = ANY(@keep_ids::uuid[]));
