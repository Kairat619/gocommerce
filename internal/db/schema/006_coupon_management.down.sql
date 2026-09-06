ALTER TABLE orders DROP COLUMN IF EXISTS coupon_code;

DROP TABLE IF EXISTS coupon_redemptions;
DROP TABLE IF EXISTS coupons;
