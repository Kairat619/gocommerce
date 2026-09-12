import { useEffect, useMemo, useRef, useState } from "react";

import { formatMoney, toAmount } from "../../../lib/money";
import DashboardCard from "./DashboardCard";
import { formatCount } from "./dashboardFormat";

/**
 * The sales trend.
 *
 * Drawn by hand in SVG. The frontend ships three runtime dependencies on
 * purpose, and a chart library is not worth being the fourth for one line and
 * an axis — nor would one be allowed without asking.
 *
 * DESIGN DECISIONS
 *
 * One series is plotted at a time, toggled between revenue and orders. Stacking
 * money on top of a count, as the reference dashboard does, produces a shape
 * that means nothing: the two share no unit and the stacked height is not a
 * quantity. The tooltip still reports both figures for the hovered bucket, so
 * nothing is lost by separating them.
 *
 * The y-axis starts at zero. A chart that crops its baseline to fill the frame
 * turns a 2% wobble into a cliff, and this one is read for reassurance as often
 * as for alarm.
 *
 * Empty buckets are real zeros, not gaps — the server generates the buckets and
 * left-joins orders onto them, so a quiet Sunday is a point on the floor rather
 * than a straight line drawn over the top of it.
 */

const PADDING = { top: 16, right: 12, bottom: 28, left: 56 };
const HEIGHT = 260;

const METRICS = [
  { value: "revenue", label: "Revenue" },
  { value: "orders", label: "Orders" },
];

export default function SalesChart({ series = [], period, currency = "USD" }) {
  const [metric, setMetric] = useState("revenue");
  const [cursor, setCursor] = useState(null);
  const [width, setWidth] = useState(720);
  const frameRef = useRef(null);

  // The SVG is drawn at the container's real pixel width rather than being
  // scaled with preserveAspectRatio, which would stretch the strokes and the
  // type along with the plot.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect?.width;
      if (next) setWidth(Math.max(320, next));
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const points = useMemo(
    () =>
      series.map((point) => ({
        label: point.label,
        revenue: toAmount(point.revenue) ?? 0,
        orders: Number(point.orders) || 0,
      })),
    [series]
  );

  const values = points.map((point) => point[metric]);
  const peak = Math.max(...values, 0);
  const hasData = points.length > 0 && values.some((value) => value > 0);

  const plotWidth = Math.max(1, width - PADDING.left - PADDING.right);
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  // A single bucket has no span to spread across, so it is pinned to the middle
  // rather than dividing by zero.
  const stepX =
    points.length > 1 ? plotWidth / (points.length - 1) : plotWidth / 2;

  const scaleX = (index) =>
    points.length > 1
      ? PADDING.left + index * stepX
      : PADDING.left + plotWidth / 2;

  // Round the top of the scale up so the axis lands on readable numbers and the
  // peak never touches the frame.
  const ceiling = niceCeiling(peak);
  const scaleY = (value) =>
    PADDING.top + plotHeight - (ceiling === 0 ? 0 : (value / ceiling) * plotHeight);

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${scaleX(index)} ${scaleY(point[metric])}`)
    .join(" ");

  const areaPath = hasData
    ? `${linePath} L ${scaleX(points.length - 1)} ${PADDING.top + plotHeight} L ${scaleX(0)} ${
        PADDING.top + plotHeight
      } Z`
    : "";

  const ticks = axisTicks(ceiling);
  const active = cursor === null ? null : points[cursor];

  // Enough room for every label, or every other one, and so on — so the axis
  // thins out instead of overlapping into an unreadable smear.
  const labelStride = Math.max(1, Math.ceil((points.length * 58) / plotWidth));

  function pointerIndex(event) {
    const box = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - box.left - PADDING.left;
    if (points.length <= 1) return 0;
    return clamp(Math.round(x / stepX), 0, points.length - 1);
  }

  return (
    <DashboardCard
      title="Sales over time"
      description={`${
        metric === "revenue" ? "Revenue" : "Orders"
      } per ${period?.bucket || "day"}, excluding cancelled orders`}
      aside={
        <div
          className="flex rounded-lg bg-gray-100 p-0.5"
          role="group"
          aria-label="Chart measure"
        >
          {METRICS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMetric(option.value)}
              aria-pressed={metric === option.value}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                metric === option.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      }
    >
      {!hasData ? (
        <div className="flex h-[260px] flex-col items-center justify-center rounded-lg bg-gray-50 text-center">
          <p className="text-sm font-medium text-gray-700">
            No sales in this period
          </p>
          <p className="mt-1 max-w-xs text-xs text-gray-500">
            {/* An empty chart is drawn as an empty chart. Plotting a flat line
                through no data would imply the store was measured and found to
                be at zero, which is a different claim. */}
            Nothing was sold between these dates. Try a wider period, or check
            back once orders start arriving.
          </p>
        </div>
      ) : (
        <div ref={frameRef} className="relative">
          <svg
            width={width}
            height={HEIGHT}
            role="img"
            aria-label={chartSummary(points, metric, currency, period)}
            className="touch-none select-none"
            onMouseMove={(event) => setCursor(pointerIndex(event))}
            onMouseLeave={() => setCursor(null)}
          >
            {/* Horizontal gridlines, and the axis labels that make them mean
                something. */}
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={PADDING.left}
                  x2={width - PADDING.right}
                  y1={scaleY(tick)}
                  y2={scaleY(tick)}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={PADDING.left - 8}
                  y={scaleY(tick) + 4}
                  textAnchor="end"
                  className="fill-gray-400 text-[10px] tabular-nums"
                >
                  {metric === "revenue"
                    ? compactMoney(tick, currency)
                    : formatCount(tick)}
                </text>
              </g>
            ))}

            <defs>
              <linearGradient id="sales-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
            </defs>

            <path d={areaPath} fill="url(#sales-fill)" />
            <path
              d={linePath}
              fill="none"
              stroke="#4f46e5"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* X labels, thinned to whatever fits. */}
            {points.map((point, index) =>
              index % labelStride === 0 || index === points.length - 1 ? (
                <text
                  key={point.label + index}
                  x={scaleX(index)}
                  y={HEIGHT - 8}
                  textAnchor={
                    index === 0
                      ? "start"
                      : index === points.length - 1
                      ? "end"
                      : "middle"
                  }
                  className="fill-gray-400 text-[10px]"
                >
                  {point.label}
                </text>
              ) : null
            )}

            {cursor !== null && (
              <g>
                <line
                  x1={scaleX(cursor)}
                  x2={scaleX(cursor)}
                  y1={PADDING.top}
                  y2={PADDING.top + plotHeight}
                  stroke="#c7d2fe"
                  strokeWidth="1"
                />
                <circle
                  cx={scaleX(cursor)}
                  cy={scaleY(points[cursor][metric])}
                  r="4"
                  fill="#4f46e5"
                  stroke="#fff"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>

          {/* The tooltip reports both measures, not just the plotted one: the
              question "we took more money — from more orders, or bigger ones?"
              is the whole reason to hover a point. */}
          {active && (
            <div
              className="pointer-events-none absolute z-10 min-w-[9rem] -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg"
              style={{
                left: clamp(scaleX(cursor), 80, Math.max(80, width - 80)),
                top: 0,
              }}
              role="status"
            >
              <p className="font-medium">{active.label}</p>
              <p className="mt-1 flex justify-between gap-3 text-gray-300">
                <span>Revenue</span>
                <span className="font-medium tabular-nums text-white">
                  {formatMoney(active.revenue, currency)}
                </span>
              </p>
              <p className="flex justify-between gap-3 text-gray-300">
                <span>Orders</span>
                <span className="font-medium tabular-nums text-white">
                  {formatCount(active.orders)}
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* The same data as a table, for anyone who cannot read the plot. Visually
          hidden rather than absent, because "see the chart" is not an
          alternative for a screen reader. */}
      {hasData && (
        <table className="sr-only">
          <caption>
            {metric === "revenue" ? "Revenue" : "Orders"} per{" "}
            {period?.bucket || "day"} for {period?.label}
          </caption>
          <thead>
            <tr>
              <th scope="col">Period</th>
              <th scope="col">Revenue</th>
              <th scope="col">Orders</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point, index) => (
              <tr key={point.label + index}>
                <th scope="row">{point.label}</th>
                <td>{formatMoney(point.revenue, currency)}</td>
                <td>{formatCount(point.orders)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DashboardCard>
  );
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Round an axis maximum up to a readable number — 1, 2, 2.5 or 5 times a power
 * of ten — so the ticks are values a person would say out loud.
 */
function niceCeiling(peak) {
  if (!Number.isFinite(peak) || peak <= 0) return 0;
  const magnitude = 10 ** Math.floor(Math.log10(peak));
  const normalised = peak / magnitude;
  const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 2.5 ? 2.5 : normalised <= 5 ? 5 : 10;
  return step * magnitude;
}

function axisTicks(ceiling) {
  if (ceiling <= 0) return [0];
  return [0, ceiling / 4, ceiling / 2, (ceiling * 3) / 4, ceiling];
}

/** Axis labels need to be short; the tooltip carries the exact figure. */
function compactMoney(value, currency) {
  if (value >= 1000) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return formatMoney(value, currency);
}

/** The one-sentence description of the plot, for assistive technology. */
function chartSummary(points, metric, currency, period) {
  if (points.length === 0) return "No sales data for this period.";

  const first = points[0];
  const last = points[points.length - 1];
  const total = points.reduce((sum, point) => sum + point[metric], 0);
  const measure = metric === "revenue" ? "revenue" : "orders";
  const render = (value) =>
    metric === "revenue" ? formatMoney(value, currency) : formatCount(value);

  return `${measure} per ${period?.bucket || "day"} from ${first.label} to ${
    last.label
  }, totalling ${render(total)}. A table with every value follows.`;
}
