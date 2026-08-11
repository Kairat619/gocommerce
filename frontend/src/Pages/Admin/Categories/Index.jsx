import { Head, Link, router } from "@inertiajs/react";
import AdminLayout from "../../../Layouts/AdminLayout";

export default function AdminCategoriesIndex({ categories }) {
  function deleteCategory(id) {
    if (confirm("Are you sure you want to delete this category?")) {
      router.post(`/admin/categories/${id}/delete`);
    }
  }

  return (
    <AdminLayout title="Categories">
      <Head title="Admin Categories" />

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">All Categories</h2>
        <Link href="/admin/categories/create" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
          Add Category
        </Link>
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{cat.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{cat.slug}</td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{cat.description || "—"}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{cat.sort_order}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cat.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                    {cat.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm">
                  <Link href={`/admin/categories/${cat.id}/edit`} className="font-medium text-indigo-600 hover:text-indigo-500">Edit</Link>
                  <button onClick={() => deleteCategory(cat.id)} className="ml-4 font-medium text-red-600 hover:text-red-500">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
