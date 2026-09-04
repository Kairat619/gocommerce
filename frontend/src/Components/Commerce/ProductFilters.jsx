import Button from "../UI/Button";
import Input from "../UI/Input";

/**
 * The catalogue filter panel: search, category list, price range.
 *
 * Deliberately presentational — it holds no state and performs no navigation.
 * The page owns the filter values and decides what a visit looks like, because
 * those values are page data that also drive the heading and the pagination
 * links. This component only reports intent.
 *
 * @param {Object} props
 * @param {import('../../types/commerce').Category[]} props.categories
 * @param {{q: string, category: string, min_price: string, max_price: string}} props.values
 * @param {(field: string, value: string) => void} props.onChange
 * @param {(slug: string) => void} props.onSelectCategory
 * @param {(event: React.FormEvent) => void} props.onSubmit
 * @param {() => void} props.onClear
 * @param {boolean} [props.showClear]
 */
export default function ProductFilters({
  categories,
  values,
  onChange,
  onSelectCategory,
  onSubmit,
  onClear,
  showClear = false,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-8 lg:sticky lg:top-32">
      <div>
        <h3 className="mb-4 text-label-lg font-semibold uppercase tracking-[0.12em] text-ink">
          Search
        </h3>
        <Input
          type="text"
          value={values.q}
          onChange={(e) => onChange("q", e.target.value)}
          placeholder="Search curated styles..."
          aria-label="Search products"
        />
      </div>

      <div>
        <h3 className="mb-4 text-label-lg font-semibold uppercase tracking-[0.12em] text-ink">
          Categories
        </h3>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onSelectCategory("")}
            className={`block w-full py-1.5 text-left text-body-sm transition-colors ${
              !values.category
                ? "font-semibold text-accent"
                : "text-muted-foreground hover:text-ink"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => onSelectCategory(cat.slug)}
              className={`flex w-full items-center justify-between py-1.5 text-left text-body-sm transition-colors ${
                values.category === cat.slug
                  ? "font-semibold text-accent"
                  : "text-muted-foreground hover:text-ink"
              }`}
            >
              <span>{cat.name}</span>
              <span className="text-label-sm text-outline">
                {cat.product_count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-label-lg font-semibold uppercase tracking-[0.12em] text-ink">
          Price Range
        </h3>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={values.min_price}
            onChange={(e) => onChange("min_price", e.target.value)}
            placeholder="Min"
            min="0"
            size="sm"
            className="no-spinner"
            aria-label="Minimum price"
          />
          <span className="text-outline">&ndash;</span>
          <Input
            type="number"
            value={values.max_price}
            onChange={(e) => onChange("max_price", e.target.value)}
            placeholder="Max"
            min="0"
            size="sm"
            className="no-spinner"
            aria-label="Maximum price"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm" className="flex-1">
          Apply
        </Button>
        {showClear && (
          <Button type="button" onClick={onClear} variant="outline" size="sm">
            Clear
          </Button>
        )}
      </div>
    </form>
  );
}
