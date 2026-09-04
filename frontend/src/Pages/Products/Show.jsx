import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import StoreLayout from "../../Components/StoreLayout";
import Breadcrumbs from "../../Components/Breadcrumbs";
import Button from "../../Components/UI/Button";
import Price from "../../Components/Commerce/Price";
import ProductGallery from "../../Components/Commerce/ProductGallery";
import ProductGrid from "../../Components/Commerce/ProductGrid";
import QuantitySelector from "../../Components/Commerce/QuantitySelector";
import VariantSelector from "../../Components/Commerce/VariantSelector";
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

  const inStock = isInStock(product);
  const displayPrice = selectedVariant?.price || product.price;
  const compareAt = comparePrice(product);
  const discount = discountPercent(product);

  function addToCart() {
    router.post(
      "/cart/add",
      { product_id: product.id, quantity: quantity.toString() },
      { preserveScroll: true }
    );
  }

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
        <ProductGallery
          product={product}
          images={productImages}
          discount={discount}
        />

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

          <VariantSelector
            variants={productVariants}
            selected={selectedVariant}
            onSelect={setSelectedVariant}
            basePrice={product.price}
          />

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
              <QuantitySelector
                value={quantity}
                onChange={setQuantity}
                max={product.stock_quantity}
              />
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
                  A masterfully crafted piece designed for the discerning
                  individual who seeks quality without compromising on style.
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
          <ProductGrid products={related} columns="four" />
        </div>
      )}
    </StoreLayout>
  );
}
