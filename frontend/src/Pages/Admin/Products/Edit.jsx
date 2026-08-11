import { Head, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import AdminLayout from "../../../Layouts/AdminLayout";

export default function AdminProductsEdit({ product, categories }) {
  const { flash } = usePage().props;
  const [form, setForm] = useState({
    name: product.name || "",
    description: product.description || "",
    price: product.price || "",
    compare_at_price: product.compare_at_price || "",
    sku: product.sku || "",
    barcode: product.barcode || "",
    image_url: product.image_url || "",
    category_id: product.category_id || "",
    stock_quantity: product.stock_quantity || 0,
    weight: product.weight || "",
    is_active: product.is_active || false,
    is_featured: product.is_featured || false,
    meta_title: product.meta_title || "",
    meta_description: product.meta_description || "",
  });
  const [processing, setProcessing] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setProcessing(true);
    router.post(`/admin/products/${product.id}`, form, { onFinish: () => setProcessing(false) });
  }

  function update(field, value) {
    setForm({ ...form, [field]: value });
  }

  return (
    <AdminLayout title="Edit Product">
      <Head title={`Edit ${product.name}`} />

      {flash?.error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{flash.error}</div>
      )}

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Basic Info</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Name *</label>
              <input type="text" required value={form.name} onChange={(e) => update("name", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <textarea rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Category *</label>
                <select required value={form.category_id} onChange={(e) => update("category_id", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Image URL</label>
                <input type="url" value={form.image_url} onChange={(e) => update("image_url", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Pricing & Inventory</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Price *</label>
              <input type="number" step="0.01" required value={form.price} onChange={(e) => update("price", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Compare at Price</label>
              <input type="number" step="0.01" value={form.compare_at_price} onChange={(e) => update("compare_at_price", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Stock *</label>
              <input type="number" required value={form.stock_quantity} onChange={(e) => update("stock_quantity", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">SKU</label>
              <input type="text" value={form.sku} onChange={(e) => update("sku", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Barcode</label>
              <input type="text" value={form.barcode} onChange={(e) => update("barcode", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Weight</label>
              <input type="number" step="0.01" value={form.weight} onChange={(e) => update("weight", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Options</h3>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => update("is_active", e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => update("is_featured", e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              Featured
            </label>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={processing} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
            {processing ? "Saving..." : "Save Changes"}
          </button>
          <a href="/admin/products" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </a>
        </div>
      </form>
    </AdminLayout>
  );
}
