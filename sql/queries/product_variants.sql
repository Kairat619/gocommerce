-- name: GetProductVariantByID :one
SELECT * FROM product_variants WHERE id = $1;

-- name: CreateProductVariant :one
INSERT INTO product_variants (product_id, name, sku, price, stock_quantity, is_active)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdateProductVariant :one
UPDATE product_variants
SET name = $2, sku = $3, price = $4, stock_quantity = $5, is_active = $6
WHERE id = $1
RETURNING *;

-- name: DeleteProductVariant :exec
DELETE FROM product_variants WHERE id = $1;

-- name: ListProductVariants :many
SELECT * FROM product_variants
WHERE product_id = $1
ORDER BY created_at ASC;

-- name: ListActiveProductVariants :many
SELECT * FROM product_variants
WHERE product_id = $1 AND is_active = true
ORDER BY created_at ASC;

-- name: UpdateVariantStock :exec
UPDATE product_variants SET stock_quantity = $2 WHERE id = $1;

-- name: GetVariantBySKU :one
SELECT * FROM product_variants WHERE sku = $1;

-- name: DeleteVariantsByProductID :exec
DELETE FROM product_variants WHERE product_id = $1;
