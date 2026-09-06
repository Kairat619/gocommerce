/**
 * A product's own image, or a neutral placeholder glyph when it has none.
 *
 * Deliberately never invents imagery (see lib/image) — an absent photo shows as
 * an absent photo, which is also a useful signal in a merchandising screen.
 */
export default function ProductThumb({ product, size = "h-10 w-10" }) {
  if (product?.image_url) {
    return (
      <img
        src={product.image_url}
        alt=""
        className={`${size} flex-shrink-0 rounded object-cover ring-1 ring-gray-200`}
      />
    );
  }

  return (
    <div
      className={`${size} flex flex-shrink-0 items-center justify-center rounded bg-gray-100 ring-1 ring-gray-200`}
      aria-hidden="true"
    >
      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M18 6.75h.008v.008H18V6.75z"
        />
      </svg>
    </div>
  );
}
