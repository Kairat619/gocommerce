-- name: GetProductImageByID :one
SELECT * FROM product_images WHERE id = $1;

-- name: CreateProductImage :one
INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: UpdateProductImage :one
UPDATE product_images
SET url = $2, alt_text = $3, sort_order = $4, is_primary = $5
WHERE id = $1
RETURNING *;

-- name: DeleteProductImage :exec
DELETE FROM product_images WHERE id = $1;

-- name: ListProductImages :many
SELECT * FROM product_images
WHERE product_id = $1
ORDER BY sort_order ASC, created_at ASC;

-- name: GetPrimaryProductImage :one
SELECT * FROM product_images
WHERE product_id = $1 AND is_primary = true
LIMIT 1;

-- name: SetPrimaryProductImage :exec
UPDATE product_images SET is_primary = false WHERE product_id = $1;
UPDATE product_images SET is_primary = true WHERE id = $2;

-- name: DeleteProductImagesByProductID :exec
DELETE FROM product_images WHERE product_id = $1;
