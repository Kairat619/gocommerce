import { Head, Link } from "@inertiajs/react";
import StoreLayout from "../../Components/StoreLayout";
import Pagination from "../../Components/Pagination";
import OrderStatus from "../../Components/Commerce/OrderStatus";
import { formatMoney } from "../../lib/money";
import { shortOrderId } from "../../lib/order";
import { asList, asPagination } from "../../lib/props";

/** @param {import('../../types/pages').AccountOrdersProps} props */
export default function AccountOrders({ orders, pagination }) {
  const rows = asList(orders);
  const pages = asPagination(pagination);

  return (
    <StoreLayout>
      <Head title="Order History" />

      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
          <Link
            href="/account"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            ← Back to Account
          </Link>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
            <p className="text-lg text-gray-500">You haven't placed any orders yet.</p>
            <Link
              href="/products"
              className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-mono text-sm text-gray-500">
                        #{shortOrderId(order.id)}
                      </p>
                      <OrderStatus status={order.status} size="md" />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {order.created_at}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {formatMoney(order.total)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Pagination pagination={pages} />
        </div>
      </div>
    </StoreLayout>
  );
}
