import { Head, Link, router } from "@inertiajs/react";
import { useMemo, useState } from "react";

import AdminLayout from "../../../Layouts/AdminLayout";
import ProductThumb from "../../../Components/Admin/Collections/ProductThumb";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "featured", label: "Featured" },
  { key: "disabled", label: "Disabled" },
  { key: "empty", label: "Empty" },
];

export default function AdminCollectionsIndex({ collections = [] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return collections.filter((collection) => {
      if (filter === "active" && !collection.is_active) return false;
      if (filter === "disabled" && collection.is_active) return false;
      if (filter === "featured" && !collection.is_featured) return false;
      if (filter === "empty" && Number(collection.product_count) > 0) return false;

      if (!needle) return true;
      return (
        collection.name.toLowerCase().includes(needle) || collection.slug.toLowerCase().includes(needle)
      );
    });
  }, [collections, query, filter]);

  function destroy(collection) {
    const count = Number(collection.product_count) || 0;
    if (
      !confirm(
        `Delete the collection “${collection.name}”?` +
          (count > 0 ? ` Its ${count} product${count === 1 ? "" : "s"} stay in the catalogue.` : ""),
      )
    ) {
      return;
    }
    router.post(`/admin/collections/${collection.id}/delete`, {}, { preserveScroll: true });
  }

  return (
    <AdminLayout title="Collections">
      <Head title="Collections" />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Collections</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {collections.length} collection{collections.length === 1 ? "" : "s"} · curated product groups for
            merchandising, alongside the category catalogue
          </p>
        </div>

        <Link
          href="/admin/collections/create"
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 5a.75.75 0 01.75.75v3.5h3.5a.75.75 0 010 1.5h-3.5v3.5a.75.75 0 01-1.5 0v-3.5h-3.5a.75.75 0 010-1.5h3.5v-3.5A.75.75 0 0110 5z" />
          </svg>
          New collection
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label htmlFor="collection-search" className="sr-only">
          Search collections
        </label>
        <input
          id="collection-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or URL key"
          className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />

        <div className="flex flex-wrap gap-1">
          {FILTERS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setFilter(option.key)}
              aria-pressed={filter === option.key}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                filter === option.key
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-200">
          <p className="text-sm font-medium text-gray-700">
            {collections.length === 0 ? "No collections yet" : "No collections match this filter"}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            {collections.length === 0
              ? "A collection groups products for merchandising — “Summer Essentials”, “Staff Picks” — without changing which category each product belongs to."
              : "Try a different search or filter."}
          </p>
          {collections.length === 0 && (
            <Link
              href="/admin/collections/create"
              className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Create your first collection
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">
                  Collection
                </th>
                <th scope="col" className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 md:table-cell">
                  Products
                </th>
                <th scope="col" className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:table-cell">
                  Status
                </th>
                <th scope="col" className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 lg:table-cell">
                  Position
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {rows.map((collection) => (
                <tr key={collection.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-3">
                      <ProductThumb product={{ image_url: collection.image_url }} />
                      <div className="min-w-0">
                        <Link
                          href={`/admin/collections/${collection.id}/edit`}
                          className="block truncate text-sm font-medium text-gray-900 hover:text-indigo-600"
                        >
                          {collection.name}
                        </Link>
                        <p className="truncate font-mono text-xs text-gray-500">
                          /collections/{collection.slug}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-600 md:table-cell">
                    {Number(collection.product_count) === 0 ? (
                      <span className="text-gray-400">Empty</span>
                    ) : (
                      `${collection.product_count} product${Number(collection.product_count) === 1 ? "" : "s"}`
                    )}
                  </td>

                  <td className="hidden whitespace-nowrap px-4 py-3 sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          collection.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {collection.is_active ? "Active" : "Disabled"}
                      </span>
                      {collection.is_featured && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm tabular-nums text-gray-600 lg:table-cell">
                    {collection.sort_order}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm sm:px-6">
                    <Link
                      href={`/admin/collections/${collection.id}/edit`}
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => destroy(collection)}
                      className="ml-4 font-medium text-gray-500 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
