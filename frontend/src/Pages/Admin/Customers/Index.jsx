import { Head, Link } from "@inertiajs/react";
import AdminLayout from "../../../Layouts/AdminLayout";
import Pagination from "../../../Components/Pagination";

export default function AdminCustomersIndex({ customers, pagination }) {
  return (
    <AdminLayout title="Customers">
      <Head title="Admin Customers" />

      <h2 className="mb-6 text-lg font-semibold text-gray-900">All Customers</h2>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-600">
                      {customer.name?.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{customer.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{customer.email}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{customer.created_at}</td>
                <td className="px-6 py-4 text-right text-sm">
                  <Link href={`/admin/customers/${customer.id}`} className="font-medium text-indigo-600 hover:text-indigo-500">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <Pagination pagination={pagination} />
      </div>
    </AdminLayout>
  );
}
