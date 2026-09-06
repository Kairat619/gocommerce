-- Coupon management.
--
-- One `coupons` row is one customer-facing promotion. `coupon_redemptions`
-- records each successful use so the per-customer limit can be enforced
-- against real history rather than a counter that cannot be attributed.
--
-- Scope note: this release covers percentage, fixed-amount and free-shipping
-- discounts with order-level conditions. Product, category and customer
-- restrictions are deliberately absent — there is no half-built schema for
-- them, so the admin form cannot offer a control the engine would ignore.

CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Stored already upper-cased and trimmed by the handler, so the UNIQUE
    -- index is the case-insensitive uniqueness check.
    code VARCHAR(64) NOT NULL UNIQUE,

    -- Merchant-facing only. Never shown to a customer.
    description TEXT NOT NULL DEFAULT '',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    discount_type VARCHAR(20) NOT NULL
        CHECK (discount_type IN ('percentage', 'fixed', 'free_shipping')),

    -- Percent for 'percentage', money for 'fixed', unused (0) for
    -- 'free_shipping'.
    discount_value DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (discount_value >= 0),

    -- Percentage cap. NULL means uncapped.
    max_discount_amount DECIMAL(10, 2) CHECK (max_discount_amount IS NULL OR max_discount_amount > 0),

    min_order_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (min_order_amount >= 0),
    min_order_quantity INTEGER NOT NULL DEFAULT 0 CHECK (min_order_quantity >= 0),

    -- NULL means unlimited, for both limits.
    max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
    max_uses_per_customer INTEGER CHECK (max_uses_per_customer IS NULL OR max_uses_per_customer > 0),

    used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),

    -- Both NULL means "always valid". Stored as timestamptz, so the stored
    -- instant is unambiguous regardless of the admin's local zone.
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- A percentage over 100 would hand money back, so it is refused at the
    -- storage layer as well as in the handler.
    CONSTRAINT coupons_percentage_within_range
        CHECK (discount_type <> 'percentage' OR discount_value <= 100),

    -- Percentage and fixed coupons must actually take something off.
    CONSTRAINT coupons_value_required
        CHECK (discount_type = 'free_shipping' OR discount_value > 0),

    CONSTRAINT coupons_date_range_ordered
        CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX idx_coupons_is_active ON coupons(is_active);
CREATE INDEX idx_coupons_created_at ON coupons(created_at DESC);

CREATE TRIGGER trg_coupons_updated_at BEFORE UPDATE ON coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- One row per successful redemption. The order is kept nullable so deleting an
-- order never destroys the usage history that limits depend on.
CREATE TABLE coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coupon_redemptions_coupon ON coupon_redemptions(coupon_id);
CREATE INDEX idx_coupon_redemptions_coupon_user ON coupon_redemptions(coupon_id, user_id);

-- The code that was actually redeemed, denormalised onto the order so order
-- history stays readable after a coupon is edited or deleted. `discount`
-- already existed and was always 0; it now carries the real amount.
ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(64);
