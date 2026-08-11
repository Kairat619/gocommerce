-- name: GetOrderByID :one
SELECT o.*,
    u.name AS customer_name,
    u.email AS customer_email
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.id = $1;

-- name: CreateOrder :one
INSERT INTO orders (user_id, status, total, subtotal, tax, shipping_cost, discount, notes, shipping_name, shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country, billing_name, billing_address, billing_city, billing_state, billing_postal_code, billing_country)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
RETURNING *;

-- name: UpdateOrderStatus :exec
UPDATE orders SET status = $2 WHERE id = $1;

-- name: UpdateOrder :one
UPDATE orders
SET status = $2, notes = $3, shipping_name = $4, shipping_address = $5, shipping_city = $6, shipping_state = $7, shipping_postal_code = $8, shipping_country = $9
WHERE id = $1
RETURNING *;

-- name: ListOrdersByUser :many
SELECT o.*
FROM orders o
WHERE o.user_id = $1
ORDER BY o.created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountOrdersByUser :one
SELECT COUNT(*) FROM orders WHERE user_id = $1;

-- name: ListAllOrders :many
SELECT o.*,
    u.name AS customer_name,
    u.email AS customer_email
FROM orders o
JOIN users u ON u.id = o.user_id
ORDER BY o.created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountAllOrders :one
SELECT COUNT(*) FROM orders;

-- name: ListOrdersByStatus :many
SELECT o.*,
    u.name AS customer_name,
    u.email AS customer_email
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.status = $1
ORDER BY o.created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountOrdersByStatus :one
SELECT COUNT(*) FROM orders WHERE status = $1;

-- name: GetRecentOrders :many
SELECT o.*,
    u.name AS customer_name,
    u.email AS customer_email
FROM orders o
JOIN users u ON u.id = o.user_id
ORDER BY o.created_at DESC
LIMIT $1;

-- name: GetTotalSales :one
SELECT COALESCE(SUM(total), 0)::decimal AS total_sales
FROM orders
WHERE status != 'cancelled';

-- name: GetSalesByDay :many
SELECT
    DATE(created_at) AS date,
    COUNT(*)::bigint AS order_count,
    COALESCE(SUM(total), 0)::decimal AS revenue
FROM orders
WHERE status != 'cancelled'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- name: GetOrdersByDateRange :many
SELECT o.*,
    u.name AS customer_name,
    u.email AS customer_email
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.created_at >= $1 AND o.created_at <= $2
ORDER BY o.created_at DESC;

-- name: GetOrderSummary :one
SELECT
    COUNT(*)::bigint AS total_orders,
    COALESCE(SUM(total), 0)::decimal AS total_revenue,
    COALESCE(AVG(total), 0)::decimal AS average_order_value,
    COUNT(DISTINCT user_id)::bigint AS unique_customers
FROM orders
WHERE status != 'cancelled';
