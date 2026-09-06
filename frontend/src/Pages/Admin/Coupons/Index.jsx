import { Head, Link, router } from "@inertiajs/react";
import { useMemo, useState } from "react";

import AdminLayout from "../../../Layouts/AdminLayout";
import { DISCOUNT_TYPES, LIFECYCLE_LABELS } from "../../../Components/Admin/Coupons/couponFormState";
import { formatMoney } from "../../../lib/money";

const TONES = {
  green: "bg-green-100 text-green-800",
  blue: "bg-blue-100 text-blue-800",
  amber: "bg-amber-100 text-amber-800",
  gray: "bg-gray-100 text-gray-700",
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "scheduled", label: "Scheduled" },
  { key: "expired", label: "Expired" },
  { key: "disabled", label: "Disabled" },
];

function discountLabel(coupon) {
  const value = Number(coupon.discount_value);

  if (coupon.discount_type === DISCOUNT_TYPES.FREE_SHIPPING) return "Free shipping";
  if (!Number.isFinite(value)) return "—";

  if (coupon.discount_type === DISCOUNT_TYPES.PERCENTAGE) {
    const cap = Number(coupon.max_discount_amount);
    return `${value}% off${Number.isFinite(cap) && cap > 0 ? ` (max ${formatMoney(cap)})` : ""}`;
  }
  return `${formatMoney(value)} off`;
}

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function validityLabel(coupon) {
  const starts = formatDate(coupon.starts_at);
  const ends = formatDate(coupon.ends_at);

  if (starts && ends) return `${starts} – ${ends}`;
  if (starts) return `From ${starts}`;
  if (ends) return `Until ${ends}`;
  return "No expiry";
}

function usageLabel(coupon) {
  const used = coupon.used_count ?? 0;
  if (coupon.max_uses == null) return `${used} / ∞`;
  return `${used} / ${coupon.max_uses}`;
}

export default function AdminCouponsIndex({ coupons = [] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return coupons.filter((coupon) => {
      if (filter !== "all") {
        // "Limit reached" belongs with expired: both are enabled but unusable.
        const matches =
          filter === "expired"
            ? coupon.lifecycle === "expired" || coupon.lifecycle === "used_up"
            : coupon.lifecycle === filter;
        if (!matches) return false;
      }

      if (!needle) return true;
      return (
        coupon.code.toLowerCase().includes(needle) ||
        (coupon.description || "").toLowerCase().includes(needle)
      );
    });
  }, [coupons, query, filter]);

  function destroy(coupon) {
    if (!confirm(`Delete coupon ${coupon.code}? Orders already placed keep their discount.`)) return;
    router.post(`/admin/coupons/${coupon.id}/delete`, {}, { preserveScroll: true });
  }

  return (
    <AdminLayout title="Coupons">
      <Head title="Coupons" />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Coupons</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {coupons.length} coupon{coupons.length === 1 ? "" : "s"} · discount codes customers enter at
            checkout
          </p>
        </div>

        <Link
          href="/admin/coupons/create"
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 5a.75.75 0 01.75.75v3.5h3.5a.75.75 0 010 1.5h-3.5v3.5a.75.75 0 01-1.5 0v-3.5h-3.5a.75.75 0 010-1.5h3.5v-3.5A.75.75 0 0110 5z" />
          </svg>
          New coupon
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label htmlFor="coupon-search" className="sr-only">
          Search coupons
        </label>
        <input
          id="coupon-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by code or note…"
          className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
          {FILTERS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setFilter(option.key)}
              aria-pressed={filter === option.key}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === option.key
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        {rows.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-gray-900">
              {coupons.length === 0 ? "No coupons yet" : "No coupons match those filters"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {coupons.length === 0
                ? "Create a discount code for customers to enter at checkout."
                : "Try a different search or status."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Code</th>
                  <th scope="col" className="px-5 py-3 font-medium">Discount</th>
                  <th scope="col" className="px-5 py-3 font-medium">Status</th>
                  <th scope="col" className="px-5 py-3 font-medium">Validity</th>
                  <th scope="col" className="px-5 py-3 font-medium">Used</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {rows.map((coupon) => {
                  const { label, tone } = LIFECYCLE_LABELS[coupon.lifecycle] ?? LIFECYCLE_LABELS.disabled;

                  return (
                    <tr key={coupon.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/coupons/${coupon.id}/edit`}
                          className="font-mono font-semibold tracking-[0.08em] text-gray-900 hover:text-indigo-600"
                        >
                          {coupon.code}
                        </Link>
                        {coupon.description && (
                          <p className="mt-0.5 max-w-xs truncate text-xs text-gray-500">
                            {coupon.description}
                          </p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-gray-700">{discountLabel(coupon)}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}
                        >
                          {label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-gray-600">{validityLabel(coupon)}</td>
                      <td className="whitespace-nowrap px-5 py-3 tabular-nums text-gray-600">
                        {usageLabel(coupon)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        <Link
                          href={`/admin/coupons/${coupon.id}/edit`}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => destroy(coupon)}
                          className="ml-4 text-sm font-medium text-gray-500 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
