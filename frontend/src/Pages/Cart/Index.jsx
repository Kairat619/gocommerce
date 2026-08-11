import { Head, Link, router, usePage } from "@inertiajs/react";
import StoreLayout from "../../Components/StoreLayout";

export default function CartIndex({ cart }) {
  const { flash } = usePage().props;
  const items = cart?.items || [];
  const totalPrice = cart?.total_price || 0;

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
      <Head title="Shopping Cart" />

      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-2xl font-bold text-gray-900">
          Shopping Cart
        </h1>

        {flash?.success && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-700">
            {flash.success}
          </div>
        )}
        {flash?.error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {flash.error}
          </div>
        )}

        {items.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
              />
            </svg>
            <p className="mt-4 text-lg text-gray-500">Your cart is empty</p>
            <Link
              href="/products"
              className="mt-6 inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-gray-200 bg-white">
              <ul className="divide-y divide-gray-200">
                {items.map((item) => (
                  <li key={item.product_id} className="flex gap-4 p-4 sm:p-6">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-32 sm:w-32">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-3xl text-gray-300">
                          📦
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 sm:text-base">
                              <Link
                                href={`/products/${item.slug}`}
                                className="hover:text-indigo-600"
                              >
                                {item.name}
                              </Link>
                            </h3>
                            {item.sku && (
                              <p className="mt-0.5 text-xs text-gray-500">
                                SKU: {item.sku}
                              </p>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-gray-900 sm:text-base">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-500">Qty:</label>
                          <div className="flex items-center rounded-md border border-gray-300">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.product_id,
                                  item.quantity - 1
                                )
                              }
                              aria-label="Decrease quantity"
                              className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-100"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const next = parseInt(e.target.value, 10);
                                if (!Number.isNaN(next) && next >= 1) {
                                  updateQuantity(item.product_id, next);
                                }
                              }}
                              className="h-8 w-12 border-x border-gray-300 text-center text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.product_id,
                                  item.quantity + 1
                                )
                              }
                              aria-label="Increase quantity"
                              className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-100"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => removeItem(item.product_id)}
                          className="text-xs font-medium text-red-600 hover:text-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={clearCart}
                  className="text-sm font-medium text-red-600 hover:text-red-500"
                >
                  Clear Cart
                </button>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Subtotal</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${totalPrice.toFixed(2)}
                  </p>
                </div>
              </div>

              <Link
                href="/checkout"
                className="mt-6 block w-full rounded-lg bg-indigo-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/products"
                className="mt-3 block text-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Continue Shopping
              </Link>
            </div>
          </>
        )}
      </div>
    </StoreLayout>
  );
}
