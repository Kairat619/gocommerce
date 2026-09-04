import { Head, router, useForm } from "@inertiajs/react";
import { useState } from "react";
import StoreLayout from "../../Components/StoreLayout";
import Pagination from "../../Components/Pagination";
import Container from "../../Components/UI/Container";
import EmptyState from "../../Components/UI/EmptyState";
import ProductFilters from "../../Components/Commerce/ProductFilters";
import ProductGrid from "../../Components/Commerce/ProductGrid";
import { pageTitle } from "../../lib/brand";
import { asList, asPagination } from "../../lib/props";
import cn from "../../lib/cn";

/** @param {import('../../types/pages').ProductsIndexProps} props */
export default function ProductsIndex({
  products,
  categories,
  pagination,
  search,
  category,
  min_price,
  max_price,
}) {
  const items = asList(products);
  const categoryList = asList(categories);
  const pages = asPagination(pagination);

  // On a phone the filter panel sits above the grid, so it must collapse or
  // the shopper scrolls past a full form before seeing a single product.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data, setData } = useForm({
    q: search || "",
    category: category || "",
    min_price: min_price || "",
    max_price: max_price || "",
  });

  function buildParams(overrides = {}) {
    const merged = { ...data, ...overrides };
    const params = {};
    if (merged.q) params.q = merged.q;
    if (merged.category) params.category = merged.category;
    if (merged.min_price) params.min_price = merged.min_price;
    if (merged.max_price) params.max_price = merged.max_price;
    return params;
  }

  function visit(params) {
    router.get("/products", params, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onStart: () => setLoading(true),
      onFinish: () => setLoading(false),
    });
  }

  function selectCategory(slug) {
    setData("category", slug);
    visit(buildParams({ category: slug }));
  }

  function applyFilters(e) {
    e.preventDefault();
    visit(buildParams());
  }

  function clearFilters() {
    setData({ q: "", category: "", min_price: "", max_price: "" });
    visit({});
  }

  const activeFilterCount = [search, category, min_price, max_price].filter(
    Boolean
  ).length;
  const hasActiveFilters = activeFilterCount > 0;

  const activeCategory = categoryList.find((c) => c.slug === category);
  const heading = search
    ? `Results for "${search}"`
    : activeCategory
    ? activeCategory.name
    : "All Products";

  return (
    <StoreLayout full>
      <Head title={pageTitle("Shop")} />

      <section className="border-b border-ink/10 bg-white">
        <Container className="py-14 md:py-20">
          <span className="mb-3 block text-label-lg font-semibold uppercase tracking-[0.2em] text-accent">
            The Collection
          </span>
          <h1 className="text-display-lg text-ink">{heading}</h1>
          <p className="mt-3 text-body-md text-muted-foreground">
            {pages.total > 1
              ? `Page ${pages.current} of ${pages.total}`
              : `${items.length} product${
                  items.length !== 1 ? "s" : ""
                } available`}
          </p>
        </Container>
      </section>

      <Container className="gap-12 py-12 lg:flex">
        <aside className="mb-10 w-full flex-shrink-0 lg:mb-0 lg:w-64">
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            aria-expanded={filtersOpen}
            aria-controls="product-filters"
            className="flex w-full items-center justify-between border border-ink/20 px-4 py-3 text-label-lg font-semibold uppercase tracking-[0.1em] text-ink lg:hidden"
          >
            <span>
              Filters
              {activeFilterCount > 0 && ` (${activeFilterCount})`}
            </span>
            <span aria-hidden="true" className="text-outline">
              {filtersOpen ? "−" : "+"}
            </span>
          </button>

          <div
            id="product-filters"
            className={cn(
              "mt-6 lg:mt-0",
              filtersOpen ? "block" : "hidden lg:block"
            )}
          >
            <ProductFilters
              categories={categoryList}
              values={data}
              onChange={setData}
              onSelectCategory={selectCategory}
              onSubmit={applyFilters}
              onClear={clearFilters}
              showClear={hasActiveFilters}
            />
          </div>
        </aside>

        <div
          className={cn(
            "flex-1 transition-opacity duration-200",
            loading && "opacity-50"
          )}
          aria-busy={loading}
        >
          {items.length === 0 ? (
            <EmptyState
              title="No products found"
              description="Try adjusting your filters or browse the full collection."
            >
              <button
                onClick={clearFilters}
                className="text-label-lg font-semibold uppercase tracking-[0.08em] text-accent hover:underline"
              >
                View all products
              </button>
            </EmptyState>
          ) : (
            <ProductGrid products={items} columns="three" />
          )}

          <Pagination
            pagination={pages}
            searchParams={
              hasActiveFilters
                ? {
                    ...(data.q && { q: data.q }),
                    ...(data.category && { category: data.category }),
                    ...(data.min_price && { min_price: data.min_price }),
                    ...(data.max_price && { max_price: data.max_price }),
                  }
                : {}
            }
          />
        </div>
      </Container>
    </StoreLayout>
  );
}
