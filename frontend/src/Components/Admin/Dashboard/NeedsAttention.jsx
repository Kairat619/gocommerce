import { Link } from "@inertiajs/react";

import OrderStatus from "../../Commerce/OrderStatus";
import { formatMoney } from "../../../lib/money";
import { shortOrderId } from "../../../lib/order";
import { relativeTime } from "../Orders/orderLifecycle";
import { formatCount } from "./dashboardFormat";

/**
 * What needs doing, right now.
 *
 * This is the one band of the dashboard that ignores the date filter, and that
 * is the point: an order that has sat unfulfilled since last month is exactly
 * the one a "last 7 days" view would hide. The heading says "right now" so the
 * exemption is visible rather than surprising.
 *
 * EVERY CONDITION HERE IS ONE THE BACKEND CAN ACTUALLY DETECT.
 *
 * There are no unpaid-order, failed-payment or failed-shipment alerts, however
 * useful those would be, because the schema records neither a payment state nor
 * a shipment: `orders.status` is the whole lifecycle. Inventing an alert that
 * cannot fire — or worse, one that fires on a guess — would cost the merchant
 * more than the missing feature does.
 *
 * What is real: the open backlog by stage, drawn straight from the status
 * enum, and how long each of those orders has been waiting, from its recorded
 * created_at.
 */
export default function NeedsAttention({ backlog, currency = "USD" }) {
  const awaiting = Number(backlog?.awaiting_fulfilment) || 0;
  const pending = Number(backlog?.pending) || 0;
  const inTransit = Number(backlog?.in_transit) || 0;
  const stalled = Number(backlog?.stalled) || 0;
  const stalledAfter = Number(backlog?.stalled_after_days) || 3;
  const orders = backlog?.orders || [];

  // A clear desk is worth saying out loud — the absence of this band would just
  // look like a section that failed to load.
  if (awaiting === 0 && inTransit === 0) {
    return (
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Nothing needs attention
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              No orders are waiting to be fulfilled or in transit.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-5 pb-4 pt-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            Needs attention
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Open orders across the whole store — not limited to the selected
            period
          </p>
        </div>
        <Link
          href="/admin/orders?status=pending"
          className="rounded text-xs font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          Work the queue
        </Link>
      </header>

      <div className="grid gap-3 px-5 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Awaiting fulfilment"
          value={awaiting}
          href="/admin/orders?status=processing"
          hint="Pending, confirmed or processing"
        />
        <Stat
          label="Not yet acknowledged"
          value={pending}
          href="/admin/orders?status=pending"
          hint="Still pending"
          urgent={pending > 0}
        />
        <Stat
          label={`Waiting over ${stalledAfter} days`}
          value={stalled}
          href="/admin/orders?status=pending&sort=oldest"
          hint="Open and ageing"
          urgent={stalled > 0}
        />
        <Stat
          label="In transit"
          value={inTransit}
          href="/admin/orders?status=shipped"
          hint="Shipped, not confirmed delivered"
        />
      </div>

      {orders.length > 0 && (
        <div className="mt-4 border-t border-gray-200">
          <h3 className="px-5 pt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Longest waiting
          </h3>
          <ul className="divide-y divide-gray-100">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-indigo-600">
                        #{shortOrderId(order.id)}
                      </span>
                      <OrderStatus status={order.status} />
                      {order.stalled && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          Ageing
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {order.customer_name} · {order.item_count} item
                      {Number(order.item_count) === 1 ? "" : "s"} ·{" "}
                      {relativeTime(order.created_at)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium tabular-nums text-gray-900">
                    {formatMoney(order.total, currency)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, hint, href, urgent = false }) {
  return (
    <Link
      href={href}
      className={`rounded-lg p-3 ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
        urgent
          ? "bg-amber-50 ring-amber-200 hover:ring-amber-300"
          : "bg-gray-50 ring-gray-200 hover:ring-indigo-300"
      }`}
    >
      <p className="text-xs font-medium text-gray-600">{label}</p>
      <p className="mt-0.5 text-xl font-semibold tabular-nums text-gray-900">
        {formatCount(value)}
      </p>
      <p className="mt-0.5 text-xs text-gray-500">{hint}</p>
    </Link>
  );
}
