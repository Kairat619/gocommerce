-- name: GetAddressByID :one
SELECT * FROM addresses WHERE id = $1;

-- name: CreateAddress :one
INSERT INTO addresses (user_id, label, first_name, last_name, company, address_line1, address_line2, city, state, postal_code, country, phone, is_default)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
RETURNING *;

-- name: UpdateAddress :one
UPDATE addresses
SET label = $2, first_name = $3, last_name = $4, company = $5, address_line1 = $6, address_line2 = $7, city = $8, state = $9, postal_code = $10, country = $11, phone = $12, is_default = $13
WHERE id = $1
RETURNING *;

-- name: DeleteAddress :exec
DELETE FROM addresses WHERE id = $1;

-- name: ListAddressesByUser :many
SELECT * FROM addresses
WHERE user_id = $1
ORDER BY is_default DESC, created_at DESC;

-- name: GetDefaultAddress :one
SELECT * FROM addresses
WHERE user_id = $1 AND is_default = true
LIMIT 1;

-- name: SetDefaultAddress :exec
UPDATE addresses SET is_default = false WHERE user_id = $1;
UPDATE addresses SET is_default = true WHERE id = $2;

-- name: CountAddressesByUser :one
SELECT COUNT(*) FROM addresses WHERE user_id = $1;
