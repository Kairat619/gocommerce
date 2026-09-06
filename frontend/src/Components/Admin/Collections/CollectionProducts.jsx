import { useState } from "react";

import { formatMoney } from "../../../lib/money";
import FormCard from "../Form/FormCard";
import CollectionProductPicker from "./CollectionProductPicker";
import ProductThumb from "./ProductThumb";

/**
 * The curated membership, in storefront order.
 *
 * Ordering is offered three ways on purpose: drag for speed, move up/down for
 * keyboard and assistive-technology users, and "sort A–Z" for a list that has
 * grown past hand-arranging. Drag is never the only route.
 */
export default function CollectionProducts({ products, setProducts, search, error }) {
  const [picking, setPicking] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);

  const selectedIds = new Set(products.map((product) => product.id));

  function add(product) {
    if (selectedIds.has(product.id)) return;
    setProducts((current) => [...current, product]);
  }

  function addMany(incoming) {
    setProducts((current) => {
      const seen = new Set(current.map((product) => product.id));
      return [...current, ...incoming.filter((product) => !seen.has(product.id))];
    });
  }

  function remove(id) {
    setProducts((current) => current.filter((product) => product.id !== id));
  }

  function move(from, to) {
    if (to < 0 || to >= products.length || from === to) return;
    setProducts((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  const inactiveCount = products.filter((product) => !product.is_active).length;

  return (
    <FormCard
      title="Products"
      description="The products in this collection, in the order shoppers will see them."
      actions={
        !picking && (
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10 5a.75.75 0 01.75.75v3.5h3.5a.75.75 0 010 1.5h-3.5v3.5a.75.75 0 01-1.5 0v-3.5h-3.5a.75.75 0 010-1.5h3.5v-3.5A.75.75 0 0110 5z" />
            </svg>
            Add products
          </button>
        )
      }
    >
      <div className="space-y-4">
        {picking && (
          <CollectionProductPicker
            search={search}
            selectedIds={selectedIds}
            onAdd={add}
            onAddMany={addMany}
            onClose={() => setPicking(false)}
          />
        )}

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {products.length === 0 ? (
          !picking && (
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
              <svg
                className="mx-auto h-8 w-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
              <p className="mt-2 text-sm font-medium text-gray-700">No products in this collection yet</p>
              <p className="mt-0.5 text-sm text-gray-500">
                A collection is a hand-picked group — search the catalogue and add the ones that belong.
              </p>
              <button
                type="button"
                onClick={() => setPicking(true)}
                className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Add products
              </button>
            </div>
          )
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{products.length}</span> product
                {products.length === 1 ? "" : "s"}
                {inactiveCount > 0 && (
                  <span className="text-amber-600">
                    {" "}
                    · {inactiveCount} disabled, hidden from the storefront
                  </span>
                )}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setProducts((current) =>
                      [...current].sort((a, b) => a.name.localeCompare(b.name)),
                    )
                  }
                  className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
                >
                  Sort A–Z
                </button>
                <button
                  type="button"
                  onClick={() => setProducts([])}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-red-50 hover:text-red-600"
                >
                  Remove all
                </button>
              </div>
            </div>

            <ol className="divide-y divide-gray-200 rounded-lg border border-gray-200">
              {products.map((product, index) => (
                <li
                  key={product.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDropIndex(index);
                  }}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setDropIndex(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIndex !== null) move(dragIndex, index);
                    setDragIndex(null);
                    setDropIndex(null);
                  }}
                  className={`flex items-center gap-3 bg-white px-3 py-2.5 first:rounded-t-lg last:rounded-b-lg ${
                    dragIndex === index ? "opacity-40" : ""
                  } ${dropIndex === index && dragIndex !== index ? "ring-2 ring-inset ring-indigo-400" : ""}`}
                >
                  <span
                    aria-hidden="true"
                    title="Drag to reorder"
                    className="cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7 4a1 1 0 112 0 1 1 0 01-2 0zm0 6a1 1 0 112 0 1 1 0 01-2 0zm0 6a1 1 0 112 0 1 1 0 01-2 0zm5-12a1 1 0 112 0 1 1 0 01-2 0zm0 6a1 1 0 112 0 1 1 0 01-2 0zm0 6a1 1 0 112 0 1 1 0 01-2 0z" />
                    </svg>
                  </span>

                  <span className="w-5 flex-shrink-0 text-right text-xs tabular-nums text-gray-400">
                    {index + 1}
                  </span>

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

                  <div className="flex flex-shrink-0 items-center">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => move(index, index - 1)}
                      aria-label={`Move ${product.name} up to position ${index}`}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      disabled={index === products.length - 1}
                      onClick={() => move(index, index + 1)}
                      aria-label={`Move ${product.name} down to position ${index + 2}`}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(product.id)}
                      aria-label={`Remove ${product.name} from this collection`}
                      className="ml-1 rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M8.75 1a1 1 0 00-.96.71L7.5 2.5H4.75a.75.75 0 000 1.5h10.5a.75.75 0 000-1.5H12.5l-.29-.79A1 1 0 0011.25 1h-2.5zM5.5 5.5l.54 10.13A1.75 1.75 0 007.79 17.3h4.42a1.75 1.75 0 001.75-1.67L14.5 5.5h-9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ol>

            <p className="text-xs text-gray-500">
              Drag a row, or use the arrows, to change the order. Position 1 shows first on the collection page.
            </p>
          </>
        )}
      </div>
    </FormCard>
  );
}
