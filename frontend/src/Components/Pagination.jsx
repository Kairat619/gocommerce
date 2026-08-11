import { router } from "@inertiajs/react";

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

  const pages = [];
  for (let i = 1; i <= total; i++) {
    pages.push(i);
  }

  const btnBase =
    "flex h-11 min-w-[2.75rem] items-center justify-center px-3 text-label-sm font-semibold uppercase tracking-[0.08em] transition-colors";

  return (
    <nav className="mt-12 flex items-center justify-center gap-1.5">
      <button
        onClick={() => goTo(current - 1)}
        disabled={current <= 1}
        className={`${btnBase} border border-ink/15 text-ink hover:border-ink hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink`}
      >
        Prev
      </button>

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => goTo(p)}
          aria-current={p === current ? "page" : undefined}
          className={`${btnBase} ${
            p === current
              ? "bg-ink text-white"
              : "border border-ink/15 text-ink hover:border-ink hover:text-accent"
          }`}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => goTo(current + 1)}
        disabled={current >= total}
        className={`${btnBase} border border-ink/15 text-ink hover:border-ink hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink`}
      >
        Next
      </button>
    </nav>
  );
}
