import { Head, Link, router } from "@inertiajs/react";
import { useMemo, useState } from "react";

import AdminLayout from "../../../Layouts/AdminLayout";
import { typeInfo } from "../../../Components/Admin/Attributes/attributeFormState";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "variant", label: "Builds variants" },
  { key: "list", label: "Fixed list" },
  { key: "unused", label: "Unused" },
];

export default function AdminAttributesIndex({ attributes = [] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return attributes.filter((attribute) => {
      if (filter === "variant" && !attribute.is_variant) return false;
      if (filter === "list" && !typeInfo(attribute.type).hasOptions) return false;
      if (filter === "unused" && Number(attribute.product_count) > 0) return false;

      if (!needle) return true;
      return (
        attribute.name.toLowerCase().includes(needle) || attribute.code.toLowerCase().includes(needle)
      );
    });
  }, [attributes, query, filter]);

  function destroy(attribute) {
    const count = Number(attribute.product_count) || 0;
    if (count > 0) {
      // The server refuses this too; saying so here avoids a pointless round
      // trip and explains the way out.
      window.alert(
        `“${attribute.name}” is used by ${count} product${count === 1 ? "" : "s"}.\n\n` +
          "Remove it from those products before deleting it, so their data is not lost.",
      );
      return;
    }
    if (!confirm(`Delete the attribute “${attribute.name}”? This also removes its values.`)) return;
    router.post(`/admin/attributes/${attribute.id}/delete`, {}, { preserveScroll: true });
  }

  return (
    <AdminLayout title="Attributes">
      <Head title="Attributes" />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Attributes</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {attributes.length} attribute{attributes.length === 1 ? "" : "s"} · the properties products share,
            and the source of variant options
          </p>
        </div>

        <Link
          href="/admin/attributes/create"
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 5a.75.75 0 01.75.75v3.5h3.5a.75.75 0 010 1.5h-3.5v3.5a.75.75 0 01-1.5 0v-3.5h-3.5a.75.75 0 010-1.5h3.5v-3.5A.75.75 0 0110 5z" />
          </svg>
          New attribute
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label htmlFor="attribute-search" className="sr-only">
          Search attributes
        </label>
        <input
          id="attribute-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or code"
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
            {attributes.length === 0 ? "No attributes yet" : "No attributes match this filter"}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            {attributes.length === 0
              ? "An attribute is a property products share — Color, Material, Capacity. Ones with a fixed list of values can also build product variants."
              : "Try a different search or filter."}
          </p>
          {attributes.length === 0 && (
            <Link
              href="/admin/attributes/create"
              className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Create your first attribute
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">
                  Attribute
                </th>
                <th scope="col" className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:table-cell">
                  Type
                </th>
                <th scope="col" className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 md:table-cell">
                  Values
                </th>
                <th scope="col" className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 md:table-cell">
                  Used by
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
              {rows.map((attribute) => {
                const info = typeInfo(attribute.type);
                const used = Number(attribute.product_count) || 0;

                return (
                  <tr key={attribute.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 sm:px-6">
                      <Link
                        href={`/admin/attributes/${attribute.id}/edit`}
                        className="block truncate text-sm font-medium text-gray-900 hover:text-indigo-600"
                      >
                        {attribute.name}
                      </Link>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span className="truncate font-mono text-xs text-gray-500">{attribute.code}</span>
                        {attribute.is_variant && (
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
                            Variants
                          </span>
                        )}
                        {attribute.is_required && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                            Required
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-600 sm:table-cell">
                      {info.label}
                    </td>

                    <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-600 md:table-cell">
                      {info.hasOptions ? (
                        `${attribute.option_count} value${Number(attribute.option_count) === 1 ? "" : "s"}`
                      ) : (
                        <span className="text-gray-400">Free text</span>
                      )}
                    </td>

                    <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-600 md:table-cell">
                      {used === 0 ? (
                        <span className="text-gray-400">Unused</span>
                      ) : (
                        `${used} product${used === 1 ? "" : "s"}`
                      )}
                    </td>

                    <td className="hidden whitespace-nowrap px-4 py-3 text-sm tabular-nums text-gray-600 lg:table-cell">
                      {attribute.sort_order}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm sm:px-6">
                      <Link
                        href={`/admin/attributes/${attribute.id}/edit`}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => destroy(attribute)}
                        title={used > 0 ? "In use by products" : undefined}
                        className={`ml-4 font-medium ${
                          used > 0 ? "cursor-not-allowed text-gray-300" : "text-gray-500 hover:text-red-600"
                        }`}
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
    </AdminLayout>
  );
}
