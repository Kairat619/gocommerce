import { Link } from "@inertiajs/react";

import cn from "../../../lib/cn";
import { describeChange, directionTone, outcomeTone } from "./dashboardFormat";

/**
 * One executive KPI.
 *
 * A number on its own is not information. Every card here answers four
 * questions at once, which is the difference between a statistic and a signal:
 *
 *   what it is        the label
 *   how much          the value
 *   over what         the period, stated on the card and not just above it
 *   versus what       the delta, with the comparison window named
 *
 * The delta shows an arrow glyph and a written direction as well as a tint, so
 * the card still reads correctly in greyscale and to a screen reader. Colour
 * never carries the meaning on its own.
 *
 * `higherIsBetter` exists because not every metric wants to grow. The arrow
 * always describes the number; the tint describes whether that is good news.
 */
export default function KpiCard({
  label,
  value,
  previous,
  change,
  periodLabel,
  comparisonLabel,
  href,
  hint,
  higherIsBetter = true,
  accent = "indigo",
  icon,
}) {
  const delta = describeChange(change);
  const glyph = directionTone(delta.direction);
  const tint = delta.known
    ? outcomeTone(delta.direction, higherIsBetter)
    : "bg-gray-100 text-gray-600";

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-gray-900">
            {value}
          </p>
        </div>

        {icon && (
          <span
            aria-hidden="true"
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              accents[accent] || accents.indigo
            )}
          >
            {icon}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
            tint
          )}
        >
          <span aria-hidden="true">{delta.known ? glyph.glyph : "—"}</span>
          {delta.label}
          {/* Spoken alongside the arrow so the direction is never conveyed by
              colour or a glyph alone. */}
          {delta.known && <span className="sr-only">{glyph.word}</span>}
        </span>

        <span className="text-xs text-gray-500">
          {delta.known && previous !== undefined && previous !== null
            ? `from ${previous}`
            : comparisonLabel}
        </span>
      </div>

      <p className="mt-2 text-xs text-gray-400">
        {periodLabel}
        {hint ? ` · ${hint}` : ""}
      </p>
    </>
  );

  const shell =
    "block rounded-xl bg-white p-5 text-left shadow-sm ring-1 ring-gray-200";

  // A KPI that names a management page becomes the way into it — the card is
  // the question, that page is the answer.
  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          shell,
          "transition hover:ring-indigo-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        )}
      >
        {body}
      </Link>
    );
  }

  return <div className={shell}>{body}</div>;
}

const accents = {
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  sky: "bg-sky-50 text-sky-600",
  violet: "bg-violet-50 text-violet-600",
};
