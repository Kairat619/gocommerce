import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import StoreLayout from "../../Components/StoreLayout";
import { formatMoney, formatLineTotal } from "../../lib/money";
import { asCart, asList } from "../../lib/props";

/** @param {import('../../types/pages').CheckoutIndexProps} props */
export default function CheckoutIndex({
  cart,
  addresses,
  tax_rate,
  shipping_cost,
  free_shipping_threshold,
}) {
  const { items, total_price: subtotal } = asCart(cart);
  const savedAddresses = asList(addresses);
  const tax = subtotal * tax_rate;
  const shipping = subtotal >= free_shipping_threshold ? 0 : shipping_cost;
  const total = subtotal + tax + shipping;

  const [shippingAddress, setShippingAddress] = useState({
    shipping_name: "",
    shipping_address: "",
    shipping_city: "",
    shipping_state: "",
    shipping_postal_code: "",
    shipping_country: "US",
  });

  const [billingAddress, setBillingAddress] = useState({
    billing_name: "",
    billing_address: "",
    billing_city: "",
    billing_state: "",
    billing_postal_code: "",
    billing_country: "US",
  });

  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  function selectAddress(addr) {
    setShippingAddress({
      shipping_name: `${addr.first_name} ${addr.last_name}`,
      shipping_address: addr.address_line1,
      shipping_city: addr.city,
      shipping_state: addr.state,
      shipping_postal_code: addr.postal_code,
      shipping_country: addr.country,
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setProcessing(true);

    const data = {
      ...shippingAddress,
      ...(sameAsShipping
        ? {
            billing_name: shippingAddress.shipping_name,
            billing_address: shippingAddress.shipping_address,
            billing_city: shippingAddress.shipping_city,
            billing_state: shippingAddress.shipping_state,
            billing_postal_code: shippingAddress.shipping_postal_code,
            billing_country: shippingAddress.shipping_country,
          }
        : billingAddress),
      notes,
    };

    router.post("/checkout", data, {
      onFinish: () => setProcessing(false),
    });
  }

  if (items.length === 0) {
    return (
      <StoreLayout>
        <Head title="Checkout" />
        <div className="py-16 text-center">
          <p className="text-lg text-gray-500">Your cart is empty.</p>
          <Link
            href="/products"
            className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Continue Shopping
          </Link>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <Head title="Checkout" />

      <h1 className="mb-8 text-2xl font-bold text-gray-900">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {savedAddresses.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Saved Addresses
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => selectAddress(addr)}
                      className="rounded-lg border border-gray-200 p-4 text-left text-sm hover:border-indigo-300 hover:bg-indigo-50"
                    >
                      <p className="font-medium text-gray-900">
                        {addr.first_name} {addr.last_name}
                      </p>
                      <p className="text-gray-500">{addr.address_line1}</p>
                      <p className="text-gray-500">
                        {addr.city}, {addr.state} {addr.postal_code}
                      </p>
                      {addr.is_default && (
                        <span className="mt-1 inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600">
                          Default
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Shipping Information
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.shipping_name}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        shipping_name: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.shipping_address}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        shipping_address: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.shipping_city}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        shipping_city: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.shipping_state}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        shipping_state: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.shipping_postal_code}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        shipping_postal_code: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Country *
                  </label>
                  <select
                    required
                    value={shippingAddress.shipping_country}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        shipping_country: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Billing Information
                </h2>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={sameAsShipping}
                    onChange={(e) => setSameAsShipping(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Same as shipping
                </label>
              </div>

              {!sameAsShipping && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={billingAddress.billing_name}
                      onChange={(e) =>
                        setBillingAddress({
                          ...billingAddress,
                          billing_name: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <input
                      type="text"
                      value={billingAddress.billing_address}
                      onChange={(e) =>
                        setBillingAddress({
                          ...billingAddress,
                          billing_address: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      type="text"
                      value={billingAddress.billing_city}
                      onChange={(e) =>
                        setBillingAddress({
                          ...billingAddress,
                          billing_city: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      State
                    </label>
                    <input
                      type="text"
                      value={billingAddress.billing_state}
                      onChange={(e) =>
                        setBillingAddress({
                          ...billingAddress,
                          billing_state: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={billingAddress.billing_postal_code}
                      onChange={(e) =>
                        setBillingAddress({
                          ...billingAddress,
                          billing_postal_code: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Country
                    </label>
                    <select
                      value={billingAddress.billing_country}
                      onChange={(e) =>
                        setBillingAddress({
                          ...billingAddress,
                          billing_country: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Order Notes
              </h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Special instructions for delivery (optional)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Order Summary
              </h2>

              <ul className="mb-4 divide-y divide-gray-200">
                {items.map((item) => (
                  <li
                    key={item.product_id}
                    className="flex justify-between py-3 text-sm"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-gray-900">
                      {formatLineTotal(item.price, item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="space-y-2 border-t border-gray-200 pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">{formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <span className="font-medium">{formatMoney(tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      formatMoney(shipping)
                    )}
                  </span>
                </div>
                {subtotal < free_shipping_threshold && (
                  <p className="text-xs text-indigo-600">
                    Add {formatMoney(free_shipping_threshold - subtotal)} more
                    for free shipping!
                  </p>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-base font-semibold text-gray-900">
                    Total
                  </span>
                  <span className="text-base font-semibold text-gray-900">
                    {formatMoney(total)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="mt-6 w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? "Processing..." : "Place Order"}
              </button>

              <Link
                href="/cart"
                className="mt-3 block text-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Return to Cart
              </Link>
            </div>
          </div>
        </div>
      </form>
    </StoreLayout>
  );
}
