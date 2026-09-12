import { Link } from "@inertiajs/react";

import { formatMoney } from "../../../lib/money";
import DashboardCard from "./DashboardCard";
import { formatCount, share } from "./dashboardFormat";

/**
 * Who bought, and whether they had bought before.
 *
 * "New" and "returning" are decided by the server from orders.user_id — the
 * store's own account identity, the same one the Customers page and the
 * lifetime-value card use. A buyer is returning if they have any earlier
 * non-cancelled order at all, from any time before the window, not merely
 * earlier within it.
 *
 * Nothing here infers identity from an email address. The store has no guest
 * checkout — every order is attached to an account — so there is also no guest
 * figure to show, and none is invented.
 */
export default function CustomerMix({ customers, period, currency = "USD" }) {
  const newBuyers = Number(customers?.new_buyers) || 0;
  const returning = Number(customers?.returning_buyers) || 0;
  const total = newBuyers + returning;
  const top = customers?.top || [];

  return (
    <DashboardCard
      title="Customers"
      description={`Who bought in ${(period?.label || "this period").toLowerCase()}`}
      href="/admin/customers"
      actionLabel="View customers"
    >
      {total === 0 ? (
        <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          Nobody bought anything in this period.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-600">First-time</p>
              <p className="mt-0.5 text-xl font-semibold tabular-nums text-gray-900">
                {formatCount(newBuyers)}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {share(newBuyers, total).toFixed(0)}% of buyers
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-600">Returning</p>
              <p className="mt-0.5 text-xl font-semibold tabular-nums text-gray-900">
                {formatCount(returning)}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {share(returning, total).toFixed(0)}% of buyers
              </p>
            </div>
          </div>

          <div
            className="mt-3 flex h-2 overflow-hidden rounded-full bg-gray-100"
            role="img"
            aria-label={`${newBuyers} first-time and ${returning} returning buyers`}
          >
            <div
              className="bg-sky-400"
              style={{ width: `${share(newBuyers, total)}%` }}
            />
            <div
              className="bg-indigo-500"
              style={{ width: `${share(returning, total)}%` }}
            />
          </div>

          {top.length > 0 && (
            <>
              <h4 className="mt-5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Highest spend
              </h4>
              <ul className="mt-2 divide-y divide-gray-100">
                {top.map((customer) => (
                  <li key={customer.id}>
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="flex items-center justify-between gap-3 py-2 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {customer.name}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {formatCount(customer.order_count)} order
                          {Number(customer.order_count) === 1 ? "" : "s"}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-medium tabular-nums text-gray-900">
                        {formatMoney(customer.revenue, currency)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </DashboardCard>
  );
}
