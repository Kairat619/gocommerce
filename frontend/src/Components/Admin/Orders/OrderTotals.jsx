import FormCard from "../Form/FormCard";
import { formatMoney } from "../../../lib/money";

function Row({ label, value, tone = "", hint }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={`text-sm ${tone || "text-gray-500"}`}>
        {label}
        {hint && <span className="ml-1 text-xs text-gray-400">{hint}</span>}
      </dt>
      <dd className={`text-sm tabular-nums ${tone || "text-gray-900"}`}>{value}</dd>
    </div>
  );
}

/**
 * The money.
 *
 * Every figure is displayed exactly as the order recorded it. Nothing here is
 * recomputed — the checkout engine settled these numbers when the order was
 * placed, and an admin screen that re-derived them could disagree with the
 * customer's receipt.
 *
 * There is no payment record in this application, so this card states what was
 * owed. What was actually collected is not something the system knows.
 */
export default function OrderTotals({ order, currency }) {
  const discount = Number(order.discount || 0);
  const shipping = Number(order.shipping_cost || 0);

  return (
    <FormCard title="Payment summary">
      <dl className="space-y-2.5">
        <Row label="Subtotal" value={formatMoney(order.subtotal, currency)} />

        {discount > 0 && (
          <Row
            label="Discount"
            hint={order.coupon_code ? `· ${order.coupon_code}` : undefined}
            value={`−${formatMoney(order.discount, currency)}`}
            tone="text-green-700"
          />
        )}

        <Row
          label="Shipping"
          value={shipping === 0 ? "Free" : formatMoney(order.shipping_cost, currency)}
        />
        <Row label="Tax" value={formatMoney(order.tax, currency)} />

        <div className="flex items-baseline justify-between gap-3 border-t border-gray-200 pt-2.5">
          <dt className="text-base font-semibold text-gray-900">Total</dt>
          <dd className="text-base font-semibold tabular-nums text-gray-900">
            {formatMoney(order.total, currency)}
          </dd>
        </div>
      </dl>

      <p className="mt-3 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
        Amounts are as recorded when the order was placed. This application does not record
        payments or refunds, so settlement is tracked in your payment provider.
      </p>
    </FormCard>
  );
}
