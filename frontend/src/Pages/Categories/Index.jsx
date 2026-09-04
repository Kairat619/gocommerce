import { Head, Link } from "@inertiajs/react";
import StoreLayout from "../../Components/StoreLayout";
import { decorativeImage } from "../../lib/image";
import { pageTitle } from "../../lib/brand";

export default function CategoriesIndex({ categories }) {
  return (
    <StoreLayout>
      <Head title={pageTitle("Collections")} />

      <div className="mb-12">
        <span className="mb-3 block text-label-lg font-semibold uppercase tracking-[0.2em] text-accent">
          Curated Categories
        </span>
        <h1 className="text-display-lg text-ink">Browse Collections</h1>
        <p className="mt-3 max-w-xl text-body-md text-muted-foreground">
          Explore our thoughtfully curated collections, each hand-selected for
          modern living.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/categories/${cat.slug}`}
            className="group relative aspect-[4/5] overflow-hidden bg-surface-container"
          >
            <img
              src={decorativeImage(`category-${cat.slug}`, 900, 1100)}
              alt={cat.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <h2 className="font-serif text-headline-lg text-white">
                {cat.name}
              </h2>
              {cat.description && (
                <p className="mt-1 line-clamp-2 max-w-xs text-body-sm text-white/80">
                  {cat.description}
                </p>
              )}
              <span className="mt-3 inline-flex items-center gap-2 text-label-sm font-semibold uppercase tracking-[0.12em] text-white">
                {cat.product_count} item{cat.product_count !== 1 ? "s" : ""}
                <span className="transition-transform duration-200 group-hover:translate-x-1">
                  &rarr;
                </span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </StoreLayout>
  );
}
