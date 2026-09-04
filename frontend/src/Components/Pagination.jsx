import { router } from "@inertiajs/react";
import cn from "../lib/cn";

/**
 * Page navigation.
 *
 * Windows the page list rather than rendering every page: a catalogue with
 * fifty pages produced fifty buttons, which wrapped into a wall on a phone.
 * Shows first, last, and the current page with a neighbour either side,
 * collapsing the gaps.
 *
 * @param {Object} props
 * @param {import('../types/commerce').Pagination} props.pagination
 * @param {Record<string, string>} [props.searchParams] filters to preserve
 */
const GAP = "gap";

function pageWindow(current, total, radius = 1) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set([1, total]);
  for (let p = current - radius; p <= current + radius; p += 1) {
    if (p > 1 && p < total) pages.add(p);
  }

  const ordered = [...pages].sort((a, b) => a - b);
  const withGaps = [];

  ordered.forEach((page, index) => {
    if (index > 0 && page - ordered[index - 1] > 1) withGaps.push(GAP);
    withGaps.push(page);
  });

  return withGaps;
}

const btnBase =
  "flex h-11 min-w-[2.75rem] items-center justify-center px-3 text-label-sm font-semibold uppercase tracking-[0.08em] transition-colors";

export default function Pagination({ pagination, searchParams }) {
  const { current, total } = pagination;

  if (total <= 1) return null;

  const goTo = (page) => {
    const params = new URLSearchParams(searchParams || {});
    if (page > 1) {
      params.set("page", page.toString());
    } else {
      params.delete("page");
    }
    const qs = params.toString();
    router.get(
      window.location.pathname + (qs ? `?${qs}` : ""),
      {},
      { preserveScroll: true }
    );
  };

  const items = pageWindow(current, total);

  return (
    <nav
      aria-label="Pagination"
      className="mt-12 flex flex-wrap items-center justify-center gap-1.5"
    >
      <button
        type="button"
        onClick={() => goTo(current - 1)}
        disabled={current <= 1}
        aria-label="Previous page"
        className={cn(
          btnBase,
          "border border-ink/15 text-ink hover:border-ink hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink"
        )}
      >
        Prev
      </button>

      {items.map((item, index) =>
        item === GAP ? (
          <span
            key={`gap-${index}`}
            aria-hidden="true"
            className="px-1 text-outline"
          >
            &hellip;
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => goTo(item)}
            aria-current={item === current ? "page" : undefined}
            aria-label={`Page ${item}`}
            className={cn(
              btnBase,
              item === current
                ? "bg-ink text-white"
                : "border border-ink/15 text-ink hover:border-ink hover:text-accent"
            )}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => goTo(current + 1)}
        disabled={current >= total}
        aria-label="Next page"
        className={cn(
          btnBase,
          "border border-ink/15 text-ink hover:border-ink hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink"
        )}
      >
        Next
      </button>
    </nav>
  );
}
