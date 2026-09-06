-- The activity log is additive: dropping it restores the pre-008 order tables
-- exactly. Orders themselves were never modified, so nothing else to undo.

DROP TABLE IF EXISTS order_activity;
