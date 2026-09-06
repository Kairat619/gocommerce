-- name: ListCoupons :many
SELECT * FROM coupons
ORDER BY created_at DESC;

-- name: GetCouponByID :one
SELECT * FROM coupons WHERE id = $1;

-- name: GetCouponByCode :one
SELECT * FROM coupons WHERE code = $1;

-- name: CountCouponsByCode :one
-- Uniqueness check for the admin form. sqlc.narg('exclude_id') is the coupon
-- being edited, so saving it without changing the code is not a conflict.
SELECT COUNT(*) FROM coupons
WHERE code = $1
  AND (sqlc.narg('exclude_id')::uuid IS NULL OR id <> sqlc.narg('exclude_id')::uuid);

-- name: CreateCoupon :one
INSERT INTO coupons (
    code, description, is_active,
    discount_type, discount_value, max_discount_amount,
    min_order_amount, min_order_quantity,
    max_uses, max_uses_per_customer,
    starts_at, ends_at
) VALUES (
    $1, $2, $3,
    $4, $5, $6,
    $7, $8,
    $9, $10,
    $11, $12
)
RETURNING *;

-- name: UpdateCoupon :one
-- used_count is deliberately absent: editing a coupon must never reset the
-- redemptions already recorded against it.
UPDATE coupons SET
    code = $2,
    description = $3,
    is_active = $4,
    discount_type = $5,
    discount_value = $6,
    max_discount_amount = $7,
    min_order_amount = $8,
    min_order_quantity = $9,
    max_uses = $10,
    max_uses_per_customer = $11,
    starts_at = $12,
    ends_at = $13
WHERE id = $1
RETURNING *;

-- name: DeleteCoupon :exec
DELETE FROM coupons WHERE id = $1;

-- name: IncrementCouponUsedCount :exec
UPDATE coupons SET used_count = used_count + 1 WHERE id = $1;

-- name: CreateCouponRedemption :one
INSERT INTO coupon_redemptions (coupon_id, user_id, order_id, discount_amount)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: CountCouponRedemptionsByUser :one
SELECT COUNT(*) FROM coupon_redemptions
WHERE coupon_id = $1 AND user_id = $2;
