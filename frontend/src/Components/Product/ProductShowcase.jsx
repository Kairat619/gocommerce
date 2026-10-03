import { useState } from "react";
import Icon from "../UI/Icon";
import cn from "../../lib/cn";

/**
 * The marketplace product gallery: a large framed image with a thumbnail row
 * beneath it, plus a share action.
 *
 * The product's own `image_url` leads, followed by its `product_images` rows,
 * matching ProductGallery.
 *
 * @param {Object} props
 * @param {import('../../types/commerce').ProductDetail} props.product
 * @param {import('../../types/commerce').ProductImage[]} props.images
 * @param {number} [props.discount] whole-number percentage; 0 hides the badge
 */
export default function ProductShowcase({ product, images, discount = 0 }) {
  const gallery = [];
  if (product.image_url) {
    gallery.push({ id: "main", url: product.image_url, alt_text: product.name });
  }
  images.forEach((image) => {
    if (image.url !== product.image_url) gallery.push(image);
  });

  const [activeId, setActiveId] = useState(gallery[0]?.id ?? null);
  const [shared, setShared] = useState(false);
  const active = gallery.find((image) => image.id === activeId) || gallery[0];

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShared(true);
      window.setTimeout(() => setShared(false), 2000);
    } catch {
      // The shopper dismissed the share sheet, or the clipboard is blocked.
    }
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm md:p-5">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-muted">
        {active ? (
          <img
            src={active.url}
            alt={active.alt_text || product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <Icon name="bag" className="h-20 w-20 text-outline" />
        )}
        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-md bg-red-600 px-2 py-1 text-[11px] font-extrabold text-white">
            -{discount}% OFF
          </span>
        )}
      </div>

      {gallery.length > 1 && (
        <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5" aria-label="Product images">
          {gallery.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setActiveId(image.id)}
                aria-label={`Show image ${index + 1} of ${gallery.length}`}
                aria-pressed={active?.id === image.id}
                className={cn(
                  "block aspect-square w-full overflow-hidden rounded-lg bg-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  active?.id === image.id
                    ? "ring-2 ring-accent"
                    : "opacity-70 hover:opacity-100"
                )}
              >
                <img
                  src={image.url}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex items-center border-t border-muted pt-3">
        <button
          type="button"
          onClick={share}
          className="flex items-center gap-1.5 rounded text-[13px] font-semibold text-muted-foreground transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Icon name="arrowRight" className="h-4 w-4 -rotate-45" />
          <span aria-live="polite">{shared ? "Link copied" : "Share Product"}</span>
        </button>
      </div>
    </div>
  );
}
