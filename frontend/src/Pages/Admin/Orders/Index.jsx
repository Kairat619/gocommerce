import { Head, Link } from "@inertiajs/react";
import AdminLayout from "../../../Layouts/AdminLayout";
import Pagination from "../../../Components/Pagination";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statuses = ["", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export default function AdminOrdersIndex({ orders, status, pagination }) {
  return (
    <AdminLayout title="Orders">
      <Head title="Admin Orders" />

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">All Orders</h2>
        <div className="flex gap-2">
          {statuses.map((s) => (
            <Link
              key={s}
              href={s ? `/admin/orders?status=${s}` : "/admin/orders"}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${status === s || (!status && !s) ? "bg-indigo-600 text-white" : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"}`}
            >
              {s || "All"}
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-xs text-gray-500">{order.id.slice(0, 8)}...</td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                  <p className="text-xs text-gray-500">{order.customer_email}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{order.created_at}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">${order.total}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[order.status] || "bg-gray-100 text-gray-800"}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm">
                  <Link href={`/admin/orders/${order.id}`} className="font-medium text-indigo-600 hover:text-indigo-500">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <Pagination pagination={pagination} searchParams={status ? { status } : {}} />
      </div>
    </AdminLayout>
  );
}
