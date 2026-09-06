import { Link } from "@inertiajs/react";

import OrderStatus from "../../Commerce/OrderStatus";
import { formatMoney } from "../../../lib/money";
import { shortOrderId } from "../../../lib/order";
import { formatDate, relativeTime } from "./orderLifecycle";

/**
 * The orders list.
 *
 * A table on desktop, stacked cards on small screens — a six-column operational
 * table squeezed onto a phone is unreadable, and support staff do use phones.
 * Both render the same rows from the same props.
 */
export default function OrdersTable({ orders = [], currency = "USD" }) {
  if (orders.length === 0) return null;

  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 md:block">
        <table className="min-w-full divide-y divide-gray-200">
          <caption className="sr-only">Orders, newest first unless another sort is chosen</caption>
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">
                Order
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Customer
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Placed
              </th>
              <th scope="col" className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 lg:table-cell">
                Items
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">
                Total
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 sm:px-6">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-mono text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    #{shortOrderId(order.id)}
                  </Link>
                  {order.coupon_code && (
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      <span className="font-mono">{order.coupon_code}</span>
                    </p>
                  )}
                </td>

                <td className="px-4 py-3">
                  <p className="truncate text-sm font-medium text-gray-900">{order.customer_name}</p>
                  <p className="truncate text-xs text-gray-500">{order.customer_email}</p>
                </td>

                <td className="whitespace-nowrap px-4 py-3">
                  <p className="text-sm text-gray-900">{formatDate(order.created_at)}</p>
                  <p className="text-xs text-gray-500">{relativeTime(order.created_at)}</p>
                </td>

                <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-600 lg:table-cell">
                  {order.item_count} item{Number(order.item_count) === 1 ? "" : "s"}
                </td>

                <td className="whitespace-nowrap px-4 py-3">
                  <OrderStatus status={order.status} />
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-right sm:px-6">
                  <p className="text-sm font-medium text-gray-900">
                    {formatMoney(order.total, currency)}
                  </p>
                  {Number(order.discount) > 0 && (
                    <p className="text-xs text-green-700">
                      −{formatMoney(order.discount, currency)}
                    </p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <ul className="space-y-3 md:hidden">
        {orders.map((order) => (
          <li key={order.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
            <div className="flex items-start justify-between gap-3">
              <Link
                href={`/admin/orders/${order.id}`}
                className="font-mono text-sm font-medium text-indigo-600"
              >
                #{shortOrderId(order.id)}
              </Link>
              <OrderStatus status={order.status} />
            </div>

            <p className="mt-2 truncate text-sm font-medium text-gray-900">{order.customer_name}</p>
            <p className="truncate text-xs text-gray-500">{order.customer_email}</p>

            <div className="mt-3 flex items-end justify-between gap-3 border-t border-gray-100 pt-3">
              <div>
                <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                <p className="text-xs text-gray-500">
                  {order.item_count} item{Number(order.item_count) === 1 ? "" : "s"}
                </p>
              </div>
              <p className="text-base font-semibold text-gray-900">
                {formatMoney(order.total, currency)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
