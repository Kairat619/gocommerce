import { Link } from "@inertiajs/react";

import OrderStatus from "../../Commerce/OrderStatus";
import { formatMoney } from "../../../lib/money";
import { shortOrderId } from "../../../lib/order";
import { relativeTime } from "../Orders/orderLifecycle";
import DashboardCard from "./DashboardCard";

/**
 * The last few orders placed.
 *
 * Rendered with OrderStatus, shortOrderId and relativeTime — the same pieces
 * the orders list and the order detail page use — so an order looks and reads
 * identically wherever the merchant meets it, and a change to the status
 * palette lands everywhere at once.
 *
 * Not period-scoped: "recent" means recent. The period filter governs the
 * analytics, and an empty last-7-days view should still show the merchant that
 * orders exist.
 */
export default function RecentOrders({ orders = [], currency = "USD" }) {
  return (
    <DashboardCard
      title="Recent orders"
      description="The five most recent orders, newest first"
      href="/admin/orders"
      actionLabel="View all orders"
      flush
    >
      {orders.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-gray-500">
          No orders have been placed yet. Orders from the storefront appear here
          as they arrive.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 border-t border-gray-100">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/admin/orders/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-medium text-indigo-600">
                      #{shortOrderId(order.id)}
                    </span>
                    <OrderStatus status={order.status} />
                    {order.coupon_code && (
                      <span className="font-mono text-xs text-gray-500">
                        {order.coupon_code}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    {order.customer_name} · {relativeTime(order.created_at)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium tabular-nums text-gray-900">
                  {formatMoney(order.total, currency)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
