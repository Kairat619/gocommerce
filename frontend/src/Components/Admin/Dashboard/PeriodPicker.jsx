import { router } from "@inertiajs/react";
import { useEffect, useState } from "react";

/**
 * The dashboard's time period.
 *
 * Like the orders list's filters, the selection lives in the URL and the server
 * re-queries: the view is shareable, the back button works, and the browser
 * never holds more than the aggregates it is showing. Nothing here re-filters
 * data client-side, because the browser was never sent the rows to filter.
 *
 * The resolved window comes back from the server as `period`, so the label
 * under the control is the window that was actually queried rather than this
 * component's guess at it. "Today" means the same instant here as it does on
 * the orders list — both resolve through the same map in Go.
 */
export default function PeriodPicker({ period, busy = false }) {
  const ranges = period?.ranges || [];
  const isCustom = period?.range === "custom";

  const [showCustom, setShowCustom] = useState(isCustom);
  const [from, setFrom] = useState(period?.custom_from || "");
  const [to, setTo] = useState(period?.custom_to || "");

  // The server is the authority on what is selected: a fallback (an
  // unparseable custom range, say) must move these controls, not be overridden
  // by them.
  useEffect(() => {
    setShowCustom(isCustom);
    setFrom(period?.custom_from || "");
    setTo(period?.custom_to || "");
  }, [period?.range, period?.custom_from, period?.custom_to, isCustom]);

  function apply(range, params = {}) {
    router.get(
      "/admin",
      { range, ...params },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  }

  function choose(range) {
    if (range === "custom") {
      setShowCustom(true);
      // Opening the picker must not fire a request with two empty dates; the
      // merchant applies it once both ends are chosen.
      if (from && to) apply("custom", { from, to });
      return;
    }
    setShowCustom(false);
    apply(range);
  }

  return (
    <div className="space-y-2">
      <div
        className="flex flex-wrap gap-1"
        role="group"
        aria-label="Dashboard time period"
      >
        {ranges.map((range) => {
          const active = period?.range === range.value;
          return (
            <button
              key={range.value}
              type="button"
              onClick={() => choose(range.value)}
              aria-pressed={active}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {range.label}
            </button>
          );
        })}
      </div>

      {showCustom && (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (from && to) apply("custom", { from, to });
          }}
        >
          <div>
            <label
              htmlFor="period-from"
              className="block text-xs font-medium text-gray-600"
            >
              From
            </label>
            <input
              id="period-from"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(event) => setFrom(event.target.value)}
              className="mt-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label
              htmlFor="period-to"
              className="block text-xs font-medium text-gray-600"
            >
              To
            </label>
            <input
              id="period-to"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => setTo(event.target.value)}
              className="mt-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={!from || !to}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Apply
          </button>
        </form>
      )}

      <p className="text-xs text-gray-500" aria-live="polite">
        {busy ? (
          <span className="text-gray-600">Updating figures…</span>
        ) : (
          <>
            <span className="font-medium text-gray-700">{period?.label}</span>
            {period?.comparison_label ? ` · ${period.comparison_label}` : ""}
            {period?.in_progress ? " · period still in progress" : ""}
          </>
        )}
      </p>
    </div>
  );
}
