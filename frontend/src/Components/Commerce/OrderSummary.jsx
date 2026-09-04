import { formatMoney, formatLineTotal } from "../../lib/money";

/**
 * The checkout order summary: the lines, then the arithmetic.
 *
 * The totals are computed by the caller from the rates the server sent
 * (`tax_rate` as a fraction, `shipping_cost`, `free_shipping_threshold`) and
 * must stay in agreement with what the Go order service will charge. This
 * component only renders them.
 *
 * @param {Object} props
 * @param {import('../../types/commerce').CartItem[]} props.items
 * @param {number} props.subtotal
 * @param {number} props.tax
 * @param {number} props.shipping   0 means free
 * @param {number} props.total
 * @param {number} props.freeShippingThreshold
 * @param {React.ReactNode} [props.children] the submit button
 */
export default function OrderSummary({
  items,
  subtotal,
  tax,
  shipping,
  total,
  freeShippingThreshold,
  children,
}) {
  const remainingForFreeShipping = freeShippingThreshold - subtotal;

  return (
    <div className="sticky top-24 border border-ink/10 bg-white p-6">
      <h2 className="text-label-lg font-semibold uppercase tracking-[0.1em] text-ink">
        Order Summary
      </h2>

      <ul className="mt-5 divide-y divide-ink/10 border-y border-ink/10">
        {items.map((item) => (
          <li key={item.product_id} className="flex justify-between gap-4 py-3">
            <div className="flex-1">
              <p className="text-body-sm text-ink">{item.name}</p>
              <p className="mt-0.5 text-label-sm text-outline">
                Qty: {item.quantity}
              </p>
            </div>
            <p className="whitespace-nowrap text-body-sm font-medium text-ink">
              {formatLineTotal(item.price, item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <dl className="mt-5 space-y-2.5 text-body-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="font-medium text-ink">{formatMoney(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Tax</dt>
          <dd className="font-medium text-ink">{formatMoney(tax)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Shipping</dt>
          <dd className="font-medium text-ink">
            {shipping === 0 ? (
              <span className="text-green-700">Free</span>
            ) : (
              formatMoney(shipping)
            )}
          </dd>
        </div>
      </dl>

      {remainingForFreeShipping > 0 && (
        <p className="mt-3 text-label-sm text-accent">
          Add {formatMoney(remainingForFreeShipping)} more for free shipping.
        </p>
      )}

      <div className="mt-5 flex items-baseline justify-between border-t border-ink/10 pt-4">
        <span className="text-label-lg font-semibold uppercase tracking-[0.1em] text-ink">
          Total
        </span>
        <span className="text-headline-md font-semibold text-ink">
          {formatMoney(total)}
        </span>
      </div>

      {children}
    </div>
  );
}
