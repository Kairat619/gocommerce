-- Indexes are pure optimisation: dropping them slows the dashboard down and
-- changes nothing about the data or the schema.

DROP INDEX IF EXISTS idx_order_activity_created;
DROP INDEX IF EXISTS idx_users_role_created;
DROP INDEX IF EXISTS idx_orders_status_created;
