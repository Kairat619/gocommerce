import { Link, router } from "@inertiajs/react";
import Badge from "../UI/Badge";
import Price from "./Price";
import { comparePrice, discountPercent, isInStock } from "../../lib/product";
import { productImage } from "../../lib/image";

export default function ProductCard({ product, index = 0 }) {
  const inStock = isInStock(product);
  const compareAt = comparePrice(product);
  const discount = discountPercent(product);
  const image = productImage(product);

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
        {image ? (
          <img
            src={image}
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
            <Badge tone="neutral" size="sm">
              Exclusive
            </Badge>
          )}
          {discount > 0 && (
            <Badge tone="accent" size="sm">
              -{discount}% Off
            </Badge>
          )}
          {!inStock && (
            <Badge tone="ink" size="sm">
              Sold Out
            </Badge>
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
        <Price
          amount={product.price}
          compareAt={compareAt}
          size="md"
          className="pt-1"
        />
      </div>
    </Link>
  );
}
