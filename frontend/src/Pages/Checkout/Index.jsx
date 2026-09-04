import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import StoreLayout from "../../Components/StoreLayout";
import Button from "../../Components/UI/Button";
import EmptyState from "../../Components/UI/EmptyState";
import Textarea from "../../Components/UI/Textarea";
import AddressCard from "../../Components/Commerce/AddressCard";
import AddressFields from "../../Components/Commerce/AddressFields";
import OrderSummary from "../../Components/Commerce/OrderSummary";
import { asCart, asList } from "../../lib/props";
import { pageTitle } from "../../lib/brand";

const emptyShipping = {
  shipping_name: "",
  shipping_address: "",
  shipping_city: "",
  shipping_state: "",
  shipping_postal_code: "",
  shipping_country: "US",
};

const emptyBilling = {
  billing_name: "",
  billing_address: "",
  billing_city: "",
  billing_state: "",
  billing_postal_code: "",
  billing_country: "US",
};

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

  const [shippingAddress, setShippingAddress] = useState(emptyShipping);
  const [billingAddress, setBillingAddress] = useState(emptyBilling);
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

    const billing = sameAsShipping
      ? {
          billing_name: shippingAddress.shipping_name,
          billing_address: shippingAddress.shipping_address,
          billing_city: shippingAddress.shipping_city,
          billing_state: shippingAddress.shipping_state,
          billing_postal_code: shippingAddress.shipping_postal_code,
          billing_country: shippingAddress.shipping_country,
        }
      : billingAddress;

    router.post(
      "/checkout",
      { ...shippingAddress, ...billing, notes },
      { onFinish: () => setProcessing(false) }
    );
  }

  if (items.length === 0) {
    return (
      <StoreLayout>
        <Head title={pageTitle("Checkout")} />
        <EmptyState
          title="Your bag is empty"
          description="Add something to your bag before checking out."
        >
          <Button href="/products" variant="primary" size="md">
            Continue Shopping
          </Button>
        </EmptyState>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <Head title={pageTitle("Checkout")} />

      <h1 className="mb-10 text-display-md text-ink">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            {savedAddresses.length > 0 && (
              <section className="border border-ink/10 bg-white p-6">
                <h2 className="mb-5 text-label-lg font-semibold uppercase tracking-[0.1em] text-ink">
                  Saved Addresses
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {savedAddresses.map((addr) => (
                    <AddressCard
                      key={addr.id}
                      address={addr}
                      onSelect={() => selectAddress(addr)}
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="border border-ink/10 bg-white p-6">
              <h2 className="mb-5 text-label-lg font-semibold uppercase tracking-[0.1em] text-ink">
                Shipping Information
              </h2>
              <AddressFields
                prefix="shipping"
                values={shippingAddress}
                onChange={setShippingAddress}
                required
              />
            </section>

            <section className="border border-ink/10 bg-white p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-label-lg font-semibold uppercase tracking-[0.1em] text-ink">
                  Billing Information
                </h2>
                <label className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={sameAsShipping}
                    onChange={(e) => setSameAsShipping(e.target.checked)}
                    className="h-4 w-4 border-ink/25 text-ink focus:ring-ink"
                  />
                  <span className="text-body-sm text-muted-foreground">
                    Same as shipping
                  </span>
                </label>
              </div>

              {!sameAsShipping && (
                <AddressFields
                  prefix="billing"
                  values={billingAddress}
                  onChange={setBillingAddress}
                />
              )}
            </section>

            <section className="border border-ink/10 bg-white p-6">
              <label
                htmlFor="notes"
                className="mb-5 block text-label-lg font-semibold uppercase tracking-[0.1em] text-ink"
              >
                Order Notes
              </label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Special instructions for delivery (optional)"
              />
            </section>
          </div>

          <div className="lg:col-span-1">
            <OrderSummary
              items={items}
              subtotal={subtotal}
              tax={tax}
              shipping={shipping}
              total={total}
              freeShippingThreshold={free_shipping_threshold}
            >
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={processing}
                className="mt-6 w-full"
              >
                {processing ? "Placing Order..." : "Place Order"}
              </Button>
              <p className="mt-3 text-center text-label-sm text-outline">
                By placing this order you agree to our terms of service.
              </p>
            </OrderSummary>
          </div>
        </div>
      </form>
    </StoreLayout>
  );
}
