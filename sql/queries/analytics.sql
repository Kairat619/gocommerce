-- ---------------------------------------------------------------------------
-- Dashboard analytics
--
-- Every aggregate the dashboard shows is computed here, in Postgres, over a
-- half-open [from, to) window -- never in React, and never by pulling rows into
-- Go to add up. The dashboard is the one screen that asks about the whole table
-- at once; doing that anywhere but the database does not survive a real order
-- volume.
--
-- THE REVENUE DEFINITION
--
-- Revenue is SUM(orders.total) WHERE status <> 'cancelled'.
--
-- That is not a new definition invented for this page. It is exactly what
-- GetOrderSummary, GetTotalSales and GetCustomerOrderStats already compute, and
-- what the customer card on the order detail page already displays as lifetime
-- value. `total` is the recorded grand total of the order -- after discount, and
-- inclusive of tax and shipping, exactly as the customer was charged and
-- exactly as the admin displays it. Cancelled orders are excluded because they
-- were never collected; the store has no refund concept, so there is nothing
-- further to net off.
--
-- Every money aggregate below carries that same status filter, so an order
-- contributes consistently to revenue, to its product's revenue, to its
-- category's revenue and to its coupon's discount, or to none of them.
--
-- Order counts that feed money (orders, average order value) use the same
-- filter, so AOV = revenue / orders is arithmetically honest. The status
-- breakdown in CountOrdersByStatusInRange deliberately does NOT filter, because
-- its entire job is to show how many were cancelled.
--
-- TWO REVENUE BASES, AND WHY THEY DO NOT ADD UP
--
-- Order-level revenue is SUM(orders.total): the grand total, inclusive of tax
-- and shipping. Line-level revenue -- what a product, a category or a coupon is
-- credited with -- is SUM(order_items.total), which is the goods only.
--
-- So the best sellers will always sum to LESS than the revenue KPI, and that is
-- correct: shipping and tax are not revenue a product earned, and splitting
-- them across lines would invent an allocation the store never recorded. The
-- difference is deliberate, not drift, and each card says which basis it is on
-- so nobody has to reconcile two numbers that were never meant to match.
-- ---------------------------------------------------------------------------

-- name: GetSalesSummary :one
-- The executive KPI row for one period. One round trip, and every number
-- describes the same set of orders.
--
-- items_sold is a scalar subquery rather than a join so the order-level
-- aggregates are not multiplied by the line count of each order -- joining
-- order_items here would inflate revenue by exactly that factor, which is the
-- classic way a dashboard starts disagreeing with the orders page.
SELECT
    COUNT(*)::bigint AS orders,
    COALESCE(SUM(total), 0)::numeric AS revenue,
    COALESCE(AVG(total), 0)::numeric AS average_order_value,
    COALESCE(SUM(discount), 0)::numeric AS discount_total,
    COUNT(DISTINCT user_id)::bigint AS buyers,
    (
        SELECT COALESCE(SUM(oi.quantity), 0)::bigint
        FROM order_items oi
        JOIN orders io ON io.id = oi.order_id
        WHERE io.status <> 'cancelled'
          AND io.created_at >= sqlc.arg('from')::timestamptz
          AND io.created_at <  sqlc.arg('to')::timestamptz
    )::bigint AS items_sold
FROM orders
WHERE status <> 'cancelled'
  AND created_at >= sqlc.arg('from')::timestamptz
  AND created_at <  sqlc.arg('to')::timestamptz;

-- name: CountNewCustomersInRange :one
-- Accounts registered in the window. This counts registrations, not buyers --
-- GetCustomerMix answers the buyer question -- and uses the same role='customer'
-- filter as the Customers page so the two never disagree.
SELECT COUNT(*)::bigint
FROM users
WHERE role = 'customer'
  AND created_at >= sqlc.arg('from')::timestamptz
  AND created_at <  sqlc.arg('to')::timestamptz;

-- name: GetSalesSeries :many
-- The sales chart, bucketed by day, week or month.
--
-- The buckets are generated first and orders LEFT JOINed onto them, so a day
-- with no sales comes back as a real zero instead of disappearing. A chart that
-- silently drops empty days draws a straight line through a quiet week and
-- tells the merchant a comforting lie.
--
-- The bucket unit arrives as text and is interpolated into an interval, so the
-- handler must only ever pass 'day', 'week' or 'month'; anything else is a cast
-- error at the database rather than a silent wrong answer.
WITH bounds AS (
    SELECT
        date_trunc(sqlc.arg('bucket')::text, sqlc.arg('from')::timestamptz) AS start_at,
        sqlc.arg('to')::timestamptz AS end_at,
        ('1 ' || sqlc.arg('bucket')::text)::interval AS step
),
buckets AS (
    SELECT generate_series(b.start_at, b.end_at - interval '1 microsecond', b.step) AS bucket_at,
           b.step AS step
    FROM bounds b
)
SELECT
    bk.bucket_at::timestamptz AS bucket_at,
    COALESCE(SUM(o.total), 0)::numeric AS revenue,
    COUNT(o.id)::bigint AS orders
FROM buckets bk
LEFT JOIN orders o
       ON o.created_at >= bk.bucket_at
      AND o.created_at <  bk.bucket_at + bk.step
      AND o.created_at >= sqlc.arg('from')::timestamptz
      AND o.created_at <  sqlc.arg('to')::timestamptz
      AND o.status <> 'cancelled'
GROUP BY bk.bucket_at
ORDER BY bk.bucket_at;

-- name: CountOrdersByStatusInRange :many
-- The order status distribution for the window.
--
-- Unfiltered by design: cancelled orders are the point of this query. It mirrors
-- CountOrdersByEachStatus (which the orders list uses for its tabs), windowed.
SELECT status, COUNT(*)::bigint AS count
FROM orders
WHERE created_at >= sqlc.arg('from')::timestamptz
  AND created_at <  sqlc.arg('to')::timestamptz
GROUP BY status;

-- name: GetOpenOrderBacklog :one
-- Operational load, as of right now.
--
-- Deliberately NOT windowed. An order that has sat unfulfilled since last month
-- is exactly the one the merchant needs to see, and a "last 7 days" filter is
-- precisely what would hide it. The dashboard labels this section as current
-- rather than period-scoped for that reason.
--
-- `stalled` is an open order older than the cutoff the handler passes. It is
-- derived from recorded timestamps and the real lifecycle, not a guess about
-- payment or delivery -- the store records neither.
SELECT
    COUNT(*) FILTER (WHERE status = 'pending')::bigint AS pending,
    COUNT(*) FILTER (WHERE status IN ('pending', 'confirmed', 'processing'))::bigint AS awaiting_fulfilment,
    COUNT(*) FILTER (WHERE status = 'shipped')::bigint AS in_transit,
    COUNT(*) FILTER (
        WHERE status IN ('pending', 'confirmed', 'processing')
          AND created_at < sqlc.arg('stalled_before')::timestamptz
    )::bigint AS stalled
FROM orders
WHERE status NOT IN ('delivered', 'cancelled');

-- name: ListOrdersNeedingAttention :many
-- The backlog itself, oldest first -- the order that has waited longest is the
-- one to open. Same row shape as the orders list so the dashboard can render
-- these with the existing order components instead of a second representation.
SELECT o.id,
       o.status,
       o.total,
       o.created_at,
       u.name AS customer_name,
       u.email AS customer_email,
       (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id)::bigint AS item_count
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.status IN ('pending', 'confirmed', 'processing')
ORDER BY o.created_at ASC
LIMIT $1;

-- name: GetTopProductsInRange :many
-- Best sellers for the window, ranked by revenue.
--
-- "Top" is meaningless unless the measure is named, so both measures come back
-- and the UI states which one it sorted by.
--
-- revenue here is line revenue -- SUM(order_items.total), goods only. It will
-- not sum to the revenue KPI, which is order grand totals including tax and
-- shipping. See the header.
--
-- product_name is NOT read from order_items here: this ranks *products*, and a
-- product that was renamed should appear once under its current name rather
-- than split across every historical spelling. The historical name still rules
-- the order detail page, which is where it matters.
SELECT p.id,
       p.name,
       p.slug,
       p.sku,
       p.image_url,
       SUM(oi.quantity)::bigint AS units_sold,
       COALESCE(SUM(oi.total), 0)::numeric AS revenue,
       COUNT(DISTINCT oi.order_id)::bigint AS order_count
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN products p ON p.id = oi.product_id
WHERE o.status <> 'cancelled'
  AND o.created_at >= sqlc.arg('from')::timestamptz
  AND o.created_at <  sqlc.arg('to')::timestamptz
GROUP BY p.id, p.name, p.slug, p.sku, p.image_url
ORDER BY revenue DESC, units_sold DESC
LIMIT sqlc.arg('result_limit');

-- name: GetTopCategoriesInRange :many
-- The same sales, grouped one level up. Uses the product's current category,
-- which is the only category the store records -- there is no historical
-- category on the order line.
SELECT c.id,
       c.name,
       c.slug,
       SUM(oi.quantity)::bigint AS units_sold,
       COALESCE(SUM(oi.total), 0)::numeric AS revenue,
       COUNT(DISTINCT oi.order_id)::bigint AS order_count
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN products p ON p.id = oi.product_id
JOIN categories c ON c.id = p.category_id
WHERE o.status <> 'cancelled'
  AND o.created_at >= sqlc.arg('from')::timestamptz
  AND o.created_at <  sqlc.arg('to')::timestamptz
GROUP BY c.id, c.name, c.slug
ORDER BY revenue DESC, units_sold DESC
LIMIT sqlc.arg('result_limit');

-- name: GetCustomerMix :one
-- New versus returning buyers in the window.
--
-- Identity is orders.user_id -- the store's own account identity, the same one
-- the Customers page and the customer lifetime-value card use. Nothing here
-- guesses at identity from an email address.
--
-- A buyer is "returning" if they have any earlier non-cancelled order at all,
-- from any time before the window -- not merely earlier within it.
WITH buyers AS (
    SELECT DISTINCT o.user_id AS user_id
    FROM orders o
    WHERE o.status <> 'cancelled'
      AND o.created_at >= sqlc.arg('from')::timestamptz
      AND o.created_at <  sqlc.arg('to')::timestamptz
)
SELECT
    COUNT(*) FILTER (WHERE NOT prior.existed)::bigint AS new_buyers,
    COUNT(*) FILTER (WHERE prior.existed)::bigint AS returning_buyers
FROM buyers b
CROSS JOIN LATERAL (
    SELECT EXISTS (
        SELECT 1 FROM orders e
        WHERE e.user_id = b.user_id
          AND e.status <> 'cancelled'
          AND e.created_at < sqlc.arg('from')::timestamptz
    ) AS existed
) prior;

-- name: GetTopCustomersInRange :many
-- Who is actually spending, for the window. Same revenue rule as everywhere
-- else, so these totals sum into the revenue KPI rather than beside it.
SELECT u.id,
       u.name,
       u.email,
       COUNT(o.id)::bigint AS order_count,
       COALESCE(SUM(o.total), 0)::numeric AS revenue
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.status <> 'cancelled'
  AND o.created_at >= sqlc.arg('from')::timestamptz
  AND o.created_at <  sqlc.arg('to')::timestamptz
GROUP BY u.id, u.name, u.email
ORDER BY revenue DESC, order_count DESC
LIMIT sqlc.arg('result_limit');

-- name: GetInventoryHealth :one
-- Stock trouble, as of right now -- like the backlog, never windowed.
--
-- Only products that are both active and inventory-tracked are counted. A
-- product with track_inventory = false has no meaningful stock number, so
-- counting its zero as "out of stock" would manufacture an alert. The threshold
-- is each product's own configured low_stock_threshold, not a global guess.
SELECT
    COUNT(*) FILTER (WHERE stock_quantity <= 0)::bigint AS out_of_stock,
    COUNT(*) FILTER (WHERE stock_quantity > 0 AND stock_quantity <= low_stock_threshold)::bigint AS low_stock,
    COUNT(*)::bigint AS tracked_products
FROM products
WHERE is_active = true
  AND track_inventory = true;

-- name: ListInventoryAlerts :many
-- The products behind those counts, emptiest first.
--
-- LEFT JOIN to categories: category_id is nullable, and a product without one
-- must still be able to raise a stock alert.
SELECT p.id,
       p.name,
       p.slug,
       p.sku,
       p.image_url,
       p.stock_quantity,
       p.low_stock_threshold,
       p.allow_backorders,
       c.name AS category_name
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.is_active = true
  AND p.track_inventory = true
  AND p.stock_quantity <= p.low_stock_threshold
ORDER BY p.stock_quantity ASC, p.name ASC
LIMIT $1;

-- name: GetCouponPerformanceInRange :one
-- Promotion impact for the window, read from coupon_redemptions -- the recorded
-- fact of a coupon being applied to an order, with the discount it actually
-- granted.
--
-- Joined to orders and filtered by the same status rule, so a coupon on a
-- cancelled order stops counting at the same moment that order stops counting
-- towards revenue.
SELECT
    COUNT(*)::bigint AS redemptions,
    COALESCE(SUM(cr.discount_amount), 0)::numeric AS discount_total,
    COUNT(DISTINCT cr.order_id)::bigint AS orders,
    COALESCE(SUM(o.total), 0)::numeric AS revenue
FROM coupon_redemptions cr
JOIN orders o ON o.id = cr.order_id
WHERE o.status <> 'cancelled'
  AND o.created_at >= sqlc.arg('from')::timestamptz
  AND o.created_at <  sqlc.arg('to')::timestamptz;

-- name: ListTopCouponsInRange :many
-- Which promotions did the work. Ordered by revenue driven rather than by
-- discount given: the biggest giveaway is not automatically the best campaign.
SELECT c.id,
       c.code,
       c.description,
       c.discount_type,
       c.discount_value,
       c.is_active,
       COUNT(cr.id)::bigint AS redemptions,
       COALESCE(SUM(cr.discount_amount), 0)::numeric AS discount_total,
       COALESCE(SUM(o.total), 0)::numeric AS revenue
FROM coupon_redemptions cr
JOIN orders o ON o.id = cr.order_id
JOIN coupons c ON c.id = cr.coupon_id
WHERE o.status <> 'cancelled'
  AND o.created_at >= sqlc.arg('from')::timestamptz
  AND o.created_at <  sqlc.arg('to')::timestamptz
GROUP BY c.id, c.code, c.description, c.discount_type, c.discount_value, c.is_active
ORDER BY revenue DESC, redemptions DESC
LIMIT sqlc.arg('result_limit');

-- name: CountLiveCoupons :one
-- Coupons a customer could successfully redeem this second.
--
-- This mirrors couponLifecycle() in admin_coupons.go and the guard rails in
-- service/coupon.go clause for clause -- enabled, started, not ended, not used
-- up. If those rules ever change, this must change with them, or the dashboard
-- will advertise coupons the checkout refuses.
SELECT COUNT(*)::bigint
FROM coupons
WHERE is_active = true
  AND (starts_at IS NULL OR starts_at <= NOW())
  AND (ends_at IS NULL OR ends_at > NOW())
  AND (max_uses IS NULL OR used_count < max_uses);

-- name: ListRecentActivity :many
-- The store-wide activity stream.
--
-- order_activity is the only audit trail the application keeps, and it already
-- records who did what and when, with the actor's name captured at write time.
-- Nothing is invented to pad this feed: no product or customer events are
-- synthesised from created_at timestamps, because those are not events.
SELECT a.id,
       a.order_id,
       a.actor_name,
       a.kind,
       a.message,
       a.from_status,
       a.to_status,
       a.created_at,
       u.name AS customer_name
FROM order_activity a
JOIN orders o ON o.id = a.order_id
JOIN users u ON u.id = o.user_id
ORDER BY a.created_at DESC, a.id DESC
LIMIT $1;
