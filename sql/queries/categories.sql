-- name: GetCategoryByID :one
SELECT * FROM categories WHERE id = $1;

-- name: GetCategoryBySlug :one
SELECT * FROM categories WHERE slug = $1;

-- name: CreateCategory :one
INSERT INTO categories (
    parent_id, name, slug, description, image_url, sort_order, is_active,
    meta_title, meta_description, meta_keywords
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: UpdateCategory :one
UPDATE categories
SET parent_id = $2, name = $3, slug = $4, description = $5, image_url = $6,
    sort_order = $7, is_active = $8, meta_title = $9, meta_description = $10,
    meta_keywords = $11
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

-- name: CountCategoriesWithSlug :one
SELECT COUNT(*) FROM categories
WHERE slug = $1 AND (sqlc.narg('exclude_id')::uuid IS NULL OR id <> sqlc.narg('exclude_id'));

-- name: CountSiblingCategoriesWithName :one
-- Categories are only required to be uniquely named within one parent, so the
-- comparison uses IS NOT DISTINCT FROM to make two root categories (parent_id
-- NULL) count as siblings.
SELECT COUNT(*) FROM categories
WHERE lower(name) = lower(sqlc.arg('name')::text)
  AND parent_id IS NOT DISTINCT FROM sqlc.narg('parent_id')::uuid
  AND (sqlc.narg('exclude_id')::uuid IS NULL OR id <> sqlc.narg('exclude_id'));

-- name: ListCategorySubtreeIDs :many
-- The category itself plus every descendant. Used to reject a parent that would
-- close a loop in the tree.
WITH RECURSIVE subtree AS (
    SELECT c.id FROM categories c WHERE c.id = $1
    UNION
    SELECT c.id FROM categories c JOIN subtree s ON c.parent_id = s.id
)
SELECT s.id FROM subtree s;

-- name: CountProductsInCategory :one
SELECT COUNT(*) FROM products WHERE category_id = $1;

-- name: CountChildCategories :one
SELECT COUNT(*) FROM categories WHERE parent_id = $1;
