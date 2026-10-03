import { Link } from "@inertiajs/react";
import QuantitySelector from "../Commerce/QuantitySelector";
import Icon from "../UI/Icon";
import { formatLineTotal, formatMoney } from "../../lib/money";

/**
 * One cart line as a marketplace card: image, name and SKU, unit and line
 * price, an editable quantity and remove.
 *
 * Money comes from the `cart` prop as floats; `formatMoney` and
 * `formatLineTotal` accept them as-is.
 *
 * @param {Object} props
 * @param {import('../../types/commerce').CartItem} props.item
 * @param {(productId: string, quantity: number) => void} props.onQuantityChange
 * @param {(productId: string) => void} props.onRemove
 */
export default function CartLineCard({ item, onQuantityChange, onRemove }) {
  return (
    <li className="flex gap-3 rounded-xl bg-white p-3 shadow-sm sm:gap-4 sm:p-4">
      <Link
        href={`/products/${item.slug}`}
        className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:h-24 sm:w-24"
      >
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <Icon name="bag" className="h-8 w-8 text-outline" />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-bold leading-5 text-ink sm:text-[15px]">
              <Link
                href={`/products/${item.slug}`}
                className="line-clamp-2 transition-colors hover:text-accent"
              >
                {item.name}
              </Link>
            </h2>
            {item.sku && (
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-outline">
                SKU: {item.sku}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-base font-extrabold text-ink sm:text-lg">
              {formatLineTotal(item.price, item.quantity)}
            </p>
            {item.quantity > 1 && (
              <p className="text-[11px] text-muted-foreground">
                {formatMoney(item.price)} each
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <QuantitySelector
            size="sm"
            look="rounded"
            editable
            value={item.quantity}
            onChange={(next) => onQuantityChange(item.product_id, next)}
            className="h-9"
          />
          <button
            type="button"
            onClick={() => onRemove(item.product_id)}
            aria-label={`Remove ${item.name} from cart`}
            className="flex items-center gap-1 rounded text-[13px] font-semibold text-muted-foreground transition-colors hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
          >
            <Icon name="close" className="h-4 w-4" />
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
