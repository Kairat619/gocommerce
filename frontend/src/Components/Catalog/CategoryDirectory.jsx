import { Link } from "@inertiajs/react";
import { useMemo, useState } from "react";
import Breadcrumbs from "../Breadcrumbs";
import Container from "../UI/Container";
import Icon from "../UI/Icon";
import { excerpt } from "../../lib/html";
import { categoryImage } from "../../lib/image";

/**
 * The marketplace category directory: every category as a card with a round
 * avatar, its product count and a short description, plus a name filter for
 * stores with many categories.
 *
 * @param {Object} props
 * @param {import('../../types/commerce').Category[]} props.categories
 */
export default function CategoryDirectory({ categories }) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return categories;
    return categories.filter((cat) => cat.name.toLowerCase().includes(needle));
  }, [categories, query]);

  const totalProducts = categories.reduce(
    (sum, cat) => sum + (Number(cat.product_count) || 0),
    0
  );

  return (
    <Container className="py-6 md:py-8">
      <Breadcrumbs
        look="marketplace"
        className="mb-3"
        items={[{ label: "Shop", href: "/products" }, { label: "All Categories" }]}
      />

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-ink md:text-[40px] md:leading-[48px]">
              All Categories
            </h1>
            <span className="rounded-lg bg-surface-container px-2.5 py-1 text-[13px] font-bold text-accent">
              {categories.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalProducts} product{totalProducts !== 1 ? "s" : ""} across{" "}
            {categories.length} categor{categories.length === 1 ? "y" : "ies"}.
          </p>
        </div>

        {categories.length > 6 && (
          <div className="relative w-full md:max-w-xs">
            <label htmlFor="category-filter" className="sr-only">
              Find a category
            </label>
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
            />
            <input
              id="category-filter"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a category..."
              className="w-full rounded-lg border border-transparent bg-white py-2.5 pl-9 pr-3 text-sm text-ink shadow-sm placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-base font-bold text-ink">No category matches "{query}"</p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-3 text-[13px] font-bold text-accent hover:underline"
          >
            Show all categories
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((cat) => {
            const blurb = excerpt(cat.description, 90);
            const count = Number(cat.product_count) || 0;
            return (
              <li key={cat.slug}>
                <Link
                  href={`/categories/${cat.slug}`}
                  className="group flex h-full items-center gap-4 rounded-xl border border-transparent bg-white p-4 shadow-sm transition-all hover:border-accent-soft hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full bg-surface-container p-1 transition-transform duration-300 group-hover:scale-105 md:h-[88px] md:w-[88px]">
                    <img
                      src={categoryImage(cat, 176, 176)}
                      alt=""
                      loading="lazy"
                      className="h-full w-full rounded-full object-cover"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-bold leading-6 text-ink transition-colors group-hover:text-accent">
                      {cat.name}
                    </span>
                    <span className="mt-0.5 inline-block rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-bold text-muted-foreground">
                      {count} product{count !== 1 ? "s" : ""}
                    </span>
                    {blurb && (
                      <span className="mt-1.5 line-clamp-2 block text-[13px] leading-[18px] text-muted-foreground">
                        {blurb}
                      </span>
                    )}
                  </span>
                  <Icon
                    name="chevronRight"
                    className="h-5 w-5 shrink-0 text-outline transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
