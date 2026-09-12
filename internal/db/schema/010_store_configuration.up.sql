-- Store configuration: turn the hardcoded constants into real settings.
--
-- store_settings held exactly three values — tax rate, shipping fee and free
-- shipping threshold. Everything else that behaves like a setting was a
-- constant compiled into the binary or the bundle:
--
--   storeCurrency    = "USD"      internal/handler/admin_products.go
--   DEFAULT_CURRENCY = "USD"      frontend/src/lib/money.js   (a SECOND copy)
--   BRAND_NAME       = "ShopNest" frontend/src/lib/brand.js
--   productsPerPage  = 12         internal/handler/products.go
--   product defaults              column defaults AND productFormState.js
--
-- Two of those are the same setting stored twice, which is how a store ends up
-- displaying one currency on the storefront and another in the admin. This
-- migration gives each of them one home.
--
-- EVERY DEFAULT BELOW REPRODUCES TODAY'S BEHAVIOUR EXACTLY.
--
-- That is the whole point: applying this migration must change nothing a
-- shopper or an administrator can see. store_name defaults to 'ShopNest'
-- because that is what the storefront actually displays today — not to
-- 'GoCommerce', which is what the unused appName prop has always said. Adopting
-- appName here would silently rebrand the shop, which is a product decision and
-- not a migration's to make.
--
-- The three existing columns are untouched. No row is rewritten.

ALTER TABLE store_settings
    -- Identity. Replaces BRAND_NAME, and resolves the long-standing split
    -- between it and the appName shared prop (see frontend/src/lib/brand.js).
    ADD COLUMN IF NOT EXISTS store_name VARCHAR(255) NOT NULL DEFAULT 'ShopNest',
    ADD COLUMN IF NOT EXISTS store_description TEXT NOT NULL DEFAULT '',

    -- Contact details. Display-only: this application has no mail transport of
    -- any kind, so store_email is an address shown to shoppers, never one the
    -- system sends from. It must not grow notification toggles behind it until
    -- something can actually send a message.
    ADD COLUMN IF NOT EXISTS store_email VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS store_phone VARCHAR(50) NOT NULL DEFAULT '',

    -- The single source of truth for currency, replacing the Go const and the
    -- JavaScript const that had drifted apart by construction.
    --
    -- This is a DISPLAY currency. Changing it re-labels every amount in the
    -- database; it does not convert one. There is no exchange-rate table and no
    -- per-order currency column, so a historical order has no currency of its
    -- own to preserve — which is precisely why the admin UI has to say so
    -- before the change is applied.
    ADD COLUMN IF NOT EXISTS currency CHAR(3) NOT NULL DEFAULT 'USD'
        CHECK (currency ~ '^[A-Z]{3}$'),

    -- Storefront catalogue paging, replacing productsPerPage.
    ADD COLUMN IF NOT EXISTS products_per_page INTEGER NOT NULL DEFAULT 12
        CHECK (products_per_page BETWEEN 1 AND 60),

    -- Defaults for a NEW product only.
    --
    -- These seed the create form. They are deliberately not applied to existing
    -- products: every product already carries its own value in its own column,
    -- and a settings change that silently re-flagged the whole catalogue as
    -- untracked would be a data loss event wearing a checkbox.
    ADD COLUMN IF NOT EXISTS default_product_active BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS default_track_inventory BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS default_allow_backorders BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS default_low_stock_threshold INTEGER NOT NULL DEFAULT 0
        CHECK (default_low_stock_threshold >= 0);

-- ---------------------------------------------------------------------------
-- Settings audit trail
--
-- order_activity records what happened to an order. Nothing recorded what
-- happened to the store's configuration, so a tax rate could change between two
-- orders with no trace of who changed it or what it was before.
--
-- Modelled on order_activity deliberately, down to denormalising the actor's
-- name at write time so history stays readable after a staff account is renamed
-- or removed.
--
-- NEVER WRITE A SECRET HERE.
--
-- Only the non-sensitive, database-backed settings above are ever recorded.
-- Session keys, R2 credentials and the database URL live in environment
-- variables, are never editable from the admin, and therefore never produce a
-- row in this table. The values are stored as text because that is what a
-- human-readable audit line needs; they are a record of a change, not a second
-- copy of the configuration to read settings back from.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS settings_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Who made the change. NULL survives the deletion of a staff account;
    -- actor_name keeps the entry readable when it does.
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_name VARCHAR(255) NOT NULL,

    -- Which setting, in the same snake_case the admin form and the page props
    -- use, so a log line can be traced to a field without a lookup table.
    setting_key VARCHAR(100) NOT NULL,

    -- Rendered values, exactly as they were shown. A boolean is 'true'/'false'
    -- and a missing value is the empty string, so "set for the first time" and
    -- "cleared" are both legible.
    previous_value TEXT NOT NULL,
    new_value TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The log is read newest-first, store-wide, and filtered by setting when
-- tracing one value's history.
CREATE INDEX IF NOT EXISTS idx_settings_activity_created ON settings_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_settings_activity_key ON settings_activity(setting_key, created_at DESC);
