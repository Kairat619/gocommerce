import { Head, Link } from "@inertiajs/react";
import AdminLayout from "../../../Layouts/AdminLayout";
import OrderStatus from "../../../Components/Commerce/OrderStatus";
import { shortOrderId } from "../../../lib/order";

/** @param {import('../../../types/pages').AdminCustomerShowProps} props */
export default function AdminCustomersShow({ customer, orders }) {
  return (
    <AdminLayout title="Customer Details">
      <Head title={customer.name} />

      <div className="mb-6">
        <Link href="/admin/customers" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          ← Back to Customers
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="flex items-center gap-4 mb-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-medium text-indigo-600">
                {customer.name?.charAt(0).toUpperCase()}
              </span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                <p className="text-sm text-gray-500">{customer.email}</p>
              </div>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Role</dt>
                <dd className="capitalize text-gray-900">{customer.role}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Joined</dt>
                <dd className="text-gray-900">{customer.created_at}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Recent Orders</h3>
            {orders.length === 0 ? (
              <p className="text-sm text-gray-500">No orders yet.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{shortOrderId(order.id)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{order.created_at}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">${order.total}</td>
                      <td className="px-4 py-3">
                        <OrderStatus status={order.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
