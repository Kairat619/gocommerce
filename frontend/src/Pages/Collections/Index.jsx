import { Head, Link } from "@inertiajs/react";
import StoreLayout from "../../Components/StoreLayout";
import Button from "../../Components/UI/Button";
import EmptyState from "../../Components/UI/EmptyState";
import { excerpt } from "../../lib/html";
import { collectionImage } from "../../lib/image";
import { pageTitle } from "../../lib/brand";
import { asList } from "../../lib/props";

export default function CollectionsIndex({ collections }) {
  const items = asList(collections);

  // Featured collections lead. Within each group the server has already applied
  // sort_order then name, so the order here is the merchant's own.
  const ordered = [...items].sort((a, b) => Number(b.is_featured) - Number(a.is_featured));

  return (
    <StoreLayout>
      <Head title={pageTitle("Collections")} />

      <div className="mb-12">
        <span className="mb-3 block text-label-lg font-semibold uppercase tracking-[0.2em] text-accent">
          Curated Edits
        </span>
        <h1 className="text-display-lg text-ink">Collections</h1>
        <p className="mt-3 max-w-xl text-body-md text-muted-foreground">
          Hand-picked groupings from across the catalogue — put together for a season, an occasion or a room.
        </p>
      </div>

      {ordered.length === 0 ? (
        <EmptyState
          title="No collections yet"
          description="Our curated edits are on their way. In the meantime, browse the full catalogue by category."
        >
          <Button href="/categories" variant="primary" size="md">
            Shop by Category
          </Button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {ordered.map((collection) => (
            <Link
              key={collection.slug}
              href={`/collections/${collection.slug}`}
              className="group relative aspect-[4/5] overflow-hidden bg-surface-container"
            >
              <img
                src={collectionImage(collection, 900, 1100)}
                alt={collection.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />

              {collection.is_featured && (
                <span className="absolute left-4 top-4 bg-white/95 px-2.5 py-1 text-label-sm font-semibold uppercase tracking-[0.12em] text-ink">
                  Featured
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 p-6">
                <h2 className="font-serif text-headline-lg text-white">{collection.name}</h2>
                {collection.description && (
                  <p className="mt-1 line-clamp-2 max-w-xs text-body-sm text-white/80">
                    {excerpt(collection.description)}
                  </p>
                )}
                <span className="mt-3 inline-flex items-center gap-2 text-label-sm font-semibold uppercase tracking-[0.12em] text-white">
                  {collection.product_count} item{Number(collection.product_count) !== 1 ? "s" : ""}
                  <span className="transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </StoreLayout>
  );
}
