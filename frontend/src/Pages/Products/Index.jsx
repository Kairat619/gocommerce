import { Head, router, useForm } from "@inertiajs/react";
import StoreLayout from "../../Components/StoreLayout";
import ProductCard from "../../Components/ProductCard";
import Pagination from "../../Components/Pagination";
import Button from "../../Components/UI/Button";

export default function ProductsIndex({
  products,
  categories,
  pagination,
  search,
  category,
  min_price,
  max_price,
}) {
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

  const hasActiveFilters = category || min_price || max_price || search;

  const activeCategory = categories?.find((c) => c.slug === category);
  const heading = search
    ? `Results for "${search}"`
    : activeCategory
    ? activeCategory.name
    : "All Products";

  return (
    <StoreLayout full>
      <Head title="Shop | ShopNest" />

      {/* Editorial header */}
      <section className="border-b border-ink/10 bg-white">
        <div className="mx-auto max-w-screen-2xl px-4 py-14 md:px-8 md:py-20 lg:px-12">
          <span className="mb-3 block text-label-lg font-semibold uppercase tracking-[0.2em] text-accent">
            The Collection
          </span>
          <h1 className="text-display-lg text-ink">{heading}</h1>
          <p className="mt-3 text-body-md text-muted-foreground">
            {pagination.total > 1
              ? `Page ${pagination.current} of ${pagination.total}`
              : `${products.length} product${
                  products.length !== 1 ? "s" : ""
                } available`}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-screen-2xl gap-12 px-4 py-12 md:px-8 lg:flex lg:px-12">
        {/* Filters */}
        <aside className="mb-10 w-full flex-shrink-0 lg:mb-0 lg:w-64">
          <form onSubmit={applyFilters} className="space-y-8 lg:sticky lg:top-32">
            <div>
              <h3 className="mb-4 text-label-lg font-semibold uppercase tracking-[0.12em] text-ink">
                Search
              </h3>
              <input
                type="text"
                value={data.q}
                onChange={(e) => setData("q", e.target.value)}
                placeholder="Search curated styles..."
                className="w-full border border-ink/20 bg-white px-4 py-2.5 text-body-sm text-ink placeholder:text-outline focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>

            <div>
              <h3 className="mb-4 text-label-lg font-semibold uppercase tracking-[0.12em] text-ink">
                Categories
              </h3>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => selectCategory("")}
                  className={`block w-full py-1.5 text-left text-body-sm transition-colors ${
                    !data.category
                      ? "font-semibold text-accent"
                      : "text-muted-foreground hover:text-ink"
                  }`}
                >
                  All Categories
                </button>
                {categories?.map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => selectCategory(cat.slug)}
                    className={`flex w-full items-center justify-between py-1.5 text-left text-body-sm transition-colors ${
                      data.category === cat.slug
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
                <input
                  type="number"
                  value={data.min_price}
                  onChange={(e) => setData("min_price", e.target.value)}
                  placeholder="Min"
                  min="0"
                  className="no-spinner w-full border border-ink/20 bg-white px-3 py-2.5 text-body-sm text-ink placeholder:text-outline focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                />
                <span className="text-outline">&ndash;</span>
                <input
                  type="number"
                  value={data.max_price}
                  onChange={(e) => setData("max_price", e.target.value)}
                  placeholder="Max"
                  min="0"
                  className="no-spinner w-full border border-ink/20 bg-white px-3 py-2.5 text-body-sm text-ink placeholder:text-outline focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" variant="primary" size="sm" className="flex-1">
                Apply
              </Button>
              {hasActiveFilters && (
                <Button
                  type="button"
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                >
                  Clear
                </Button>
              )}
            </div>
          </form>
        </aside>

        {/* Grid */}
        <div className="flex-1">
          {products.length === 0 ? (
            <div className="border border-dashed border-ink/15 py-24 text-center">
              <p className="text-headline-md font-serif text-ink">
                No products found
              </p>
              <p className="mt-2 text-body-sm text-muted-foreground">
                Try adjusting your filters or browse the full collection.
              </p>
              <button
                onClick={clearFilters}
                className="mt-6 text-label-lg font-semibold uppercase tracking-[0.08em] text-accent hover:underline"
              >
                View all products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 xl:grid-cols-3">
              {products.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}

          <Pagination
            pagination={pagination}
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
      </div>
    </StoreLayout>
  );
}
