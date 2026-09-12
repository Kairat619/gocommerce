import { Link } from "@inertiajs/react";

import { statusLabel } from "../Orders/orderLifecycle";
import DashboardCard from "./DashboardCard";
import { formatCount, share } from "./dashboardFormat";

/**
 * Where this period's orders ended up.
 *
 * Drawn as a stacked bar plus a legend rather than a pie: comparing slice
 * angles is a worse way to read six proportions than comparing lengths against
 * a shared baseline, and the legend has to carry the exact counts anyway.
 *
 * Every status is listed even at zero. A distribution with statuses missing
 * reads as a smaller store rather than a quieter one, and "cancelled: 0" is
 * information the merchant wants.
 *
 * Unlike the money figures, this one counts cancelled orders — showing how many
 * fell out is the entire point of the breakdown.
 */

// The bar segments. Tailwind cannot see class names built at runtime, so the
// solid fills are spelled out here rather than derived from orderStatusTone,
// which returns the pale pill backgrounds used in the legend.
const segmentFills = {
  pending: "bg-yellow-400",
  confirmed: "bg-blue-400",
  processing: "bg-indigo-400",
  shipped: "bg-purple-400",
  delivered: "bg-green-500",
  cancelled: "bg-red-400",
};

export default function OrderHealth({ orderStatus, period }) {
  const total = Number(orderStatus?.total) || 0;
  const breakdown = orderStatus?.breakdown || [];

  return (
    <DashboardCard
      title="Order health"
      description={`Every order placed in ${lowerFirst(
        period?.label || "this period"
      )}, by status`}
      href="/admin/orders"
      actionLabel="Manage orders"
    >
      {total === 0 ? (
        <p className="rounded-lg bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
          No orders were placed in this period.
        </p>
      ) : (
        <>
          <p className="text-2xl font-semibold tabular-nums text-gray-900">
            {formatCount(total)}
            <span className="ml-1.5 text-sm font-normal text-gray-500">
              order{total === 1 ? "" : "s"}
            </span>
          </p>

          <div
            className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-gray-100"
            role="img"
            aria-label={breakdown
              .filter((entry) => Number(entry.count) > 0)
              .map(
                (entry) =>
                  `${statusLabel(entry.status)} ${formatCount(entry.count)}`
              )
              .join(", ")}
          >
            {breakdown.map((entry) => {
              const percent = share(entry.count, total);
              if (percent <= 0) return null;
              return (
                <div
                  key={entry.status}
                  className={segmentFills[entry.status] || "bg-gray-300"}
                  style={{ width: `${percent}%` }}
                />
              );
            })}
          </div>

          <ul className="mt-4 space-y-1.5">
            {breakdown.map((entry) => {
              const count = Number(entry.count) || 0;
              return (
                <li key={entry.status}>
                  <Link
                    href={`/admin/orders?status=${entry.status}`}
                    className="group flex items-center justify-between gap-3 rounded-lg px-2 py-1 text-sm hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                          segmentFills[entry.status] || "bg-gray-300"
                        }`}
                      />
                      <span className="truncate text-gray-700 group-hover:text-gray-900">
                        {statusLabel(entry.status)}
                      </span>
                    </span>
                    <span className="shrink-0 tabular-nums text-gray-500">
                      <span className="font-medium text-gray-900">
                        {formatCount(count)}
                      </span>
                      <span className="ml-1.5 text-xs">
                        {share(count, total).toFixed(0)}%
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </DashboardCard>
  );
}

/** "Last 30 days" reads better mid-sentence as "last 30 days". */
function lowerFirst(text) {
  return text.charAt(0).toLowerCase() + text.slice(1);
}
