/**
 * Presentation helpers for the dashboard.
 *
 * Everything here formats a number the server already computed. Nothing sums,
 * averages, converts or re-derives a business figure: revenue, order counts,
 * averages and period deltas all arrive finished from
 * sql/queries/analytics.sql, and the moment this file started doing arithmetic
 * on them the dashboard would be free to disagree with the orders page.
 *
 * Money formatting goes through lib/money, like every other screen.
 */

/**
 * A whole-number count with thousands separators.
 *
 * Counts arrive as JSON numbers (bigint columns), so this is genuinely just
 * digit grouping.
 */
export function formatCount(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
    number
  );
}

/**
 * A period-over-period change, as the server computed it.
 *
 * `change` is null when the comparison period had a value of zero. That is not
 * an error and it is not zero growth — there is no percentage change from
 * nothing. Returning a distinct `unknown` state keeps "+100%" against an empty
 * baseline, the classic dashboard lie, off the screen entirely.
 *
 * @param {number|null|undefined} change percent, already rounded by the server
 */
export function describeChange(change) {
  if (change === null || change === undefined) {
    return { known: false, direction: "flat", label: "No prior data" };
  }

  const number = Number(change);
  if (!Number.isFinite(number)) {
    return { known: false, direction: "flat", label: "No prior data" };
  }

  // Exact zero is flat. Anything else keeps its sign, so a 0.1% dip still
  // reads as a dip rather than being rounded into "no change".
  const direction = number > 0 ? "up" : number < 0 ? "down" : "flat";
  const sign = number > 0 ? "+" : "";

  return {
    known: true,
    direction,
    value: number,
    label: `${sign}${number.toLocaleString(undefined, {
      maximumFractionDigits: 1,
    })}%`,
  };
}

/**
 * Tailwind classes and a text prefix for a direction.
 *
 * The prefix matters: colour alone must never carry the meaning, so every delta
 * renders an arrow glyph and a spoken word alongside the tint.
 */
const directionTones = {
  up: { tone: "text-emerald-700 bg-emerald-50", glyph: "↑", word: "up" },
  down: { tone: "text-rose-700 bg-rose-50", glyph: "↓", word: "down" },
  flat: { tone: "text-gray-600 bg-gray-100", glyph: "→", word: "unchanged" },
};

export function directionTone(direction) {
  return directionTones[direction] || directionTones.flat;
}

/**
 * Whether a direction is good news.
 *
 * Not every metric wants to go up. Discount given and cancelled orders rising
 * is not a win, so a card can flip the tint without flipping the arrow — the
 * arrow always describes the number, the tint describes the outcome.
 */
export function outcomeTone(direction, higherIsBetter = true) {
  if (direction === "flat") return directionTones.flat.tone;
  const good = higherIsBetter ? direction === "up" : direction === "down";
  return good ? directionTones.up.tone : directionTones.down.tone;
}

/** Percentage of a total, for distribution bars. Guards the empty store. */
export function share(count, total) {
  const numerator = Number(count) || 0;
  const denominator = Number(total) || 0;
  if (denominator <= 0) return 0;
  return (numerator / denominator) * 100;
}
