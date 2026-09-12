import { Link } from "@inertiajs/react";

import DashboardCard from "./DashboardCard";
import { formatCount } from "./dashboardFormat";

/**
 * Stock that needs restocking.
 *
 * Like the order backlog, this ignores the date filter — stock is a present
 * fact, not something that happened during a period.
 *
 * The threshold is each product's own configured `low_stock_threshold`, read
 * straight from the product record, so the alert fires exactly where the person
 * who set up that product said it should. Only products that are active *and*
 * inventory-tracked are considered: a product with tracking off has no
 * meaningful stock number, and counting its zero would manufacture an alert
 * nobody can clear.
 *
 * There is no inventory valuation here. `cost_price` is nullable and sparsely
 * filled, so a total would silently understate itself — a wrong number that
 * looks like a right one.
 */
export default function InventoryAlerts({ inventory }) {
  const outOfStock = Number(inventory?.out_of_stock) || 0;
  const lowStock = Number(inventory?.low_stock) || 0;
  const tracked = Number(inventory?.tracked_products) || 0;
  const alerts = inventory?.alerts || [];

  return (
    <DashboardCard
      title="Inventory"
      description="Active, inventory-tracked products at or below their threshold"
      href="/admin/products"
      actionLabel="Manage stock"
    >
      {tracked === 0 ? (
        <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          No active product has inventory tracking switched on, so there is no
          stock to watch.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div
              className={`rounded-lg p-3 ring-1 ${
                outOfStock > 0
                  ? "bg-rose-50 ring-rose-200"
                  : "bg-gray-50 ring-gray-200"
              }`}
            >
              <p className="text-xs font-medium text-gray-600">Out of stock</p>
              <p className="mt-0.5 text-xl font-semibold tabular-nums text-gray-900">
                {formatCount(outOfStock)}
              </p>
            </div>
            <div
              className={`rounded-lg p-3 ring-1 ${
                lowStock > 0
                  ? "bg-amber-50 ring-amber-200"
                  : "bg-gray-50 ring-gray-200"
              }`}
            >
              <p className="text-xs font-medium text-gray-600">Running low</p>
              <p className="mt-0.5 text-xl font-semibold tabular-nums text-gray-900">
                {formatCount(lowStock)}
              </p>
            </div>
          </div>

          {alerts.length === 0 ? (
            <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
              All {formatCount(tracked)} tracked products are above their
              threshold.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100">
              {alerts.map((product) => {
                const stock = Number(product.stock_quantity) || 0;
                const empty = stock <= 0;

                return (
                  <li key={product.id}>
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="flex items-center justify-between gap-3 py-2.5 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {product.name}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {product.sku ? (
                            <span className="font-mono">{product.sku}</span>
                          ) : (
                            "No SKU"
                          )}
                          {product.category_name ? ` · ${product.category_name}` : ""}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        {/* The word carries the state; the tint only
                            reinforces it. */}
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            empty
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {empty ? "Out of stock" : `${stock} left`}
                        </span>
                        <p className="mt-0.5 text-xs text-gray-500 tabular-nums">
                          {empty && product.allow_backorders
                            ? "Backorders allowed"
                            : `Threshold ${formatCount(product.low_stock_threshold)}`}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </DashboardCard>
  );
}
