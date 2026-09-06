import { Head, Link, router } from "@inertiajs/react";
import { useMemo, useState } from "react";
import AdminLayout from "../../../Layouts/AdminLayout";
import { flattenTree, searchIds } from "../../../Components/Admin/Categories/categoryTree";
import { excerpt } from "../../../lib/html";

const INDENT_PX = 22;

function DisclosureButton({ collapsed, name, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!collapsed}
      aria-label={collapsed ? `Expand ${name}` : `Collapse ${name}`}
      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700"
    >
      <svg
        className={`h-3.5 w-3.5 transition-transform ${collapsed ? "" : "rotate-90"}`}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" />
      </svg>
    </button>
  );
}

/** @param {import('../../../types/pages').AdminCategoriesIndexProps} props */
export default function AdminCategoriesIndex({ categories }) {
  const [query, setQuery] = useState("");
  const [collapsedIds, setCollapsedIds] = useState(() => new Set());

  const visibleIds = useMemo(() => searchIds(categories, query), [categories, query]);

  const rows = useMemo(
    () => flattenTree(categories, { collapsedIds, visibleIds: visibleIds ?? undefined }),
    [categories, collapsedIds, visibleIds],
  );

  const branchIds = useMemo(() => {
    const parents = new Set();
    categories.forEach((category) => {
      if (category.parent_id) parents.add(category.parent_id);
    });
    return parents;
  }, [categories]);

  const nested = categories.filter((category) => category.parent_id).length;
  const searching = visibleIds !== null;

  function toggle(id) {
    setCollapsedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function deleteCategory(category, childCount) {
    const warning =
      childCount > 0
        ? `\n\nIts ${childCount} subcategor${childCount === 1 ? "y" : "ies"} will be moved to the top level.`
        : "";

    if (confirm(`Delete “${category.name}”?${warning}`)) {
      router.post(`/admin/categories/${category.id}/delete`, {}, { preserveScroll: true });
    }
  }

  return (
    <AdminLayout title="Categories">
      <Head title="Admin Categories" />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">All Categories</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {categories.length} categor{categories.length === 1 ? "y" : "ies"}
            {nested > 0 && `, ${nested} nested`}
          </p>
        </div>
        <Link
          href="/admin/categories/create"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Add Category
        </Link>
      </div>

      {categories.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1 sm:max-w-xs">
            <label htmlFor="category-search" className="sr-only">
              Search categories
            </label>
            <input
              id="category-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {branchIds.size > 0 && !searching && (
            <div className="flex items-center gap-2 text-sm">
              <button
                type="button"
                onClick={() => setCollapsedIds(new Set())}
                className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50"
              >
                Expand all
              </button>
              <button
                type="button"
                onClick={() => setCollapsedIds(new Set(branchIds))}
                className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50"
              >
                Collapse all
              </button>
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map(({ category, depth, isLast, ancestorLines, childCount, hasChildren, collapsed, detached }) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {/* Guides for the branches this row sits inside, then the
                        elbow joining it to its own parent. */}
                    {ancestorLines.map((continues, level) => (
                      <span
                        key={level}
                        aria-hidden="true"
                        className="flex-shrink-0 text-center text-gray-300"
                        style={{ width: `${INDENT_PX}px` }}
                      >
                        {continues ? "│" : ""}
                      </span>
                    ))}
                    {depth > 0 && (
                      <span
                        aria-hidden="true"
                        className="flex-shrink-0 text-center text-gray-300"
                        style={{ width: `${INDENT_PX}px` }}
                      >
                        {isLast ? "└" : "├"}
                      </span>
                    )}

                    {hasChildren ? (
                      <DisclosureButton
                        collapsed={collapsed}
                        name={category.name}
                        onToggle={() => toggle(category.id)}
                      />
                    ) : (
                      <span className="h-6 w-6 flex-shrink-0" />
                    )}

                    <div className="ml-2 h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {category.image_url ? (
                        <img src={category.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-gray-400">🏷️</div>
                      )}
                    </div>

                    <div className="ml-3 min-w-0">
                      <Link
                        href={`/admin/categories/${category.id}/edit`}
                        className="block truncate text-sm font-medium text-gray-900 hover:text-indigo-600"
                      >
                        {category.name}
                      </Link>
                      <p className="truncate text-xs text-gray-500">
                        /{category.slug}
                        {childCount > 0 && (
                          <span className="ml-2 text-gray-400">
                            {childCount} subcategor{childCount === 1 ? "y" : "ies"}
                          </span>
                        )}
                        {detached && (
                          <span
                            className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-800"
                            title="This category's parent chain forms a loop. Edit it and choose a valid parent."
                          >
                            Detached
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="max-w-xs px-6 py-4 text-sm text-gray-500">
                  <span className="line-clamp-2">{excerpt(category.description, 120) || "—"}</span>
                </td>

                <td className="px-6 py-4 text-sm text-gray-500">{category.sort_order}</td>

                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      category.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {category.is_active ? "Active" : "Inactive"}
                  </span>
                </td>

                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                  <Link
                    href={`/admin/categories/${category.id}/edit`}
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteCategory(category, childCount)}
                    className="ml-4 font-medium text-red-600 hover:text-red-500"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                  {categories.length === 0 ? (
                    <>
                      No categories yet.{" "}
                      <Link href="/admin/categories/create" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Create the first one
                      </Link>
                      .
                    </>
                  ) : (
                    <>No categories match “{query}”.</>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
