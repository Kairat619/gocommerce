-- name: GetOrderByID :one
SELECT o.*,
    u.name AS customer_name,
    u.email AS customer_email
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.id = $1;

-- name: CreateOrder :one
INSERT INTO orders (user_id, status, total, subtotal, tax, shipping_cost, discount, coupon_code, notes, shipping_name, shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country, billing_name, billing_address, billing_city, billing_state, billing_postal_code, billing_country)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
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

-- ---------------------------------------------------------------------------
-- Admin order management
--
-- The queries above still serve checkout, the account pages and the dashboard.
-- Everything below backs the admin Orders screens.
-- ---------------------------------------------------------------------------

-- name: FilterOrders :many
-- One query for the whole orders list: search, status, date range and sort.
-- Every filter is optional and NULL means "not applied", so the admin never
-- needs a second code path per combination.
--
-- Sorting is expressed as CASE arms rather than string interpolation, so the
-- sort key can never carry SQL. created_at DESC is the final tiebreaker and the
-- default.
SELECT o.*,
    u.name AS customer_name,
    u.email AS customer_email,
    (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id)::bigint AS item_count
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE (sqlc.narg('status')::order_status IS NULL OR o.status = sqlc.narg('status')::order_status)
  AND (sqlc.narg('search')::text IS NULL
       OR u.name ILIKE '%' || sqlc.narg('search')::text || '%'
       OR u.email ILIKE '%' || sqlc.narg('search')::text || '%'
       OR o.shipping_name ILIKE '%' || sqlc.narg('search')::text || '%'
       OR o.coupon_code ILIKE '%' || sqlc.narg('search')::text || '%'
       -- Order ids are shown to staff as a short hex prefix, so the same prefix
       -- is what they paste back into the search box.
       OR replace(o.id::text, '-', '') ILIKE sqlc.narg('search')::text || '%')
  AND (sqlc.narg('from')::timestamptz IS NULL OR o.created_at >= sqlc.narg('from')::timestamptz)
  AND (sqlc.narg('to')::timestamptz IS NULL OR o.created_at < sqlc.narg('to')::timestamptz)
ORDER BY
    CASE WHEN sqlc.narg('sort')::text = 'oldest' THEN o.created_at END ASC,
    CASE WHEN sqlc.narg('sort')::text = 'total_desc' THEN o.total END DESC,
    CASE WHEN sqlc.narg('sort')::text = 'total_asc' THEN o.total END ASC,
    CASE WHEN sqlc.narg('sort')::text = 'customer' THEN u.name END ASC,
    o.created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountFilterOrders :one
-- Must mirror FilterOrders' WHERE clause exactly or the pagination lies.
SELECT COUNT(*)
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE (sqlc.narg('status')::order_status IS NULL OR o.status = sqlc.narg('status')::order_status)
  AND (sqlc.narg('search')::text IS NULL
       OR u.name ILIKE '%' || sqlc.narg('search')::text || '%'
       OR u.email ILIKE '%' || sqlc.narg('search')::text || '%'
       OR o.shipping_name ILIKE '%' || sqlc.narg('search')::text || '%'
       OR o.coupon_code ILIKE '%' || sqlc.narg('search')::text || '%'
       OR replace(o.id::text, '-', '') ILIKE sqlc.narg('search')::text || '%')
  AND (sqlc.narg('from')::timestamptz IS NULL OR o.created_at >= sqlc.narg('from')::timestamptz)
  AND (sqlc.narg('to')::timestamptz IS NULL OR o.created_at < sqlc.narg('to')::timestamptz);

-- name: CountOrdersByEachStatus :many
-- Powers the counts on the status tabs. One grouped query rather than one
-- COUNT per tab.
SELECT status, COUNT(*)::bigint AS count
FROM orders
GROUP BY status;

-- name: GetCustomerOrderStats :one
-- The customer card on the order detail page: how much this customer has spent
-- with the store, and over how many orders. Cancelled orders are excluded from
-- the value since they were never collected.
SELECT COUNT(*)::bigint AS order_count,
       COALESCE(SUM(total) FILTER (WHERE status <> 'cancelled'), 0)::numeric AS lifetime_value
FROM orders
WHERE user_id = $1;

-- ---------------------------------------------------------------------------
-- Activity log
-- ---------------------------------------------------------------------------

-- name: ListOrderActivity :many
SELECT * FROM order_activity
WHERE order_id = $1
ORDER BY created_at ASC, id ASC;

-- name: CreateOrderActivity :one
INSERT INTO order_activity (order_id, user_id, actor_name, kind, message, from_status, to_status)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;
