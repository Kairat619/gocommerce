import Breadcrumbs from "../Breadcrumbs";
import Pagination from "../Pagination";
import Container from "../UI/Container";
import EmptyState from "../UI/EmptyState";
import Icon from "../UI/Icon";
import ProductGrid from "../Commerce/ProductGrid";
import cn from "../../lib/cn";
import ActiveFilterBar from "./ActiveFilterBar";
import CatalogFilterPanel from "./CatalogFilterPanel";

/**
 * The marketplace presentation of the catalogue: breadcrumb and title, active
 * filter chips, a card-style filter sidebar and a dense product grid.
 *
 * Purely presentational. Pages/Products/Index owns the filter state and every
 * visit, and hands this component the results plus callbacks.
 *
 * The server reports how many PAGES there are, not how many products, so the
 * result line counts this page's range rather than claiming a grand total.
 */
const PER_PAGE = 12;

function resultSummary(pages, count) {
  if (pages.total <= 1) {
    return `Showing ${count} product${count !== 1 ? "s" : ""}`;
  }
  const first = (pages.current - 1) * PER_PAGE + 1;
  const last = first + count - 1;
  return `Showing ${first}–${last} · Page ${pages.current} of ${pages.total}`;
}

export default function MarketplaceCatalog({
  heading,
  breadcrumbs,
  items,
  categories,
  pages,
  values,
  onChange,
  onSelectCategory,
  onSubmit,
  onClear,
  activeFilters,
  onRemoveFilter,
  loading,
  searchParams,
  filtersOpen,
  onToggleFilters,
}) {
  const summary = resultSummary(pages, items.length);

  return (
    <Container className="py-6 md:py-8">
      <Breadcrumbs items={breadcrumbs} look="marketplace" className="mb-4" />

      <header className="mb-5">
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-ink md:text-[40px] md:leading-[48px]">
          {heading}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse {categories.length} categor{categories.length === 1 ? "y" : "ies"} —
          filter by keyword, category or price.
        </p>
      </header>

      <ActiveFilterBar
        filters={activeFilters}
        onRemove={onRemoveFilter}
        onClear={onClear}
      />

      <div className="mt-5 gap-5 lg:flex">
        <aside
          id="catalog-filters"
          aria-label="Filters"
          className={cn(
            "mb-5 w-full shrink-0 lg:mb-0 lg:block lg:w-64",
            filtersOpen ? "block" : "hidden"
          )}
        >
          <CatalogFilterPanel
            categories={categories}
            values={values}
            onChange={onChange}
            onSelectCategory={onSelectCategory}
            onSubmit={onSubmit}
          />
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
            <p className="text-[13px] text-muted-foreground" aria-live="polite">
              {summary}
            </p>
            <button
              type="button"
              onClick={onToggleFilters}
              aria-expanded={filtersOpen}
              aria-controls="catalog-filters"
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-surface-container px-3 py-1.5 text-[13px] font-bold text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:hidden"
            >
              <Icon name="menu" className="h-4 w-4" />
              Filters
              {activeFilters.length > 0 && ` (${activeFilters.length})`}
            </button>
          </div>

          <div
            className={cn("transition-opacity duration-200", loading && "opacity-50")}
            aria-busy={loading}
          >
            {items.length === 0 ? (
              <div className="rounded-xl bg-white shadow-sm">
                <EmptyState
                  title="No products found"
                  description="Try a different keyword, another category or a wider price range."
                >
                  <button
                    type="button"
                    onClick={onClear}
                    className="rounded-lg bg-accent px-5 py-2.5 text-[13px] font-bold text-white hover:bg-accent/90"
                  >
                    View all products
                  </button>
                </EmptyState>
              </div>
            ) : (
              <ProductGrid products={items} columns="marketplace" spacing="compact" />
            )}
          </div>

          {pages.total > 1 && (
            <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-[13px] text-muted-foreground">{summary}</p>
              <Pagination pagination={pages} searchParams={searchParams} look="pill" />
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
