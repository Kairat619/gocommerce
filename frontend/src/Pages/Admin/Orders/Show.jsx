import { Head, Link, router, usePage } from "@inertiajs/react";
import AdminLayout from "../../../Layouts/AdminLayout";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export default function AdminOrdersShow({ order, items }) {
  const { flash } = usePage().props;

  function updateStatus(status) {
    router.post(`/admin/orders/${order.id}/status`, { status });
  }

  return (
    <AdminLayout title="Order Details">
      <Head title={`Order #${order.id.slice(0, 8)}...`} />

      <div className="mb-6">
        <Link href="/admin/orders" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          ← Back to Orders
        </Link>
      </div>

      {flash?.success && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-700">{flash.success}</div>
      )}
      {flash?.error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{flash.error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Order Info</h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Order ID</dt>
                <dd className="font-mono text-xs text-gray-900">{order.id}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Date</dt>
                <dd className="text-gray-900">{order.created_at}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Customer</dt>
                <dd className="text-gray-900">{order.shipping_name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Total</dt>
                <dd className="text-lg font-bold text-gray-900">${order.total}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Items</h3>
            <ul className="divide-y divide-gray-200">
              {items.map((item, i) => (
                <li key={i} className="flex justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity} × ${item.unit_price}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">${item.total}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Status</h3>
            <div className="mb-4">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize ${statusColors[order.status] || "bg-gray-100 text-gray-800"}`}>
                {order.status}
              </span>
            </div>
            <div className="space-y-2">
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={s === order.status}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium capitalize ${s === order.status ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-100"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Shipping</h3>
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900">{order.shipping_name}</p>
              <p>{order.shipping_address}</p>
              <p>{order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}</p>
              <p>{order.shipping_country}</p>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>${order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax</span>
                <span>${order.tax}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span>{order.shipping_cost === "0.00" ? "Free" : `$${order.shipping_cost}`}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">${order.total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
