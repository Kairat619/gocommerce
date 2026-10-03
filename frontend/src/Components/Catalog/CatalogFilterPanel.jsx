import Icon from "../UI/Icon";
import cn from "../../lib/cn";

/**
 * The marketplace catalogue sidebar: search, categories and price, each on its
 * own card.
 *
 * Like ProductFilters it is presentational — the page owns the values and the
 * visits. The design's brand, rating and fulfilment filters are not here: the
 * catalogue endpoint filters on search, category and price only, and a
 * checkbox that changes nothing would mislead the shopper.
 *
 * @param {Object} props
 * @param {import('../../types/commerce').Category[]} props.categories
 * @param {{q: string, category: string, min_price: string, max_price: string}} props.values
 * @param {(field: string, value: string) => void} props.onChange
 * @param {(slug: string) => void} props.onSelectCategory
 * @param {(event: React.FormEvent) => void} props.onSubmit
 */
const card = "rounded-xl bg-white p-4 shadow-sm";
const cardTitle = "mb-3 flex items-center justify-between text-[15px] font-bold text-ink";
const field =
  "w-full rounded-lg border-0 bg-muted px-3 py-2 text-sm text-ink placeholder:text-outline focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent";

export default function CatalogFilterPanel({
  categories,
  values,
  onChange,
  onSelectCategory,
  onSubmit,
}) {
  const totalProducts = categories.reduce(
    (sum, cat) => sum + (Number(cat.product_count) || 0),
    0
  );

  const categoryRows = [
    { slug: "", name: "All Categories", count: totalProducts },
    ...categories.map((cat) => ({
      slug: cat.slug,
      name: cat.name,
      count: cat.product_count,
    })),
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-3 lg:sticky lg:top-32">
      <div className={card}>
        <label htmlFor="catalog-search" className={cardTitle}>
          Search
        </label>
        <div className="relative flex items-center">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 h-4 w-4 text-outline"
          />
          <input
            id="catalog-search"
            type="search"
            value={values.q}
            onChange={(e) => onChange("q", e.target.value)}
            placeholder="Search this catalogue..."
            className={cn(field, "pl-9")}
          />
        </div>
      </div>

      <div className={card}>
        <h2 className={cardTitle}>
          <span className="flex items-center gap-2">
            <Icon name="menu" className="h-5 w-5 text-accent" />
            Categories
          </span>
          <span className="rounded-md bg-surface-container px-2 py-0.5 text-[11px] font-bold text-accent">
            {categories.length}
          </span>
        </h2>
        <ul className="space-y-0.5">
          {categoryRows.map((row) => {
            const active = (values.category || "") === row.slug;
            return (
              <li key={row.slug || "all"}>
                <button
                  type="button"
                  onClick={() => onSelectCategory(row.slug)}
                  aria-pressed={active}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    active
                      ? "bg-surface-container font-bold text-accent"
                      : "text-muted-foreground hover:bg-muted hover:text-ink"
                  )}
                >
                  <span>{row.name}</span>
                  {row.count != null && (
                    <span
                      className={cn(
                        "text-[11px]",
                        active ? "font-bold text-accent" : "text-outline"
                      )}
                    >
                      {row.count}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={card}>
        <h2 className={cardTitle}>Price Range</h2>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-outline">
              Min
            </span>
            <input
              type="number"
              min="0"
              inputMode="decimal"
              value={values.min_price}
              onChange={(e) => onChange("min_price", e.target.value)}
              placeholder="0"
              className={cn(field, "no-spinner")}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-outline">
              Max
            </span>
            <input
              type="number"
              min="0"
              inputMode="decimal"
              value={values.max_price}
              onChange={(e) => onChange("max_price", e.target.value)}
              placeholder="Any"
              className={cn(field, "no-spinner")}
            />
          </label>
        </div>
        <button
          type="submit"
          className="mt-3 w-full rounded-lg bg-accent px-4 py-2.5 text-[13px] font-bold text-white shadow-sm transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 active:scale-[0.98]"
        >
          Apply Filters
        </button>
      </div>
    </form>
  );
}
