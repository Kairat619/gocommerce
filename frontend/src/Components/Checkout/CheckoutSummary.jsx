import { Link } from "@inertiajs/react";
import Icon from "../UI/Icon";
import { formatLineTotal, formatMoney } from "../../lib/money";

/**
 * The marketplace checkout summary: line items, applied code, the server's
 * totals and the place-order button.
 *
 * The figures come from `totals` (service.ComputeTotals, the function the
 * order is charged from), so this only renders them.
 *
 * @param {Object} props
 * @param {import('../../types/commerce').CartItem[]} props.items
 * @param {number} props.subtotal
 * @param {number} props.discount
 * @param {number} props.tax
 * @param {number} props.taxRate      a fraction, 0.0825 = 8.25%
 * @param {number} props.shipping     0 means free
 * @param {number} props.total
 * @param {import('../../types/commerce').AppliedCoupon|null} props.coupon
 * @param {boolean} props.processing
 */
export default function CheckoutSummary({
  items,
  subtotal,
  discount,
  tax,
  taxRate,
  shipping,
  total,
  coupon,
  processing,
}) {
  const itemCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const taxPercent = Number((taxRate * 100).toFixed(2));

  return (
    <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm lg:sticky lg:top-32">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-ink">Order Summary</h2>
        <Link
          href="/cart"
          className="rounded text-[13px] font-bold text-accent hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Edit Cart ({itemCount})
        </Link>
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.product_id} className="flex gap-3">
            <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
              {item.image_url ? (
                <img src={item.image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <Icon name="bag" className="h-6 w-6 text-outline" />
              )}
              <span className="absolute left-0.5 top-0.5 rounded bg-white/90 px-1 text-[10px] font-bold text-ink">
                {item.quantity}×
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 text-[13px] font-semibold leading-5 text-ink">{item.name}</span>
              <span className="text-[13px] font-bold text-ink">
                {formatLineTotal(item.price, item.quantity)}
              </span>
            </span>
          </li>
        ))}
      </ul>

      {coupon && (
        <p className="flex items-center justify-between rounded-lg bg-surface-container px-3 py-2 text-[13px]">
          <span className="flex items-center gap-2 font-bold text-ink">
            <Icon name="tag" className="h-4 w-4 text-accent" />
            <span className="font-mono">{coupon.code}</span>
          </span>
          <span className="font-semibold text-green-700">
            {coupon.free_shipping ? "Free shipping" : `-${formatMoney(discount)} applied`}
          </span>
        </p>
      )}

      <dl className="space-y-2 border-t border-muted pt-4 text-[13px]">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Items subtotal</dt>
          <dd className="font-semibold text-ink">{formatMoney(subtotal)}</dd>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <dt className="text-green-700">Coupon{coupon?.code ? ` (${coupon.code})` : ""}</dt>
            <dd className="font-semibold text-green-700">-{formatMoney(discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Shipping</dt>
          <dd className={shipping === 0 ? "font-bold text-green-700" : "font-semibold text-ink"}>
            {shipping === 0 ? "FREE" : formatMoney(shipping)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Tax{taxPercent > 0 ? ` (${taxPercent}%)` : ""}</dt>
          <dd className="font-semibold text-ink">{formatMoney(tax)}</dd>
        </div>
      </dl>

      {discount > 0 && (
        <p className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 text-[13px] font-bold text-green-800">
          <span>Total savings</span>
          <span>{formatMoney(discount)}</span>
        </p>
      )}

      <div className="flex items-end justify-between border-t border-muted pt-4">
        <div>
          <p className="text-base font-extrabold text-ink">Total Amount</p>
          <p className="text-[11px] text-muted-foreground">Including tax and shipping</p>
        </div>
        <p className="text-3xl font-extrabold tracking-tight text-accent">{formatMoney(total)}</p>
      </div>

      <button
        type="submit"
        disabled={processing}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 text-base font-bold text-white shadow-sm transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-60"
      >
        <Icon name="lock" className="h-5 w-5" />
        {processing ? "Placing your order…" : `Place Your Order · ${formatMoney(total)}`}
      </button>
      <p className="text-center text-[11px] leading-4 text-muted-foreground">
        By placing this order you agree to the store's terms of sale.
      </p>
    </div>
  );
}
