import { Link } from "@inertiajs/react";
import QuantitySelector from "../Commerce/QuantitySelector";
import Icon from "../UI/Icon";
import cn from "../../lib/cn";
import { excerpt } from "../../lib/html";
import { formatMoney, toAmount } from "../../lib/money";

/**
 * The marketplace buy box: title, price with savings, variant options,
 * availability, quantity and the two purchase actions.
 *
 * Presentational — the page owns the selection, quantity and cart visits.
 *
 * @param {Object} props
 * @param {import('../../types/commerce').ProductDetail} props.product
 * @param {import('../../types/commerce').ProductVariant[]} props.variants
 * @param {import('../../types/commerce').ProductVariant|null} props.selectedVariant
 * @param {(variant: Object) => void} props.onSelectVariant
 * @param {string} props.displayPrice
 * @param {number|null} props.compareAt  null when no genuine markdown applies
 * @param {number} props.discount
 * @param {boolean} props.inStock
 * @param {number} props.quantity
 * @param {(next: number) => void} props.onQuantityChange
 * @param {() => void} props.onAddToCart
 * @param {() => void} props.onBuyNow
 * @param {boolean} props.processing
 */
export default function PurchasePanel({
  product,
  variants,
  selectedVariant,
  onSelectVariant,
  displayPrice,
  compareAt,
  discount,
  inStock,
  quantity,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  processing,
}) {
  const summary = excerpt(product.description, 180);
  const savings =
    compareAt !== null ? compareAt - (toAmount(displayPrice) ?? 0) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href={`/categories/${product.category_slug}`}
          className="text-[11px] font-bold uppercase tracking-wider text-accent hover:underline"
        >
          {product.category_name}
        </Link>
        <h1 className="mt-1 text-2xl font-extrabold leading-tight tracking-tight text-ink md:text-[28px] md:leading-9">
          {product.name}
        </h1>
        {summary && (
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{summary}</p>
        )}
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-3xl font-extrabold tracking-tight text-accent">
            {formatMoney(displayPrice)}
          </span>
          {compareAt !== null && (
            <>
              <span className="text-base text-outline line-through">
                {formatMoney(compareAt)}
              </span>
              <span className="rounded-md bg-red-50 px-2 py-0.5 text-[13px] font-bold text-red-600">
                Save {formatMoney(savings)} ({discount}%)
              </span>
            </>
          )}
        </div>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Taxes and shipping calculated at checkout.
        </p>
      </div>

      {variants.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-[13px] font-bold text-ink">
            Choose an option
          </legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {variants.map((variant) => {
              const active = selectedVariant?.id === variant.id;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => onSelectVariant(variant)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-xl border-2 bg-white px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    active
                      ? "border-accent bg-surface-container"
                      : "border-transparent shadow-sm hover:border-accent-soft"
                  )}
                >
                  <span className="block text-[13px] font-bold text-ink">
                    {variant.name}
                  </span>
                  <span className="block text-[13px] font-semibold text-accent">
                    {formatMoney(variant.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="rounded-xl bg-surface-container p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span
            aria-hidden="true"
            className={cn("h-2.5 w-2.5 rounded-full", inStock ? "bg-green-600" : "bg-red-500")}
          />
          {inStock ? (
            <span className="text-green-700">
              In stock · {product.stock_quantity} available
            </span>
          ) : (
            <span className="text-red-600">Currently out of stock</span>
          )}
        </p>
        <ul className="mt-3 grid grid-cols-1 gap-2 text-[13px] text-muted-foreground sm:grid-cols-2">
          <li className="flex items-center gap-2">
            <Icon name="truck" className="h-4 w-4 shrink-0 text-accent" />
            Tracked delivery
          </li>
          <li className="flex items-center gap-2">
            <Icon name="return" className="h-4 w-4 shrink-0 text-accent" />
            Easy returns after delivery
          </li>
        </ul>
      </div>

      {inStock ? (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <QuantitySelector
              value={quantity}
              onChange={onQuantityChange}
              max={product.stock_quantity}
              size="sm"
              look="rounded"
              className="h-12"
            />
            <button
              type="button"
              onClick={onAddToCart}
              disabled={processing}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-6 text-sm font-bold text-white shadow-sm transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-60"
            >
              <Icon name="bag" className="h-5 w-5" />
              Add to Cart
            </button>
          </div>
          <button
            type="button"
            onClick={onBuyNow}
            disabled={processing}
            className="flex h-12 items-center justify-center gap-2 rounded-lg bg-ink px-6 text-sm font-bold text-white transition-colors hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-60"
          >
            Buy Now
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled
          className="h-12 rounded-lg bg-muted text-sm font-bold text-outline"
        >
          Out of Stock
        </button>
      )}

      <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <Icon name="shield" className="h-4 w-4 shrink-0 text-accent" />
        Secure checkout — your details stay protected.
      </p>
    </div>
  );
}
