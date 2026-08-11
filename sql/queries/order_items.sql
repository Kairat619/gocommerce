-- name: GetOrderItemsByOrderID :many
SELECT oi.*, p.slug AS product_slug, p.image_url AS product_image_url
FROM order_items oi
JOIN products p ON p.id = oi.product_id
WHERE oi.order_id = $1
ORDER BY oi.created_at ASC;

-- name: CreateOrderItem :one
INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_name, quantity, unit_price, total)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: DeleteOrderItemsByOrderID :exec
DELETE FROM order_items WHERE order_id = $1;

-- name: GetOrderItemCountByProduct :one
SELECT COALESCE(SUM(quantity), 0)::bigint AS total_sold
FROM order_items
WHERE product_id = $1;

-- name: GetOrderItemByProduct :many
SELECT oi.*, o.status AS order_status
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE oi.product_id = $1
ORDER BY oi.created_at DESC;

-- name: GetTopSellingProducts :many
SELECT
    p.id,
    p.name,
    p.slug,
    p.price,
    p.image_url,
    SUM(oi.quantity)::bigint AS total_sold,
    SUM(oi.total)::decimal AS total_revenue
FROM order_items oi
JOIN products p ON p.id = oi.product_id
JOIN orders o ON o.id = oi.order_id
WHERE o.status != 'cancelled'
GROUP BY p.id, p.name, p.slug, p.price, p.image_url
ORDER BY total_sold DESC
LIMIT $1;
