import { Link } from "@inertiajs/react";

import { formatMoney } from "../../../lib/money";
import DashboardCard from "./DashboardCard";
import { formatCount } from "./dashboardFormat";

/**
 * What the discounts bought.
 *
 * Read from `coupon_redemptions` — the recorded fact of a coupon being applied
 * to an order, together with the discount it actually granted — joined to
 * orders under the same non-cancelled rule as revenue. A coupon on a cancelled
 * order stops counting at exactly the moment that order stops counting.
 *
 * The list is ordered by revenue driven, not by discount given. The biggest
 * giveaway is not automatically the best campaign, and ranking by discount
 * would put the store's worst-performing coupon at the top of the card.
 *
 * "Live" means a coupon the checkout would accept this second: enabled,
 * started, not expired and not used up — the same four clauses as
 * couponLifecycle() in the Go handler and the validator in service/coupon.go.
 */
export default function PromotionSummary({ promotions, period, currency = "USD" }) {
  const redemptions = Number(promotions?.redemptions) || 0;
  const live = Number(promotions?.live_coupons) || 0;
  const top = promotions?.top || [];

  return (
    <DashboardCard
      title="Promotions"
      description={`Coupon use in ${(period?.label || "this period").toLowerCase()}`}
      href="/admin/coupons"
      actionLabel="Manage coupons"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-600">Discount given</p>
          <p className="mt-0.5 text-xl font-semibold tabular-nums text-gray-900">
            {formatMoney(promotions?.discount_total ?? "0.00", currency)}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            over {formatCount(redemptions)} redemption
            {redemptions === 1 ? "" : "s"}
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-600">Revenue on those orders</p>
          <p className="mt-0.5 text-xl font-semibold tabular-nums text-gray-900">
            {formatMoney(promotions?.revenue ?? "0.00", currency)}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            across {formatCount(promotions?.orders)} order
            {Number(promotions?.orders) === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        <span className="font-medium text-gray-700">{formatCount(live)}</span>{" "}
        coupon{live === 1 ? "" : "s"} redeemable right now
      </p>

      {top.length === 0 ? (
        <p className="mt-4 rounded-lg bg-gray-50 px-3 py-4 text-center text-sm text-gray-500">
          No coupon was redeemed in this period.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-gray-100">
          {top.map((coupon) => (
            <li key={coupon.id}>
              <Link
                href={`/admin/coupons/${coupon.id}/edit`}
                className="flex items-center justify-between gap-3 py-2.5 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2">
                    <span className="truncate font-mono text-sm font-medium text-gray-900">
                      {coupon.code}
                    </span>
                    {!coupon.is_active && (
                      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        Disabled
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {formatCount(coupon.redemptions)} use
                    {Number(coupon.redemptions) === 1 ? "" : "s"} ·{" "}
                    {formatMoney(coupon.discount_total, currency)} discounted
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium tabular-nums text-gray-900">
                  {formatMoney(coupon.revenue, currency)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
