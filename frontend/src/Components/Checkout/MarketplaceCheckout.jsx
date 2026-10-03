import { usePage } from "@inertiajs/react";
import AddressFields from "../Commerce/AddressFields";
import Breadcrumbs from "../Breadcrumbs";
import Container from "../UI/Container";
import Icon from "../UI/Icon";
import Textarea from "../UI/Textarea";
import { formatMoney } from "../../lib/money";
import AddressPicker from "./AddressPicker";
import CheckoutSteps from "./CheckoutSteps";
import CheckoutSummary from "./CheckoutSummary";
import SectionTitle from "./SectionTitle";

/**
 * The marketplace checkout: numbered sections for delivery address,
 * delivery, and billing, beside the order summary.
 *
 * Presentational. Pages/Checkout/Index owns the form state and the POST.
 *
 * What the design shows but this store does not have is left out rather than
 * faked: there is one shipping rate (not a choice of speeds), and checkout
 * takes no payment details, so there is no payment-method picker.
 */
const sectionCard = "rounded-2xl bg-white p-5 shadow-sm md:p-6";

export default function MarketplaceCheckout({
  form,
  addresses,
  addressChoice,
  onAddressChoice,
  steps,
  summary,
  freeShippingThreshold,
  onSubmit,
}) {
  const { store } = usePage().props;
  const showFields = addresses.length === 0 || addressChoice === "new";
  const remainingForFree =
    freeShippingThreshold - (summary.subtotal - summary.discount);

  return (
    <Container className="py-6 md:py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Breadcrumbs
          look="marketplace"
          className=""
          items={[{ label: "Shopping Cart", href: "/cart" }, { label: "Secure Checkout" }]}
        />
        <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-green-700 shadow-sm">
          <Icon name="lock" className="h-3.5 w-3.5" />
          Secure checkout
        </span>
      </div>

      <CheckoutSteps steps={steps} />

      <form onSubmit={onSubmit} className="mt-5 grid gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-8">
          <section className={sectionCard} aria-labelledby="delivery-destination">
            <SectionTitle
              number={1}
              id="delivery-destination"
              title="Delivery Destination"
              subtitle="Where should we deliver your order?"
            />

            {addresses.length > 0 && (
              <AddressPicker addresses={addresses} value={addressChoice} onChange={onAddressChoice} />
            )}

            {showFields && (
              <div className={addresses.length > 0 ? "mt-5 border-t border-muted pt-5" : ""}>
                <AddressFields
                  prefix="shipping"
                  values={form.shipping}
                  onChange={form.setShipping}
                  required
                />
              </div>
            )}

            <div className="mt-5 rounded-xl bg-muted p-4">
              <label htmlFor="notes" className="mb-1.5 block text-[13px] font-semibold text-ink">
                Delivery instructions <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => form.setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. leave with the concierge, gate code, preferred time"
                className="bg-white"
              />
            </div>
          </section>

          <section className={sectionCard} aria-labelledby="delivery-method">
            <SectionTitle
              number={2}
              id="delivery-method"
              title="Delivery"
              subtitle="Tracked delivery to the address above."
            />
            <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-accent bg-surface-container p-4">
              <span className="flex items-center gap-3">
                <Icon name="truck" className="h-6 w-6 shrink-0 text-accent" />
                <span>
                  <span className="block text-sm font-bold text-ink">Standard Shipping</span>
                  <span className="block text-[13px] text-muted-foreground">
                    {summary.shipping === 0
                      ? "Free on this order"
                      : remainingForFree > 0
                      ? `Add ${formatMoney(remainingForFree)} more for free shipping`
                      : "Flat rate"}
                  </span>
                </span>
              </span>
              <span className={summary.shipping === 0 ? "text-sm font-extrabold text-green-700" : "text-sm font-extrabold text-ink"}>
                {summary.shipping === 0 ? "FREE" : formatMoney(summary.shipping)}
              </span>
            </div>
          </section>

          <section className={sectionCard} aria-labelledby="billing-details">
            <SectionTitle
              number={3}
              id="billing-details"
              title="Billing Details"
              subtitle="No card details are needed to place this order."
            />
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.sameAsShipping}
                onChange={(e) => form.setSameAsShipping(e.target.checked)}
                className="h-4 w-4 rounded accent-[rgb(var(--color-accent))]"
              />
              My billing address is the same as my delivery address
            </label>
            {!form.sameAsShipping && (
              <div className="mt-5 border-t border-muted pt-5">
                <AddressFields prefix="billing" values={form.billing} onChange={form.setBilling} />
              </div>
            )}
          </section>
        </div>

        <aside aria-label="Order summary" className="space-y-4 lg:col-span-4">
          <CheckoutSummary {...summary} />
          {(store?.email || store?.phone) && (
            <p className="flex items-center gap-3 rounded-2xl bg-white p-4 text-[13px] shadow-sm">
              <Icon name="support" className="h-6 w-6 shrink-0 text-accent" />
              <span>
                <span className="block font-bold text-ink">Need help completing your order?</span>
                {store?.phone ? (
                  <a href={`tel:${store.phone.replace(/\s+/g, "")}`} className="text-accent hover:underline">
                    Call {store.phone}
                  </a>
                ) : (
                  <a href={`mailto:${store.email}`} className="text-accent hover:underline">
                    Email {store.email}
                  </a>
                )}
              </span>
            </p>
          )}
        </aside>
      </form>
    </Container>
  );
}
