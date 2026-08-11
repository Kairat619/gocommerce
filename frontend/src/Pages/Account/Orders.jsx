import { Head, Link } from "@inertiajs/react";
import StoreLayout from "../../Components/StoreLayout";
import Pagination from "../../Components/Pagination";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AccountOrders({ orders, pagination }) {
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

        {orders.length === 0 ? (
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
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-mono text-sm text-gray-500">
                        #{order.id.slice(0, 8)}...
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          statusColors[order.status] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {order.created_at}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      ${order.total}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Pagination pagination={pagination} />
        </div>
      </div>
    </StoreLayout>
  );
}
