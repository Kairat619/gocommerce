import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import StoreLayout from "../../Components/StoreLayout";
import Breadcrumbs from "../../Components/Breadcrumbs";
import Button from "../../Components/UI/Button";
import Badge from "../../Components/UI/Badge";
import Price from "../../Components/Commerce/Price";
import ProductCard from "../../Components/ProductCard";
import { formatMoney } from "../../lib/money";
import { comparePrice, discountPercent, isInStock } from "../../lib/product";
import { pageTitle } from "../../lib/brand";
import { asList } from "../../lib/props";

/** @param {import('../../types/pages').ProductsShowProps} props */
export default function ProductsShow({
  product,
  images,
  variants,
  related_products,
}) {
  const productImages = asList(images);
  const productVariants = asList(variants);
  const related = asList(related_products);

  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeImage, setActiveImage] = useState(product.image_url || null);
  const inStock = isInStock(product);

  const displayPrice = selectedVariant?.price || product.price;
  const compareAt = comparePrice(product);
  const discount = discountPercent(product);

  const gallery = [];
  if (product.image_url) gallery.push({ id: "main", url: product.image_url });
  productImages.forEach((img) => gallery.push(img));

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
      <Head title={pageTitle(product.name)} />

      <Breadcrumbs
        className="mb-8"
        items={[
          { label: "Shop", href: "/products" },
          {
            label: product.category_name,
            href: `/categories/${product.category_slug}`,
          },
          { label: product.name },
        ]}
      />

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
              <Badge tone="accent" className="absolute left-4 top-4">
                -{discount}% Off
              </Badge>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <span className="mb-3 text-label-lg font-semibold uppercase tracking-[0.2em] text-accent">
            {product.category_name}
          </span>
          <h1 className="text-display-md text-ink">{product.name}</h1>

          <Price
            amount={displayPrice}
            compareAt={selectedVariant ? null : compareAt}
            size="lg"
            className="mt-5"
          />

          {product.description && (
            <div
              className="prose-product mt-6 max-w-prose text-body-md leading-relaxed text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}

          {productVariants.length > 0 && (
            <div className="mt-8">
              <label className="mb-3 block text-label-lg font-semibold uppercase tracking-[0.1em] text-ink">
                Variant
              </label>
              <div className="flex flex-wrap gap-2">
                {productVariants.map((variant) => (
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
                      <span className="ml-1 opacity-70">
                        ({formatMoney(variant.price)})
                      </span>
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

      {related.length > 0 && (
        <div className="mt-20 border-t border-ink/10 pt-16">
          <h2 className="mb-10 text-display-md text-ink">You May Also Like</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
            {related.map((rp, i) => (
              <ProductCard key={rp.id} product={rp} index={i} />
            ))}
          </div>
        </div>
      )}
    </StoreLayout>
  );
}
