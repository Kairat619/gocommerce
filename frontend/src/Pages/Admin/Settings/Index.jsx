import { Head, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import AdminLayout from "../../../Layouts/AdminLayout";

export default function AdminSettingsIndex({ settings }) {
  const { flash, errors } = usePage().props;
  const [form, setForm] = useState({
    tax_rate_percent: settings.tax_rate_percent ?? 0,
    shipping_cost: settings.shipping_cost ?? 0,
    free_shipping_threshold: settings.free_shipping_threshold ?? 0,
  });
  const [processing, setProcessing] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setProcessing(true);
    router.post("/admin/settings", form, {
      preserveScroll: true,
      onFinish: () => setProcessing(false),
    });
  }

  function update(field, value) {
    setForm({ ...form, [field]: value });
  }

  return (
    <AdminLayout title="Settings">
      <Head title="Store Settings" />

      {flash?.success && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-700">{flash.success}</div>
      )}
      {flash?.error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{flash.error}</div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Tax &amp; Shipping</h2>
          <p className="mt-1 text-sm text-gray-500">
            These values are applied to every order at checkout.
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tax Rate (%)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  value={form.tax_rate_percent}
                  onChange={(e) => update("tax_rate_percent", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-8 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-400">%</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Applied to the order subtotal. Example: 8 means an 8% tax.
              </p>
              {errors?.tax_rate_percent && (
                <p className="mt-1 text-xs text-red-600">{errors.tax_rate_percent}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Shipping Fee</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.shipping_cost}
                  onChange={(e) => update("shipping_cost", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pl-7 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Flat shipping fee charged per order.</p>
              {errors?.shipping_cost && (
                <p className="mt-1 text-xs text-red-600">{errors.shipping_cost}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Free Shipping Threshold
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.free_shipping_threshold}
                  onChange={(e) => update("free_shipping_threshold", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pl-7 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Orders with a subtotal at or above this amount ship free. Set to 0 to always charge
                shipping.
              </p>
              {errors?.free_shipping_threshold && (
                <p className="mt-1 text-xs text-red-600">{errors.free_shipping_threshold}</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={processing}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {processing ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
