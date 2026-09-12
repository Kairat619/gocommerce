import { Link } from "@inertiajs/react";

import { formatMoney, toAmount } from "../../../lib/money";
import DashboardCard from "./DashboardCard";
import { formatCount } from "./dashboardFormat";

/**
 * Which parts of the catalogue are selling.
 *
 * Bars are scaled against the best-performing category rather than against
 * total revenue: the question here is relative standing between groups, and a
 * store with one dominant category would otherwise render five invisible
 * slivers.
 *
 * The grouping uses each product's *current* category, which is the only one
 * the store records — order lines capture the product, not a snapshot of where
 * it sat in the tree. Recategorising a product therefore moves its past sales
 * with it. That is stated on the card rather than left for someone to discover
 * when the numbers shift.
 */
export default function TopCategories({ categories = [], period, currency = "USD" }) {
  const peak = categories.reduce(
    (max, category) => Math.max(max, toAmount(category.revenue) ?? 0),
    0
  );

  return (
    <DashboardCard
      title="Top categories"
      description="By goods revenue, using each product's current category"
      href="/admin/categories"
      actionLabel="Manage categories"
    >
      {categories.length === 0 ? (
        <p className="text-sm text-gray-500">
          No category sold anything in {(period?.label || "this period").toLowerCase()}.
        </p>
      ) : (
        <ul className="space-y-3">
          {categories.map((category) => {
            const revenue = toAmount(category.revenue) ?? 0;
            const width = peak > 0 ? (revenue / peak) * 100 : 0;

            return (
              <li key={category.id}>
                <div className="flex items-baseline justify-between gap-3">
                  {/* The category's own edit screen, not a filtered product
                      list: the admin products list takes only ?page, so a
                      ?category= link would silently do nothing. */}
                  <Link
                    href={`/admin/categories/${category.id}/edit`}
                    className="truncate text-sm font-medium text-gray-900 hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    {category.name}
                  </Link>
                  <span className="shrink-0 text-sm font-medium tabular-nums text-gray-900">
                    {formatMoney(category.revenue, currency)}
                  </span>
                </div>

                <div
                  className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100"
                  aria-hidden="true"
                >
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${width}%` }}
                  />
                </div>

                <p className="mt-1 text-xs text-gray-500">
                  {formatCount(category.units_sold)} unit
                  {Number(category.units_sold) === 1 ? "" : "s"} across{" "}
                  {formatCount(category.order_count)} order
                  {Number(category.order_count) === 1 ? "" : "s"}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
