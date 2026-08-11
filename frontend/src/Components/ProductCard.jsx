import { Link, router } from "@inertiajs/react";

export default function ProductCard({ product, index = 0 }) {
  const inStock = product.stock_quantity > 0;
  const hasCompare =
    product.compare_at_price &&
    product.compare_at_price !== "0.00" &&
    Number(product.compare_at_price) > Number(product.price);

  const discount = hasCompare
    ? Math.round(
        ((Number(product.compare_at_price) - Number(product.price)) /
          Number(product.compare_at_price)) *
          100
      )
    : 0;

  function quickAdd(e) {
    e.preventDefault();
    if (!inStock) return;
    router.post(
      "/cart/add",
      { product_id: product.id, quantity: "1" },
      { preserveScroll: true }
    );
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block animate-fade-up"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="relative mb-5 aspect-[3/4] overflow-hidden bg-surface-container">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-outline">
            <svg
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
              />
            </svg>
          </div>
        )}

        <div className="absolute left-4 top-4 flex flex-col gap-2">
          {product.is_featured && (
            <span className="bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-ink">
              Exclusive
            </span>
          )}
          {discount > 0 && (
            <span className="bg-accent px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white">
              -{discount}% Off
            </span>
          )}
          {!inStock && (
            <span className="bg-ink px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white">
              Sold Out
            </span>
          )}
        </div>

        {inStock && (
          <button
            type="button"
            onClick={quickAdd}
            aria-label={`Add ${product.name} to bag`}
            className="absolute bottom-4 right-4 flex h-11 w-11 translate-y-2 items-center justify-center rounded-full bg-white text-ink opacity-0 shadow-sm transition-all duration-300 hover:bg-accent hover:text-white group-hover:translate-y-0 group-hover:opacity-100"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        <p className="text-label-sm uppercase tracking-[0.12em] text-outline">
          {product.category_name}
        </p>
        <h3 className="font-serif text-body-lg text-ink transition-colors line-clamp-1 group-hover:text-accent">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-headline-md font-semibold text-ink">
            ${product.price}
          </span>
          {hasCompare && (
            <span className="text-body-sm text-outline line-through">
              ${product.compare_at_price}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
