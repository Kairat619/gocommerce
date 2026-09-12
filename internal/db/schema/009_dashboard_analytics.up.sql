-- Dashboard analytics: indexes only.
--
-- The dashboard asks questions no screen asked before. Every other admin page
-- looks up a row by id, or scans one entity filtered by one column. The
-- dashboard instead aggregates a whole date window at once — revenue per day,
-- orders per status, customers acquired this month — and it asks all of those
-- on every page load.
--
-- Nothing here adds, drops or alters a table, a column or a constraint. No
-- historical row is touched. These are three composite indexes that make the
-- existing rows cheaper to aggregate, and dropping them again (see the .down)
-- leaves the database byte-for-byte the schema it was before.

-- Revenue, order counts and the sales chart all filter the same two columns
-- together: a status predicate (cancelled orders are excluded from money) and a
-- half-open created_at window. idx_orders_created covers the date alone and
-- idx_orders_status the status alone, so Postgres had to pick one and filter
-- the rest by hand. status first, then created_at DESC, matches both the
-- equality-then-range shape of those queries and the newest-first order the
-- chart and the recent-orders list read in.
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);

-- "New customers in this period" is `role = 'customer' AND created_at >= $1`.
-- idx_users_role alone matches roughly half the table — every customer ever —
-- before the date is even considered.
CREATE INDEX IF NOT EXISTS idx_users_role_created ON users(role, created_at DESC);

-- The activity feed reads the newest events across *all* orders.
-- idx_order_activity_order is ordered by order_id first, so it cannot serve a
-- store-wide chronology; without this the feed sorts the entire table to show
-- ten rows.
CREATE INDEX IF NOT EXISTS idx_order_activity_created ON order_activity(created_at DESC);
