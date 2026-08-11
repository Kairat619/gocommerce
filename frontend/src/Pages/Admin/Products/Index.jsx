import { Head, Link, router } from "@inertiajs/react";
import AdminLayout from "../../../Layouts/AdminLayout";
import Pagination from "../../../Components/Pagination";

export default function AdminProductsIndex({ products, pagination }) {
  function deleteProduct(id) {
    if (confirm("Are you sure you want to delete this product?")) {
      router.post(`/admin/products/${id}/delete`);
    }
  }

  return (
    <AdminLayout title="Products">
      <Head title="Admin Products" />

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">All Products</h2>
        <Link
          href="/admin/products/create"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Add Product
        </Link>
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {product.image_url ? (
                        <img src={product.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">📦</div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">SKU: {product.sku || "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{product.category_name}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">${product.price}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{product.stock_quantity}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${product.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                    {product.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm">
                  <Link href={`/admin/products/${product.id}/edit`} className="font-medium text-indigo-600 hover:text-indigo-500">
                    Edit
                  </Link>
                  <button onClick={() => deleteProduct(product.id)} className="ml-4 font-medium text-red-600 hover:text-red-500">
                    Delete
                  </button>
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
