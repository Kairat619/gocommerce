import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import AdminLayout from "../../../Layouts/AdminLayout";

export default function AdminCategoriesCreate() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    image_url: "",
    sort_order: "0",
    is_active: true,
  });
  const [processing, setProcessing] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setProcessing(true);
    router.post("/admin/categories", form, { onFinish: () => setProcessing(false) });
  }

  function update(field, value) {
    setForm({ ...form, [field]: value });
  }

  return (
    <AdminLayout title="Create Category">
      <Head title="Create Category" />

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Name *</label>
              <input type="text" required value={form.name} onChange={(e) => update("name", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Image URL</label>
                <input type="url" value={form.image_url} onChange={(e) => update("image_url", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Sort Order</label>
                <input type="number" value={form.sort_order} onChange={(e) => update("sort_order", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => update("is_active", e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              Active
            </label>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={processing} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
            {processing ? "Creating..." : "Create Category"}
          </button>
          <a href="/admin/categories" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </a>
        </div>
      </form>
    </AdminLayout>
  );
}
