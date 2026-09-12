-- name: GetStoreSettings :one
SELECT * FROM store_settings WHERE id = 1;

-- name: UpsertStoreSettings :one
-- The whole configuration is written at once.
--
-- store_settings is a single row and the service always loads it, applies one
-- section's changes on top and writes the result back, so a partial write is
-- not a thing that can happen: saving the Catalogue page cannot clear the tax
-- rate because the tax rate is re-sent with the values it already had.
--
-- The alternative — one UPDATE per section, touching only its own columns —
-- would need a statement per section and would still race two admins editing
-- different sections. Reading and writing the whole singleton makes last-write-
-- wins explicit rather than accidental.
INSERT INTO store_settings (
    id,
    tax_rate, shipping_cost, free_shipping_threshold,
    store_name, store_description, store_email, store_phone,
    currency, products_per_page,
    default_product_active, default_track_inventory,
    default_allow_backorders, default_low_stock_threshold
)
VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
ON CONFLICT (id) DO UPDATE
SET tax_rate                    = EXCLUDED.tax_rate,
    shipping_cost               = EXCLUDED.shipping_cost,
    free_shipping_threshold     = EXCLUDED.free_shipping_threshold,
    store_name                  = EXCLUDED.store_name,
    store_description           = EXCLUDED.store_description,
    store_email                 = EXCLUDED.store_email,
    store_phone                 = EXCLUDED.store_phone,
    currency                    = EXCLUDED.currency,
    products_per_page           = EXCLUDED.products_per_page,
    default_product_active      = EXCLUDED.default_product_active,
    default_track_inventory     = EXCLUDED.default_track_inventory,
    default_allow_backorders    = EXCLUDED.default_allow_backorders,
    default_low_stock_threshold = EXCLUDED.default_low_stock_threshold
RETURNING *;

-- ---------------------------------------------------------------------------
-- Settings audit trail
--
-- Only the database-backed settings above ever appear here. Secrets live in
-- environment variables, are not editable from the admin, and so never reach
-- this table — see the note on settings_activity in migration 010.
-- ---------------------------------------------------------------------------

-- name: CreateSettingsActivity :one
INSERT INTO settings_activity (user_id, actor_name, setting_key, previous_value, new_value)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListSettingsActivity :many
-- The store-wide configuration history, newest first.
SELECT * FROM settings_activity
ORDER BY created_at DESC, id DESC
LIMIT $1;

-- name: ListSettingsActivityForKeys :many
-- The history of one section's fields, so each settings page can show what was
-- last changed there without loading the whole log.
SELECT * FROM settings_activity
WHERE setting_key = ANY(sqlc.arg('setting_keys')::text[])
ORDER BY created_at DESC, id DESC
LIMIT sqlc.arg('result_limit');
