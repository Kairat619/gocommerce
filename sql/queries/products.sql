-- name: GetProductByID :one
SELECT p.*, c.name AS category_name, c.slug AS category_slug
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.id = $1;

-- name: GetProductBySlug :one
SELECT p.*, c.name AS category_name, c.slug AS category_slug
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.slug = $1;

-- name: CreateProduct :one
INSERT INTO products (
    category_id, name, slug, description, short_description, price, compare_at_price, cost_price,
    sku, barcode, image_url, is_active, is_featured, stock_quantity, weight,
    meta_title, meta_description, meta_keywords,
    brand, tags, track_inventory, allow_backorders, low_stock_threshold,
    length, width, height, sort_order
)
VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8,
    $9, $10, $11, $12, $13, $14, $15,
    $16, $17, $18,
    $19, $20, $21, $22, $23,
    $24, $25, $26, $27
)
RETURNING *;

-- name: UpdateProduct :one
UPDATE products
SET category_id = $2,
    name = $3,
    slug = $4,
    description = $5,
    short_description = $6,
    price = $7,
    compare_at_price = $8,
    cost_price = $9,
    sku = $10,
    barcode = $11,
    image_url = $12,
    is_active = $13,
    is_featured = $14,
    stock_quantity = $15,
    weight = $16,
    meta_title = $17,
    meta_description = $18,
    meta_keywords = $19,
    brand = $20,
    tags = $21,
    track_inventory = $22,
    allow_backorders = $23,
    low_stock_threshold = $24,
    length = $25,
    width = $26,
    height = $27,
    sort_order = $28
WHERE id = $1
RETURNING *;

-- name: DeleteProduct :exec
DELETE FROM products WHERE id = $1;

-- name: ListProducts :many
SELECT p.*, c.name AS category_name, c.slug AS category_slug
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.is_active = true
ORDER BY p.created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountActiveProducts :one
SELECT COUNT(*) FROM products WHERE is_active = true;

-- name: SearchProducts :many
SELECT p.*, c.name AS category_name, c.slug AS category_slug
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.is_active = true
  AND (p.name ILIKE '%' || $1 || '%' OR p.description ILIKE '%' || $1 || '%')
ORDER BY p.created_at DESC
LIMIT $2 OFFSET $3;

-- name: ListProductsByCategory :many
SELECT p.*, c.name AS category_name, c.slug AS category_slug
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.is_active = true AND c.slug = $1
ORDER BY p.created_at DESC
LIMIT $2 OFFSET $3;

-- name: ListFeaturedProducts :many
SELECT p.*, c.name AS category_name, c.slug AS category_slug
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.is_active = true AND p.is_featured = true
ORDER BY p.created_at DESC
LIMIT $1;

-- name: ListNewestProducts :many
SELECT p.*, c.name AS category_name, c.slug AS category_slug
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.is_active = true
ORDER BY p.created_at DESC
LIMIT $1;

-- name: ListAllProducts :many
SELECT p.*, c.name AS category_name, c.slug AS category_slug
FROM products p
JOIN categories c ON c.id = p.category_id
ORDER BY p.created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountAllProducts :one
SELECT COUNT(*) FROM products;

-- name: UpdateProductStock :exec
UPDATE products SET stock_quantity = $2 WHERE id = $1;

-- name: ListProductsByPriceRange :many
SELECT p.*, c.name AS category_name, c.slug AS category_slug
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.is_active = true
  AND p.price >= $1 AND p.price <= $2
ORDER BY p.price ASC
LIMIT $3 OFFSET $4;

-- name: CountProductsByCategory :one
SELECT COUNT(*) FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.is_active = true AND c.slug = $1;

-- name: CountSearchProducts :one
SELECT COUNT(*) FROM products p
WHERE p.is_active = true
  AND (p.name ILIKE '%' || $1 || '%' OR p.description ILIKE '%' || $1 || '%');

-- name: GetLowStockProducts :many
SELECT p.*, c.name AS category_name, c.slug AS category_slug
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.is_active = true AND p.stock_quantity <= $1
ORDER BY p.stock_quantity ASC
LIMIT $2;

-- name: GetProductBySKU :one
SELECT p.*, c.name AS category_name, c.slug AS category_slug
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.sku = $1;

-- name: GetProductByBarcode :one
SELECT p.*, c.name AS category_name, c.slug AS category_slug
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.barcode = $1;

-- name: FilterProducts :many
SELECT p.*, c.name AS category_name, c.slug AS category_slug
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.is_active = true
  AND (sqlc.narg('search')::text IS NULL
       OR p.name ILIKE '%' || sqlc.narg('search') || '%'
       OR p.description ILIKE '%' || sqlc.narg('search') || '%')
  AND (sqlc.narg('category')::text IS NULL OR c.slug = sqlc.narg('category'))
  AND (sqlc.narg('min_price')::numeric IS NULL OR p.price >= sqlc.narg('min_price'))
  AND (sqlc.narg('max_price')::numeric IS NULL OR p.price <= sqlc.narg('max_price'))
ORDER BY p.created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountFilterProducts :one
SELECT COUNT(*)
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.is_active = true
  AND (sqlc.narg('search')::text IS NULL
       OR p.name ILIKE '%' || sqlc.narg('search') || '%'
       OR p.description ILIKE '%' || sqlc.narg('search') || '%')
  AND (sqlc.narg('category')::text IS NULL OR c.slug = sqlc.narg('category'))
  AND (sqlc.narg('min_price')::numeric IS NULL OR p.price >= sqlc.narg('min_price'))
  AND (sqlc.narg('max_price')::numeric IS NULL OR p.price <= sqlc.narg('max_price'));

-- name: CountProductsWithSlug :one
SELECT COUNT(*) FROM products
WHERE slug = $1 AND (sqlc.narg('exclude_id')::uuid IS NULL OR id <> sqlc.narg('exclude_id'));

-- name: CountProductsWithSKU :one
SELECT COUNT(*) FROM products
WHERE sku = $1 AND (sqlc.narg('exclude_id')::uuid IS NULL OR id <> sqlc.narg('exclude_id'));

-- name: ListProductBrands :many
SELECT DISTINCT brand FROM products
WHERE brand IS NOT NULL AND brand <> ''
ORDER BY brand ASC;
