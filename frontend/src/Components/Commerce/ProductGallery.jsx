import { useState } from "react";
import Badge from "../UI/Badge";

/**
 * Product imagery: thumbnail rail plus the active hero shot.
 *
 * Owns its own selection state — which image is showing is presentation, not
 * commerce data, so the page does not need to know about it.
 *
 * The product's own `image_url` leads the gallery, followed by its
 * `product_images` rows. (Those rows carry `sort_order`, which is not yet
 * honoured — see API_CONTRACT.md, "Props sent but not consumed".)
 *
 * @param {Object} props
 * @param {import('../../types/commerce').ProductDetail} props.product
 * @param {import('../../types/commerce').ProductImage[]} props.images
 * @param {number} [props.discount] whole-number percentage; 0 hides the badge
 */
export default function ProductGallery({ product, images, discount = 0 }) {
  const [activeImage, setActiveImage] = useState(product.image_url || null);

  const gallery = [];
  if (product.image_url) gallery.push({ id: "main", url: product.image_url });
  images.forEach((image) => gallery.push(image));

  const heroImage = activeImage || product.image_url;

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      {gallery.length > 1 && (
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-col md:overflow-visible md:px-0 md:pb-0">
          {gallery.map((image) => (
            <button
              key={image.id}
              onClick={() => setActiveImage(image.url)}
              aria-label={`Show image of ${product.name}`}
              aria-pressed={heroImage === image.url}
              className={`aspect-[3/4] w-16 flex-shrink-0 overflow-hidden bg-surface-container transition-all md:w-20 ${
                heroImage === image.url
                  ? "ring-2 ring-ink ring-offset-2 ring-offset-surface"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={image.url}
                alt={image.alt_text || product.name}
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
  );
}
