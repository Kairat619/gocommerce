import { Head, router } from "@inertiajs/react";
import StoreLayout from "../../Components/StoreLayout";
import Button from "../../Components/UI/Button";
import EmptyState from "../../Components/UI/EmptyState";
import CartItem from "../../Components/Commerce/CartItem";
import { formatMoney } from "../../lib/money";
import { asCart } from "../../lib/props";
import { pageTitle } from "../../lib/brand";

/** @param {import('../../types/pages').CartIndexProps} props */
export default function CartIndex({ cart }) {
  const { items, total_price: totalPrice } = asCart(cart);

  function updateQuantity(productId, quantity) {
    router.post(
      "/cart/update",
      { product_id: productId, quantity: quantity.toString() },
      { preserveScroll: true }
    );
  }

  function removeItem(productId) {
    router.post(
      "/cart/remove",
      { product_id: productId },
      { preserveScroll: true }
    );
  }

  function clearCart() {
    if (confirm("Are you sure you want to clear your cart?")) {
      router.post("/cart/clear", {}, { preserveScroll: true });
    }
  }

  return (
    <StoreLayout>
      <Head title={pageTitle("Shopping Bag")} />

      <div className="mx-auto max-w-4xl">
        <h1 className="mb-10 text-display-md text-ink">Shopping Bag</h1>

        {items.length === 0 ? (
          <EmptyState
            title="Your bag is empty"
            description="Once you add something you love, it will appear here."
          >
            <Button href="/products" variant="primary" size="md">
              Continue Shopping
            </Button>
          </EmptyState>
        ) : (
          <>
            <ul className="divide-y divide-ink/10 border-y border-ink/10">
              {items.map((item) => (
                <CartItem
                  key={item.product_id}
                  item={item}
                  onQuantityChange={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </ul>

            <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
              <button
                type="button"
                onClick={clearCart}
                className="self-start text-label-sm font-semibold uppercase tracking-[0.1em] text-outline transition-colors hover:text-red-600"
              >
                Clear Bag
              </button>

              <div className="w-full sm:max-w-xs">
                <div className="flex items-baseline justify-between border-b border-ink/10 pb-4">
                  <span className="text-label-lg font-semibold uppercase tracking-[0.1em] text-ink">
                    Subtotal
                  </span>
                  <span className="text-headline-lg font-semibold text-ink">
                    {formatMoney(totalPrice)}
                  </span>
                </div>
                <p className="mt-3 text-body-sm text-muted-foreground">
                  Tax and shipping are calculated at checkout.
                </p>

                <Button
                  href="/checkout"
                  variant="primary"
                  size="lg"
                  className="mt-6 w-full"
                >
                  Proceed to Checkout
                </Button>
                <Button
                  href="/products"
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-full"
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </StoreLayout>
  );
}
