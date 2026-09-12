import { Link } from "@inertiajs/react";
import { useState } from "react";

import { formatMoney } from "../../../lib/money";
import DashboardCard from "./DashboardCard";
import { formatCount } from "./dashboardFormat";

/**
 * Best sellers for the selected period.
 *
 * "Top products" on its own is ambiguous — top by money, by units, or by how
 * many orders contained it? Those three rank differently, and a merchant acting
 * on the wrong one restocks the wrong thing. So the measure is a visible
 * control, the card says which one is active, and all three figures stay on
 * every row.
 *
 * The rows come from the server already ranked by revenue; switching the
 * measure re-sorts the five rows in hand rather than asking for a new set. That
 * is presentation over data already delivered, not analytics moved into the
 * browser — the population is still whatever the database chose.
 *
 * Revenue here is LINE revenue — what the goods sold for, from
 * order_items.total. It will always total less than the revenue KPI, which is
 * order grand totals including tax and shipping. That gap is correct: shipping
 * is not revenue a product earned, and apportioning it across lines would
 * invent an allocation the store never recorded. The card says which basis it
 * is on so the two are never mistaken for a discrepancy.
 */

const MEASURES = [
  { value: "revenue", label: "Revenue" },
  { value: "units_sold", label: "Units" },
  { value: "order_count", label: "Orders" },
];

export default function TopProducts({ products = [], period, currency = "USD" }) {
  const [measure, setMeasure] = useState("revenue");

  const rows = [...products].sort(
    (a, b) => Number(b[measure] || 0) - Number(a[measure] || 0)
  );

  return (
    <DashboardCard
      title="Best sellers"
      description={`Ranked by ${
        MEASURES.find((m) => m.value === measure)?.label.toLowerCase() ?? "revenue"
      } in ${(period?.label || "this period").toLowerCase()} · goods only, before tax and shipping`}
      href="/admin/products"
      actionLabel="View all products"
      aside={
        <div
          className="flex rounded-lg bg-gray-100 p-0.5"
          role="group"
          aria-label="Rank products by"
        >
          {MEASURES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMeasure(option.value)}
              aria-pressed={measure === option.value}
              className={`rounded-md px-2 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                measure === option.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      }
      flush
    >
      {rows.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-gray-500">
          Nothing sold in this period, so there are no best sellers to rank.
        </p>
      ) : (
        <div className="overflow-x-auto border-t border-gray-100">
          <table className="min-w-full table-fixed divide-y divide-gray-100">
            <caption className="sr-only">
              Best selling products for {period?.label}
            </caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  Product
                </th>
                <th
                  scope="col"
                  className="w-20 px-2 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  Units
                </th>
                <th
                  scope="col"
                  className="w-28 px-5 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  {/* whitespace-normal so a long name wraps to two lines rather
                      than forcing the numeric columns off the card. */}
                  <td className="whitespace-normal px-5 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Thumbnail src={product.image_url} alt="" />
                      <div className="min-w-0">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          title={product.name}
                          className="line-clamp-2 text-sm font-medium text-gray-900 hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        >
                          {product.name}
                        </Link>
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {product.sku ? (
                            <span className="font-mono">{product.sku}</span>
                          ) : (
                            "No SKU"
                          )}
                          {" · "}
                          {formatCount(product.order_count)} order
                          {Number(product.order_count) === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-right text-sm tabular-nums text-gray-700">
                    {formatCount(product.units_sold)}
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-medium tabular-nums text-gray-900">
                    {formatMoney(product.revenue, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  );
}

/**
 * A fixed box, so a product without an image keeps its row the same height as
 * the others instead of collapsing the list.
 */
function Thumbnail({ src, alt }) {
  if (!src) {
    return (
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-gray-200 bg-gray-50 text-gray-300"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M18 8.25h.008v.008H18V8.25zM2.25 19.5V4.5A2.25 2.25 0 014.5 2.25h15A2.25 2.25 0 0121.75 4.5v15a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 19.5z" />
        </svg>
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="h-10 w-10 shrink-0 rounded border border-gray-200 object-cover"
    />
  );
}
