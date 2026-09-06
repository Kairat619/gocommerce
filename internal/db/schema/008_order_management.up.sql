-- Order management: an audit trail for orders.
--
-- Orders are financial records, and until now nothing recorded what happened to
-- one. `orders.status` held the current state and no history at all, so a
-- support question like "when was this shipped, and by whom?" was unanswerable.
--
-- One table serves both the timeline and admin notes, because a note *is* an
-- event in the order's history and belongs in the same chronology as the status
-- changes around it. That is also how the reference implementation models it.
--
-- Nothing here changes an existing table. Orders, order_items, totals,
-- addresses, coupon_code and the customer's checkout note are all untouched, so
-- every historical order keeps exactly the record it already had.

CREATE TABLE order_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

    -- Who performed it. NULL means the system or the customer rather than a
    -- member of staff — an order placed at checkout has no admin actor.
    -- ON DELETE SET NULL because deleting a staff account must never rewrite
    -- financial history.
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Denormalised on purpose: the actor's name as it was at the time. An audit
    -- trail that changes when someone is renamed or removed is not an audit
    -- trail. Empty string for system events.
    actor_name VARCHAR(255) NOT NULL DEFAULT '',

    kind VARCHAR(32) NOT NULL
        CHECK (kind IN ('created', 'status_changed', 'note', 'stock_restored')),

    -- Human-readable summary, written once and never recomputed.
    message TEXT NOT NULL,

    -- Populated for 'status_changed' only, so the timeline can render the
    -- transition without parsing the message.
    from_status order_status,
    to_status order_status,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_activity_order ON order_activity(order_id, created_at DESC);

-- Seed one 'created' event per existing order.
--
-- This is derived from orders.created_at, which is a real recorded timestamp —
-- not an invented event. Status changes are deliberately NOT backfilled: those
-- timestamps were never recorded, so inventing them would put fiction into an
-- audit trail. An order predating this migration therefore shows its creation
-- and then nothing until its next real change, which is the truth.
INSERT INTO order_activity (order_id, user_id, actor_name, kind, message, created_at)
SELECT o.id, NULL, '', 'created', 'Order placed.', o.created_at
FROM orders o;
