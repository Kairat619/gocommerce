import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import StoreLayout from "../../Components/StoreLayout";
import Button from "../../Components/UI/Button";
import ProductCard from "../../Components/ProductCard";

export default function ProductsShow({
  product,
  images,
  variants,
  related_products,
}) {
  const { flash } = usePage().props;
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeImage, setActiveImage] = useState(product.image_url || null);
  const inStock = product.stock_quantity > 0;

  const displayPrice = selectedVariant?.price || product.price;
  const hasComparePrice =
    product.compare_at_price &&
    product.compare_at_price !== "0.00" &&
    Number(product.compare_at_price) > Number(product.price);

  const discount = hasComparePrice
    ? Math.round(
        ((Number(product.compare_at_price) - Number(product.price)) /
          Number(product.compare_at_price)) *
          100
      )
    : 0;

  const gallery = [];
  if (product.image_url) gallery.push({ id: "main", url: product.image_url });
  (images || []).forEach((img) => gallery.push(img));

  function addToCart() {
    router.post(
      "/cart/add",
      { product_id: product.id, quantity: quantity.toString() },
      { preserveScroll: true }
    );
  }

  const heroImage = activeImage || product.image_url;

  return (
    <StoreLayout>
      <Head title={`${product.name} | ShopNest`} />

      <nav className="mb-8 flex items-center gap-2 text-label-sm uppercase tracking-[0.1em] text-outline">
        <Link href="/products" className="transition-colors hover:text-accent">
          Shop
        </Link>
        <span>/</span>
        <Link
          href={`/categories/${product.category_slug}`}
          className="transition-colors hover:text-accent"
        >
          {product.category_name}
        </Link>
        <span>/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      {flash?.success && (
        <div className="mb-6 border-l-4 border-green-500 bg-white p-4 text-body-sm text-green-800 shadow-sm">
          {flash.success}
        </div>
      )}
      {flash?.error && (
        <div className="mb-6 border-l-4 border-red-500 bg-white p-4 text-body-sm text-red-800 shadow-sm">
          {flash.error}
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <div className="flex flex-col-reverse gap-4 md:flex-row">
          {gallery.length > 1 && (
            <div className="flex gap-3 md:flex-col">
              {gallery.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(img.url)}
                  className={`aspect-[3/4] w-16 overflow-hidden bg-surface-container transition-all md:w-20 ${
                    heroImage === img.url
                      ? "ring-2 ring-ink ring-offset-2 ring-offset-surface"
                      : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.alt_text || product.name}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="group relative flex-1 overflow-hidden bg-surface-container">
            <div className="aspect-[3/4] w-full">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-outline">
                  <svg
                    className="h-20 w-20"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="0.75"
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
            </div>
            {discount > 0 && (
              <span className="absolute left-4 top-4 bg-accent px-3 py-1 text-label-sm font-semibold uppercase tracking-[0.15em] text-white">
                -{discount}% Off
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <span className="mb-3 text-label-lg font-semibold uppercase tracking-[0.2em] text-accent">
            {product.category_name}
          </span>
          <h1 className="text-display-md text-ink">{product.name}</h1>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-headline-lg font-semibold text-ink">
              ${displayPrice}
            </span>
            {hasComparePrice && !selectedVariant && (
              <span className="text-body-lg text-outline line-through">
                ${product.compare_at_price}
              </span>
            )}
          </div>

          {product.description && (
            <div
              className="prose-product mt-6 max-w-prose text-body-md leading-relaxed text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}

          {variants && variants.length > 0 && (
            <div className="mt-8">
              <label className="mb-3 block text-label-lg font-semibold uppercase tracking-[0.1em] text-ink">
                Variant
              </label>
              <div className="flex flex-wrap gap-2">
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`border px-4 py-2.5 text-body-sm font-medium transition-colors ${
                      selectedVariant?.id === variant.id
                        ? "border-ink bg-ink text-white"
                        : "border-ink/20 text-ink hover:border-ink"
                    }`}
                  >
                    {variant.name}
                    {variant.price !== product.price && (
                      <span className="ml-1 opacity-70">(${variant.price})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center gap-3 text-body-sm">
            <span
              className={`h-2 w-2 rounded-full ${
                inStock ? "bg-green-600" : "bg-red-500"
              }`}
            />
            {inStock ? (
              <span className="text-ink">
                In stock &middot; {product.stock_quantity} available
              </span>
            ) : (
              <span className="text-red-600">Currently out of stock</span>
            )}
            {product.sku && (
              <span className="ml-auto text-outline">SKU: {product.sku}</span>
            )}
          </div>

          {inStock && (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <div className="flex h-14 items-center border border-ink/20">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Decrease quantity"
                  className="flex h-full w-12 items-center justify-center text-lg text-ink transition-colors hover:text-accent"
                >
                  &minus;
                </button>
                <span className="w-12 text-center text-body-md font-medium">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity(Math.min(product.stock_quantity, quantity + 1))
                  }
                  aria-label="Increase quantity"
                  className="flex h-full w-12 items-center justify-center text-lg text-ink transition-colors hover:text-accent"
                >
                  +
                </button>
              </div>

              <Button
                onClick={addToCart}
                variant="primary"
                size="lg"
                className="flex-1"
              >
                Add to Bag
              </Button>
            </div>
          )}

          {/* Details */}
          <div className="mt-10 divide-y divide-ink/10 border-y border-ink/10">
            <details className="group py-4" open>
              <summary className="flex cursor-pointer items-center justify-between text-label-lg font-semibold uppercase tracking-[0.1em] text-ink">
                Product Details
                <span className="text-outline transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              {product.description ? (
                <div
                  className="prose-product mt-3 text-body-sm leading-relaxed text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <p className="mt-3 text-body-sm leading-relaxed text-muted-foreground">
                  A masterfully crafted piece designed for the discerning individual who seeks quality without
                  compromising on style.
                </p>
              )}
            </details>
            <details className="group py-4">
              <summary className="flex cursor-pointer items-center justify-between text-label-lg font-semibold uppercase tracking-[0.1em] text-ink">
                Shipping &amp; Returns
                <span className="text-outline transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-body-sm leading-relaxed text-muted-foreground">
                Complimentary standard shipping on orders over $200. Returns
                accepted within 30 days of delivery.
              </p>
            </details>
          </div>
        </div>
      </div>

      {related_products && related_products.length > 0 && (
        <div className="mt-20 border-t border-ink/10 pt-16">
          <h2 className="mb-10 text-display-md text-ink">You May Also Like</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
            {related_products.map((rp, i) => (
              <ProductCard key={rp.id} product={rp} index={i} />
            ))}
          </div>
        </div>
      )}
    </StoreLayout>
  );
}
