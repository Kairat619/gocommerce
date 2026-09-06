import { router } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";

import { ORDER_STATUSES } from "./orderLifecycle";

const RANGES = [
  { value: "", label: "Any date" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "total_desc", label: "Highest total" },
  { value: "total_asc", label: "Lowest total" },
  { value: "customer", label: "Customer A–Z" },
];

/**
 * Search, status, date, sort and page size for the orders list.
 *
 * Every control writes to the URL and lets the server re-query, so the filtered
 * view is shareable and bookmarkable and the browser never holds more than one
 * page of orders. Nothing here filters client-side.
 */
export default function OrderFilters({ filters, statusCounts = {}, pageSizes = [], active, total }) {
  const [search, setSearch] = useState(filters.q || "");
  const firstRender = useRef(true);

  // Applies a change by navigating. `page` is dropped on every change because a
  // new filter invalidates the old page number.
  function apply(patch) {
    const next = { ...filters, ...patch };
    const params = {};

    if (next.q) params.q = next.q;
    if (next.status) params.status = next.status;
    if (next.range) params.range = next.range;
    if (next.sort && next.sort !== "newest") params.sort = next.sort;
    if (next.limit && next.limit !== 20) params.limit = next.limit;

    router.get("/admin/orders", params, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  }

  // Debounced so typing a customer name is one request, not one per keystroke.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (search === (filters.q || "")) return;

    const timer = setTimeout(() => apply({ q: search }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="mb-4 space-y-3">
      {/* Status tabs, each carrying its count so the workload is visible without
          clicking through. */}
      <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by status">
        <button
          type="button"
          onClick={() => apply({ status: "" })}
          aria-pressed={!filters.status}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            !filters.status ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          All
          <span className="ml-1.5 text-xs text-gray-400">
            {Object.values(statusCounts).reduce((sum, n) => sum + Number(n), 0)}
          </span>
        </button>

        {ORDER_STATUSES.map((status) => {
          const count = Number(statusCounts[status.value] || 0);
          return (
            <button
              key={status.value}
              type="button"
              onClick={() => apply({ status: status.value })}
              aria-pressed={filters.status === status.value}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                filters.status === status.value
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {status.label}
              <span className="ml-1.5 text-xs text-gray-400">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <label htmlFor="order-search" className="sr-only">
            Search orders
          </label>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            id="order-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Order number, customer, email or coupon"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <label htmlFor="order-range" className="sr-only">
          Filter by date
        </label>
        <select
          id="order-range"
          value={filters.range || ""}
          onChange={(e) => apply({ range: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {RANGES.map((range) => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>

        <label htmlFor="order-sort" className="sr-only">
          Sort orders
        </label>
        <select
          id="order-sort"
          value={filters.sort || "newest"}
          onChange={(e) => apply({ sort: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {SORTS.map((sort) => (
            <option key={sort.value} value={sort.value}>
              {sort.label}
            </option>
          ))}
        </select>

        <label htmlFor="order-limit" className="sr-only">
          Orders per page
        </label>
        <select
          id="order-limit"
          value={filters.limit || 20}
          onChange={(e) => apply({ limit: Number(e.target.value) })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {pageSizes.map((size) => (
            <option key={size} value={size}>
              {size} per page
            </option>
          ))}
        </select>

        {active && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              router.get("/admin/orders", {}, { preserveScroll: true, replace: true });
            }}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            Clear filters
          </button>
        )}
      </div>

      <p className="text-sm text-gray-500" aria-live="polite">
        {total === 0 ? (
          "No orders match these filters"
        ) : (
          <>
            <span className="font-medium text-gray-900">{total}</span> order{total === 1 ? "" : "s"}
            {active && " matching these filters"}
          </>
        )}
      </p>
    </div>
  );
}
