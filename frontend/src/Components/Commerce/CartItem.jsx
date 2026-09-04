import { Link } from "@inertiajs/react";
import QuantitySelector from "./QuantitySelector";
import { formatLineTotal } from "../../lib/money";

/**
 * One line in the cart.
 *
 * Money here comes from the `cart` prop, so it is a float rather than the
 * pre-formatted string the rest of the storefront receives — `formatLineTotal`
 * handles both.
 *
 * @param {Object} props
 * @param {import('../../types/commerce').CartItem} props.item
 * @param {(productId: string, quantity: number) => void} props.onQuantityChange
 * @param {(productId: string) => void} props.onRemove
 */
export default function CartItem({ item, onQuantityChange, onRemove }) {
  return (
    <li className="flex gap-4 py-6 sm:gap-6">
      <Link
        href={`/products/${item.slug}`}
        className="h-24 w-24 flex-shrink-0 overflow-hidden bg-surface-container sm:h-32 sm:w-32"
      >
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-outline">
            <svg
              className="h-8 w-8"
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
      </Link>

      <div className="flex flex-1 flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-serif text-body-lg text-ink">
              <Link
                href={`/products/${item.slug}`}
                className="transition-colors hover:text-accent"
              >
                {item.name}
              </Link>
            </h3>
            {item.sku && (
              <p className="mt-1 text-label-sm uppercase tracking-[0.1em] text-outline">
                SKU: {item.sku}
              </p>
            )}
          </div>
          <p className="whitespace-nowrap text-body-lg font-semibold text-ink">
            {formatLineTotal(item.price, item.quantity)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <QuantitySelector
            size="sm"
            editable
            value={item.quantity}
            onChange={(next) => onQuantityChange(item.product_id, next)}
          />
          <button
            type="button"
            onClick={() => onRemove(item.product_id)}
            className="text-label-sm font-semibold uppercase tracking-[0.1em] text-outline transition-colors hover:text-red-600"
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
