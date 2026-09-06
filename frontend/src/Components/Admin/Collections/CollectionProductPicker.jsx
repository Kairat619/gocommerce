import { router } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";

import { formatMoney } from "../../../lib/money";
import ProductThumb from "./ProductThumb";

/**
 * Server-side product search for the collection editor.
 *
 * The catalogue is never loaded into the browser: the picker asks the page for
 * a fresh `product_search` prop with an Inertia partial reload, so one page of
 * results crosses the wire at a time and the whole thing stays inside the page
 * prop contract — no REST endpoint is introduced for it.
 */
export default function CollectionProductPicker({ search, selectedIds, onAdd, onAddMany, onClose }) {
  const items = search?.items || [];
  const total = search?.total ?? 0;
  const page = search?.page ?? 1;
  const lastPage = search?.last_page ?? 0;

  const [keyword, setKeyword] = useState(search?.keyword || "");
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);

  // The panel is opened by a button, so focus has to be moved into it manually
  // for a keyboard user to carry on without reaching for the mouse.
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  function fetchPage(nextKeyword, nextPage) {
    setLoading(true);
    router.reload({
      only: ["product_search"],
      data: { q: nextKeyword || undefined, pp: nextPage > 1 ? nextPage : undefined },
      preserveState: true,
      preserveScroll: true,
      onFinish: () => setLoading(false),
    });
  }

  // Debounced so typing a word is one request, not one per keystroke. The
  // request is also reset to page 1: results for "mug" have nothing to do with
  // whatever page the previous search was on.
  useEffect(() => {
    if (keyword === (search?.keyword || "")) return;

    const timer = setTimeout(() => fetchPage(keyword, 1), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  const unselected = items.filter((product) => !selectedIds.has(product.id));

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50">
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-4 py-3">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="collection-product-search" className="sr-only">
            Search products to add
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
            ref={searchRef}
            id="collection-product-search"
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search by product name or SKU"
            autoComplete="off"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Done
        </button>
      </div>

      <div aria-live="polite" aria-busy={loading}>
        {loading ? (
          <ul className="divide-y divide-gray-200">
            {Array.from({ length: 3 }).map((_, index) => (
              <li key={index} className="flex items-center gap-3 px-4 py-3">
                <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded bg-gray-200" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200" />
                  <div className="h-2.5 w-1/4 animate-pulse rounded bg-gray-100" />
                </div>
              </li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">
            {keyword ? (
              <>
                No products match <span className="font-medium text-gray-700">“{keyword}”</span>.
              </>
            ) : (
              "There are no products in the catalogue yet."
            )}
          </p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {items.map((product) => {
              const alreadyIn = selectedIds.has(product.id);

              return (
                <li key={product.id} className="flex items-center gap-3 px-4 py-2.5">
                  <ProductThumb product={product} />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="truncate text-xs text-gray-500">
                      {product.sku && <span className="font-mono">{product.sku}</span>}
                      {product.sku && " · "}
                      {formatMoney(Number(product.price))}
                      {product.category_name && ` · ${product.category_name}`}
                      {!product.is_active && <span className="text-amber-600"> · Disabled</span>}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={alreadyIn}
                    onClick={() => onAdd(product)}
                    className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${
                      alreadyIn
                        ? "cursor-default text-gray-400"
                        : "border border-gray-300 bg-white text-indigo-600 hover:bg-indigo-50"
                    }`}
                  >
                    {alreadyIn ? "Added" : "Add"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-2.5">
        <p className="text-xs text-gray-500">
          {total === 0
            ? "No results"
            : `${total} product${total === 1 ? "" : "s"}${lastPage > 1 ? ` · page ${page} of ${lastPage}` : ""}`}
        </p>

        <div className="flex items-center gap-2">
          {unselected.length > 1 && (
            <button
              type="button"
              onClick={() => onAddMany(unselected)}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
            >
              Add all {unselected.length} on this page
            </button>
          )}

          {lastPage > 1 && (
            <>
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => fetchPage(keyword, page - 1)}
                className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= lastPage || loading}
                onClick={() => fetchPage(keyword, page + 1)}
                className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
