import { Head, Link, router } from "@inertiajs/react";
import { useEffect, useState } from "react";

import AdminLayout from "../../Layouts/AdminLayout";
import ActivityFeed from "../../Components/Admin/Dashboard/ActivityFeed";
import CustomerMix from "../../Components/Admin/Dashboard/CustomerMix";
import InventoryAlerts from "../../Components/Admin/Dashboard/InventoryAlerts";
import KpiRow from "../../Components/Admin/Dashboard/KpiRow";
import NeedsAttention from "../../Components/Admin/Dashboard/NeedsAttention";
import PeriodPicker from "../../Components/Admin/Dashboard/PeriodPicker";
import PromotionSummary from "../../Components/Admin/Dashboard/PromotionSummary";
import QuickActions from "../../Components/Admin/Dashboard/QuickActions";
import RecentOrders from "../../Components/Admin/Dashboard/RecentOrders";
import SalesChart from "../../Components/Admin/Dashboard/SalesChart";
import SectionError from "../../Components/Admin/Dashboard/SectionError";
import OrderHealth from "../../Components/Admin/Dashboard/OrderHealth";
import TopCategories from "../../Components/Admin/Dashboard/TopCategories";
import TopProducts from "../../Components/Admin/Dashboard/TopProducts";

/**
 * The dashboard.
 *
 * INFORMATION HIERARCHY
 *
 * The page is four descending bands, because a merchant who opens this screen
 * for ten seconds should still leave knowing something useful:
 *
 *   1  the four executive KPIs, each against an equal-length earlier period
 *   2  what needs doing right now, then the sales trend and order health
 *   3  what is selling, who is buying, what needs restocking, what promotions did
 *   4  the audit trail
 *
 * On a phone that order becomes the scroll order, which is why the bands are
 * laid out in priority sequence rather than by visual balance.
 *
 * WHAT IS NOT HERE, AND WHY
 *
 * No profit or margin: `order_items` never captured the cost of a sale, so any
 * margin would be computed from today's cost price and would quietly re-price
 * history. No payment or refund metrics: the schema has a single order status
 * and no payment record. No collection analytics: nothing tracks a collection
 * view, and inventing a conversion rate is worse than omitting one. Each of
 * those is a real gap, and a blank is more honest than a plausible number.
 *
 * ERRORS ARE PER SECTION
 *
 * The server runs the sections concurrently and lets each fail alone. A section
 * that errored arrives as an absent prop and names itself in `section_errors`,
 * so one broken query costs one card rather than the page. That is also why
 * every section below is guarded by `failed()` rather than by a truthiness
 * check on its data — an empty list and a failed query look identical
 * otherwise, and they mean opposite things.
 *
 * @param {import('../../types/pages').AdminDashboardProps} props
 */
export default function Dashboard({
  period,
  kpis,
  sales_series,
  order_status,
  backlog,
  recent_orders,
  top_products,
  top_categories,
  customers,
  inventory,
  promotions,
  activity,
  catalog,
  currency = "USD",
  section_errors = {},
}) {
  const busy = useVisitInFlight();
  const failed = (name) => Boolean(section_errors[name]);

  // A store with no catalogue at all needs onboarding, not analytics. A store
  // with products but no orders yet gets the full dashboard — its empty
  // sections each say so in their own words, which is more useful than one
  // blanket "no data" screen hiding the inventory and catalogue figures that
  // *are* real.
  const unstocked = Number(catalog?.products ?? 0) === 0;

  return (
    <AdminLayout title="Dashboard">
      <Head title="Dashboard" />

      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Store overview
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            How the store is trading, and what needs your attention.
          </p>
        </div>
        <QuickActions />
      </div>

      <div className="mb-6">
        <PeriodPicker period={period} busy={busy} />
      </div>

      {unstocked && !failed("catalog") ? (
        <EmptyStore />
      ) : (
        // aria-busy rather than a spinner over the whole page: Inertia keeps the
        // previous figures on screen while the next period is fetched, so the
        // honest signal is "these numbers are one period stale", not "gone".
        <div
          className={`space-y-4 transition-opacity ${busy ? "opacity-60" : ""}`}
          aria-busy={busy}
        >
          {/* Band 1 — executive KPIs */}
          <section aria-label="Key figures">
            <h2 className="sr-only">Key figures for {period?.label}</h2>
            {failed("kpis") ? (
              <SectionError label="The headline figures" />
            ) : (
              <KpiRow kpis={kpis} period={period} currency={currency} />
            )}
          </section>

          {/* Band 2 — what to do now, and how trade is going */}
          {failed("backlog") ? (
            <SectionError label="The order backlog" />
          ) : (
            <NeedsAttention backlog={backlog} currency={currency} />
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {failed("sales_series") ? (
                <SectionError label="The sales trend" />
              ) : (
                <SalesChart
                  series={sales_series}
                  period={period}
                  currency={currency}
                />
              )}
            </div>
            <div>
              {failed("order_status") ? (
                <SectionError label="The order status breakdown" />
              ) : (
                <OrderHealth orderStatus={order_status} period={period} />
              )}
            </div>
          </div>

          {/* Band 3 — catalogue, customers, stock, promotions */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {failed("top_products") ? (
                <SectionError label="Product performance" />
              ) : (
                <TopProducts
                  products={top_products}
                  period={period}
                  currency={currency}
                />
              )}
            </div>
            <div>
              {failed("inventory") ? (
                <SectionError label="Inventory" />
              ) : (
                <InventoryAlerts inventory={inventory} />
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {failed("recent_orders") ? (
                <SectionError label="Recent orders" />
              ) : (
                <RecentOrders orders={recent_orders} currency={currency} />
              )}
            </div>
            <div>
              {failed("customers") ? (
                <SectionError label="Customer figures" />
              ) : (
                <CustomerMix
                  customers={customers}
                  period={period}
                  currency={currency}
                />
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              {failed("top_categories") ? (
                <SectionError label="Category performance" />
              ) : (
                <TopCategories
                  categories={top_categories}
                  period={period}
                  currency={currency}
                />
              )}
            </div>
            <div>
              {failed("promotions") ? (
                <SectionError label="Promotion performance" />
              ) : (
                <PromotionSummary
                  promotions={promotions}
                  period={period}
                  currency={currency}
                />
              )}
            </div>

            {/* Band 4 — the audit trail, last because it is context rather
                than a decision. */}
            <div>
              {failed("activity") ? (
                <SectionError label="Recent activity" />
              ) : (
                <ActivityFeed activity={activity} />
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

/**
 * True while an Inertia visit is in flight.
 *
 * Changing the period is a server round trip, and Inertia keeps the current
 * page mounted until the new props land — which is the right behaviour, but
 * silently, so the figures look live when they are one period behind. This
 * drives the dim-and-announce state that says otherwise.
 */
function useVisitInFlight() {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const stopStart = router.on("start", () => setBusy(true));
    const stopFinish = router.on("finish", () => setBusy(false));
    return () => {
      stopStart();
      stopFinish();
    };
  }, []);

  return busy;
}

/**
 * The genuinely empty store.
 *
 * Shown only when the catalogue itself is empty, where every chart would be a
 * flat line through nothing. A store with products but no sales yet keeps the
 * full dashboard, because its stock and catalogue numbers are real and its
 * empty sections say so individually.
 */
function EmptyStore() {
  return (
    <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-200">
      <span
        aria-hidden="true"
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      </span>

      <h2 className="mt-4 text-base font-semibold text-gray-900">
        Your store has no products yet
      </h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
        Sales figures, best sellers and stock alerts all appear here once there
        is something to sell. Start with a product.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link
          href="/admin/products/create"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          Add your first product
        </Link>
        <Link
          href="/admin/categories/create"
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          Create a category
        </Link>
      </div>
    </div>
  );
}
