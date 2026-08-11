-- name: GetCategoryByID :one
SELECT * FROM categories WHERE id = $1;

-- name: GetCategoryBySlug :one
SELECT * FROM categories WHERE slug = $1;

-- name: CreateCategory :one
INSERT INTO categories (parent_id, name, slug, description, image_url, sort_order, is_active)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: UpdateCategory :one
UPDATE categories
SET parent_id = $2, name = $3, slug = $4, description = $5, image_url = $6, sort_order = $7, is_active = $8
WHERE id = $1
RETURNING *;

-- name: DeleteCategory :exec
DELETE FROM categories WHERE id = $1;

-- name: ListCategories :many
SELECT * FROM categories
ORDER BY sort_order ASC, name ASC;

-- name: ListActiveCategories :many
SELECT c.*, COUNT(p.id)::bigint AS product_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id AND p.is_active = true
WHERE c.is_active = true
GROUP BY c.id
ORDER BY c.sort_order ASC, c.name ASC;

-- name: ListRootCategories :many
SELECT c.*, COUNT(p.id)::bigint AS product_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id AND p.is_active = true
WHERE c.parent_id IS NULL AND c.is_active = true
GROUP BY c.id
ORDER BY c.sort_order ASC, c.name ASC;

-- name: ListSubcategories :many
SELECT c.*, COUNT(p.id)::bigint AS product_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id AND p.is_active = true
WHERE c.parent_id = $1 AND c.is_active = true
GROUP BY c.id
ORDER BY c.sort_order ASC, c.name ASC;

-- name: CountAllCategories :one
SELECT COUNT(*) FROM categories;

-- name: GetCategoryByParentID :many
SELECT * FROM categories WHERE parent_id = $1;
