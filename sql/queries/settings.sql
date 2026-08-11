-- name: GetStoreSettings :one
SELECT * FROM store_settings WHERE id = 1;

-- name: UpsertStoreSettings :one
INSERT INTO store_settings (id, tax_rate, shipping_cost, free_shipping_threshold)
VALUES (1, $1, $2, $3)
ON CONFLICT (id) DO UPDATE
SET tax_rate = EXCLUDED.tax_rate,
    shipping_cost = EXCLUDED.shipping_cost,
    free_shipping_threshold = EXCLUDED.free_shipping_threshold
RETURNING *;
