import { Link, router } from "@inertiajs/react";
import Badge from "../UI/Badge";
import Price from "./Price";
import { comparePrice, discountPercent, isInStock } from "../../lib/product";
import { productImage } from "../../lib/image";
import { useComponentVariant } from "../../theme/ThemeProvider";
import cn from "../../lib/cn";

/**
 * Image proportions come from the theme by NAME; the class strings live here
 * so Tailwind can see them.
 */
const aspects = {
  portrait: "aspect-[3/4]",
  square: "aspect-square",
};

/**
 * `editorial` is the borderless, image-led card; `tile` is the dense
 * marketplace card — a white panel with the image inset on a tinted ground.
 */
const looks = {
  editorial: {
    root: "group block animate-fade-up",
    media: "relative mb-5 overflow-hidden bg-surface-container",
    image:
      "h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105",
    badges: "absolute left-4 top-4 flex flex-col gap-2",
    discountTone: "accent",
    discountLabel: "% Off",
    body: "space-y-1.5",
    eyebrow: "text-label-sm uppercase tracking-[0.12em] text-outline",
    title:
      "font-serif text-body-lg text-ink transition-colors line-clamp-1 group-hover:text-accent",
    inlineAdd: false,
  },
  tile: {
    root: "group flex h-full flex-col rounded-xl bg-white p-3 shadow-sm transition-shadow animate-fade-up hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
    media: "relative mb-3 overflow-hidden rounded-lg bg-muted",
    image:
      "h-full w-full object-cover transition-transform duration-300 group-hover:scale-105",
    badges: "absolute left-2 top-2 flex flex-col items-start gap-1",
    discountTone: "danger",
    discountLabel: "%",
    body: "flex flex-1 flex-col gap-1",
    eyebrow: "text-[11px] font-bold uppercase tracking-wider text-accent",
    title:
      "text-[13px] font-semibold leading-snug text-ink transition-colors line-clamp-2 group-hover:text-accent",
    inlineAdd: true,
  },
};

/** At or below this many units, the tile card says how many are left. */
const LOW_STOCK = 5;

const plusIcon = (
  <svg
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

export default function ProductCard({ product, index = 0 }) {
  const { aspect, look: lookName } = useComponentVariant("ProductCard", {
    aspect: "portrait",
    look: "editorial",
  });
  const look = looks[lookName] || looks.editorial;
  const inStock = isInStock(product);
  const compareAt = comparePrice(product);
  const discount = discountPercent(product);
  const image = productImage(product);

  const stock = Number(product?.stock_quantity ?? 0);
  const lowStock = inStock && stock <= LOW_STOCK;

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
      className={look.root}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div
        className={cn(
          look.media,
          aspects[aspect] || aspects.portrait
        )}
      >
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className={look.image}
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

        <div className={look.badges}>
          {product.is_featured && (
            <Badge tone="neutral" size="sm">
              Exclusive
            </Badge>
          )}
          {discount > 0 && (
            <Badge tone={look.discountTone} size="sm">
              -{discount}
              {look.discountLabel}
            </Badge>
          )}
          {!inStock && (
            <Badge tone="ink" size="sm">
              Sold Out
            </Badge>
          )}
        </div>

        {inStock && !look.inlineAdd && (
          <button
            type="button"
            onClick={quickAdd}
            aria-label={`Add ${product.name} to bag`}
            className="absolute bottom-4 right-4 flex h-11 w-11 translate-y-2 items-center justify-center rounded-full bg-white text-ink opacity-0 shadow-sm transition-all duration-300 hover:bg-accent hover:text-white group-hover:translate-y-0 group-hover:opacity-100"
          >
            {plusIcon}
          </button>
        )}
      </div>

      <div className={look.body}>
        <p className={look.eyebrow}>{product.category_name}</p>
        <h3 className={look.title}>
          {product.name}
        </h3>
        {look.inlineAdd ? (
          <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
            <div className="min-w-0">
              <Price amount={product.price} compareAt={compareAt} size="md" className="flex-wrap gap-x-1.5" />
              {(lowStock || !inStock) && (
                <p className="text-[11px] font-semibold text-orange-600">
                  {inStock ? `Only ${stock} left` : "Out of stock"}
                </p>
              )}
            </div>
            {inStock && (
              <button
                type="button"
                onClick={quickAdd}
                aria-label={`Add ${product.name} to bag`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent transition-colors hover:bg-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {plusIcon}
              </button>
            )}
          </div>
        ) : (
          <Price amount={product.price} compareAt={compareAt} size="md" className="pt-1" />
        )}
      </div>
    </Link>
  );
}
