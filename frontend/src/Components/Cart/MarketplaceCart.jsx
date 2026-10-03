import { Link, usePage } from "@inertiajs/react";
import Breadcrumbs from "../Breadcrumbs";
import Container from "../UI/Container";
import Icon from "../UI/Icon";
import { formatMoney } from "../../lib/money";
import CartLineCard from "./CartLineCard";
import PromoCodeField from "./PromoCodeField";

/**
 * The marketplace cart: line cards on the left, an order summary with the
 * promo code and checkout action on the right.
 *
 * Presentational — Pages/Cart/Index owns every cart mutation.
 *
 * Tax and shipping are only known on the checkout page (the cart page is not
 * sent the tax rate or free-shipping threshold), so the summary says so
 * rather than estimating — the one exception is a free-shipping coupon, which
 * the server has already confirmed.
 *
 * @param {Object} props
 * @param {import('../../types/commerce').CartItem[]} props.items
 * @param {number} props.totalItems
 * @param {number} props.totalPrice
 * @param {import('../../types/commerce').AppliedCoupon|null} props.coupon
 * @param {number} props.discount  money off the subtotal, 0 when none
 * @param {(productId: string, quantity: number) => void} props.onQuantityChange
 * @param {(productId: string) => void} props.onRemove
 * @param {() => void} props.onClear
 */
export default function MarketplaceCart({
  items,
  totalItems,
  totalPrice,
  coupon,
  discount,
  onQuantityChange,
  onRemove,
  onClear,
}) {
  const { store } = usePage().props;
  const itemLabel = `${totalItems} item${totalItems !== 1 ? "s" : ""}`;

  return (
    <Container className="py-6 md:py-8">
      <Breadcrumbs
        look="marketplace"
        className="mb-3"
        items={[{ label: "Shop", href: "/products" }, { label: "Shopping Cart" }]}
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-ink md:text-[40px] md:leading-[48px]">
          Your Shopping Cart
        </h1>
        {items.length > 0 && (
          <span className="rounded-lg bg-surface-container px-2.5 py-1 text-[13px] font-bold text-accent">
            {itemLabel}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-16 text-center shadow-sm">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container text-accent">
            <Icon name="bag" className="h-8 w-8" />
          </span>
          <h2 className="mt-4 text-xl font-extrabold text-ink">Your cart is empty</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Once you add something you love, it will appear here.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-accent px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Start Shopping
            <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-12">
          <section aria-label="Cart items" className="lg:col-span-8">
            <div className="mb-3 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
              <p className="text-[13px] font-semibold text-ink">{itemLabel} in your cart</p>
              <button
                type="button"
                onClick={onClear}
                className="flex items-center gap-1 rounded text-[13px] font-semibold text-muted-foreground transition-colors hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              >
                <Icon name="close" className="h-4 w-4" />
                Clear cart
              </button>
            </div>

            <ul className="space-y-3">
              {items.map((item) => (
                <CartLineCard
                  key={item.product_id}
                  item={item}
                  onQuantityChange={onQuantityChange}
                  onRemove={onRemove}
                />
              ))}
            </ul>

            <Link
              href="/products"
              className="mt-4 inline-flex items-center gap-1 rounded text-[13px] font-bold text-accent hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Icon name="chevronLeft" className="h-4 w-4" />
              Continue shopping
            </Link>
          </section>

          <aside aria-label="Order summary" className="lg:col-span-4">
            <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm lg:sticky lg:top-32">
              <h2 className="text-xl font-extrabold text-ink">Order Summary</h2>

              <PromoCodeField coupon={coupon} />

              <dl className="space-y-2 border-t border-muted pt-4 text-[13px]">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal ({itemLabel})</dt>
                  <dd className="font-semibold text-ink">{formatMoney(totalPrice)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-green-700">Coupon ({coupon.code})</dt>
                    <dd className="font-semibold text-green-700">-{formatMoney(discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Shipping</dt>
                  <dd className={coupon?.free_shipping ? "font-bold text-green-700" : "text-muted-foreground"}>
                    {coupon?.free_shipping ? "FREE" : "Calculated at checkout"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tax</dt>
                  <dd className="text-muted-foreground">Calculated at checkout</dd>
                </div>
              </dl>

              <div className="flex items-baseline justify-between border-t border-muted pt-4">
                <div>
                  <p className="text-base font-extrabold text-ink">Estimated Total</p>
                  <p className="text-[11px] text-muted-foreground">Before tax and shipping</p>
                </div>
                <p className="text-2xl font-extrabold text-accent">
                  {formatMoney(totalPrice - discount)}
                </p>
              </div>

              {discount > 0 && (
                <p className="flex items-center justify-between rounded-lg bg-surface-container px-3 py-2 text-[13px] font-bold text-accent">
                  <span>You save</span>
                  <span>{formatMoney(discount)}</span>
                </p>
              )}

              <Link
                href="/checkout"
                className="flex h-12 items-center justify-center gap-2 rounded-lg bg-accent px-6 text-sm font-bold text-white shadow-sm transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 active:scale-[0.98]"
              >
                <Icon name="shield" className="h-5 w-5" />
                Proceed to Checkout ({itemLabel})
              </Link>

              <ul className="space-y-2 border-t border-muted pt-4 text-[13px] text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Icon name="shield" className="h-4 w-4 shrink-0 text-accent" />
                  Secure checkout
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="return" className="h-4 w-4 shrink-0 text-accent" />
                  Easy returns after delivery
                </li>
                {store?.phone && (
                  <li className="flex items-center gap-2">
                    <Icon name="phone" className="h-4 w-4 shrink-0 text-accent" />
                    <span>
                      Questions? Call{" "}
                      <a
                        href={`tel:${store.phone.replace(/\s+/g, "")}`}
                        className="font-semibold text-ink hover:text-accent"
                      >
                        {store.phone}
                      </a>
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </Container>
  );
}
