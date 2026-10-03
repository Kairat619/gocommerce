import { Link } from "@inertiajs/react";
import Breadcrumbs from "../Breadcrumbs";
import Pagination from "../Pagination";
import ProductGrid from "../Commerce/ProductGrid";
import Container from "../UI/Container";
import Icon from "../UI/Icon";
import { resultSummary } from "../../lib/catalog";
import { categoryImage } from "../../lib/image";

/**
 * One category's products, marketplace style: a header card with the
 * category's avatar and description, then the dense product grid.
 *
 * The category page receives no product total (only a page count), so the
 * result line comes from lib/catalog.
 *
 * @param {Object} props
 * @param {import('../../types/commerce').Category} props.category
 * @param {import('../../types/commerce').CategoryProductItem[]} props.items
 * @param {import('../../types/commerce').Pagination} props.pages
 */
export default function CategoryListing({ category, items, pages }) {
  const summary = resultSummary(pages, items.length);

  return (
    <Container className="py-6 md:py-8">
      <Breadcrumbs
        look="marketplace"
        className="mb-4"
        items={[
          { label: "Shop", href: "/products" },
          { label: "Categories", href: "/categories" },
          { label: category.name },
        ]}
      />

      <header className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm sm:flex-row sm:items-center md:p-6">
        <span className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-surface-container p-1 md:h-24 md:w-24">
          <img
            src={categoryImage(category, 192, 192)}
            alt=""
            className="h-full w-full rounded-full object-cover"
          />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-ink md:text-[36px] md:leading-[44px]">
            {category.name}
          </h1>
          {category.description && (
            <div
              className="prose-product mt-1 max-w-3xl text-sm leading-6 text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: category.description }}
            />
          )}
        </div>
        <Link
          href={`/products?category=${encodeURIComponent(category.slug)}`}
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-surface-container px-4 py-2.5 text-[13px] font-bold text-accent transition-colors hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:self-center"
        >
          <Icon name="search" className="h-4 w-4" />
          Filter in Shop
        </Link>
      </header>

      {items.length === 0 ? (
        <div className="mt-5 flex flex-col items-center rounded-2xl bg-white px-6 py-16 text-center shadow-sm">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container text-accent">
            <Icon name="bag" className="h-8 w-8" />
          </span>
          <h2 className="mt-4 text-xl font-extrabold text-ink">Nothing here yet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            This category has no products right now. Browse the full catalogue in the meantime.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-accent px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Browse All Products
            <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-3 mt-5 flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
            <p className="text-[13px] text-muted-foreground" aria-live="polite">
              {summary}
            </p>
            <Link
              href="/categories"
              className="flex shrink-0 items-center gap-1 rounded text-[13px] font-bold text-accent hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              All Categories
              <Icon name="chevronRight" className="h-4 w-4" />
            </Link>
          </div>

          <ProductGrid products={items} columns="marketplace" spacing="compact" />

          {pages.total > 1 && (
            <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-[13px] text-muted-foreground">{summary}</p>
              <Pagination pagination={pages} look="pill" />
            </div>
          )}
        </>
      )}
    </Container>
  );
}
