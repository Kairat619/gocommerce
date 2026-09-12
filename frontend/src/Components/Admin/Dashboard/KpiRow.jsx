import { formatMoney } from "../../../lib/money";
import KpiCard from "./KpiCard";
import {
  describeChange,
  directionTone,
  formatCount,
  outcomeTone,
} from "./dashboardFormat";

/**
 * The four numbers a merchant reads first.
 *
 * Revenue, orders, average order value, new customers — in that order, because
 * that is the order the questions arrive in: how much did we take, from how
 * many sales, at what size each, and is the audience growing.
 *
 * All four are windowed by the selected period and all four carry a comparison
 * against an equal-length earlier window. The secondary figures — items sold,
 * buyers, discount given — are deliberately a size down and below the fold of
 * attention; giving every metric the same weight is the fastest way to make a
 * dashboard unreadable.
 *
 * REVENUE MEANS ONE THING HERE, AND THE SAME THING EVERYWHERE.
 *
 * SUM(orders.total) over non-cancelled orders in the window: the grand total
 * the customer was charged, after discount and including tax and shipping. It
 * is the same figure the orders list totals and the same one the customer
 * lifetime-value card shows. It is not profit — the store never recorded the
 * cost of a sale, so no margin is shown anywhere on this page.
 */
export default function KpiRow({ kpis, period, currency = "USD" }) {
  const comparison = period?.comparison_label || "";
  const periodLabel = period?.label || "";

  const shared = { periodLabel, comparisonLabel: comparison };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          {...shared}
          label="Revenue"
          value={formatMoney(kpis?.revenue?.value ?? "0.00", currency)}
          previous={formatMoney(kpis?.revenue?.previous ?? "0.00", currency)}
          change={kpis?.revenue?.change}
          href="/admin/orders"
          hint="excludes cancelled"
          accent="indigo"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <KpiCard
          {...shared}
          label="Orders"
          value={formatCount(kpis?.orders?.value)}
          previous={formatCount(kpis?.orders?.previous)}
          change={kpis?.orders?.change}
          href="/admin/orders"
          hint="excludes cancelled"
          accent="emerald"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12A1.125 1.125 0 0119.75 21.75H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
            </svg>
          }
        />

        <KpiCard
          {...shared}
          label="Average order value"
          value={formatMoney(kpis?.average_order_value?.value ?? "0.00", currency)}
          previous={formatMoney(kpis?.average_order_value?.previous ?? "0.00", currency)}
          change={kpis?.average_order_value?.change}
          hint="revenue ÷ orders"
          accent="sky"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          }
        />

        <KpiCard
          {...shared}
          label="New customers"
          value={formatCount(kpis?.new_customers?.value)}
          previous={formatCount(kpis?.new_customers?.previous)}
          change={kpis?.new_customers?.change}
          href="/admin/customers"
          hint="accounts registered"
          accent="violet"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
          }
        />
      </div>

      {/* Level two: real figures, deliberately quieter. Discount flags
          higher-is-better as false — more money given away is not a win, so its
          tint inverts while its arrow keeps describing the number itself. */}
      <dl className="mt-4 grid gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 sm:grid-cols-3">
        <SubMetric
          label="Items sold"
          value={formatCount(kpis?.items_sold?.value)}
          change={kpis?.items_sold?.change}
        />
        <SubMetric
          label="Customers who bought"
          value={formatCount(kpis?.buyers?.value)}
          change={kpis?.buyers?.change}
        />
        <SubMetric
          label="Discount given"
          value={formatMoney(kpis?.discount_total?.value ?? "0.00", currency)}
          change={kpis?.discount_total?.change}
          higherIsBetter={false}
        />
      </dl>
    </>
  );
}

function SubMetric({ label, value, change, higherIsBetter = true }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
        <span className="text-lg font-semibold tabular-nums text-gray-900">
          {value}
        </span>
        <InlineChange change={change} higherIsBetter={higherIsBetter} />
      </dd>
    </div>
  );
}

function InlineChange({ change, higherIsBetter }) {
  const delta = describeChange(change);
  if (!delta.known) {
    return <span className="text-xs text-gray-400">no prior data</span>;
  }
  const glyph = directionTone(delta.direction);
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded px-1 text-xs font-medium tabular-nums ${outcomeTone(
        delta.direction,
        higherIsBetter
      )}`}
    >
      <span aria-hidden="true">{glyph.glyph}</span>
      {delta.label}
      <span className="sr-only">{glyph.word}</span>
    </span>
  );
}
