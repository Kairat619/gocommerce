import { formatMoney, toAmount } from "../../../lib/money";
import FormCard from "../Form/FormCard";
import TextInput from "../Form/TextInput";
import SettingsSaveBar from "./SettingsSaveBar";
import SettingsWarning from "./SettingsWarning";
import { useSettingsForm } from "./useSettingsForm";

/**
 * What every order is charged.
 *
 * The highest-consequence page in the configuration centre: these three values
 * are read by service/order.go on every checkout, so a typo here is money.
 *
 * TWO THINGS ARE TRUE AT ONCE AND BOTH HAVE TO BE SAID.
 *
 * A change applies to orders placed from now on. Orders already placed keep the
 * totals they were charged — order rows record their own tax, shipping and
 * total, and the admin never recalculates them. That is a deliberate invariant
 * of the order system, not an accident, and an administrator correcting a tax
 * rate needs to know it will not retroactively fix yesterday's invoices.
 *
 * THE PERCENTAGE / FRACTION TRAP
 *
 * tax_rate_percent is a PERCENTAGE here (8.25). The tax_rate prop the checkout
 * and the product form receive is a FRACTION (0.0825). The two must never be
 * conflated — see API_CONTRACT.md — which is why this field is labelled with a
 * % suffix and shows a worked example rather than a bare number.
 */
export default function CheckoutSection({ settings, currency = "USD", errors = {} }) {
  const form = useSettingsForm(
    {
      tax_rate_percent: String(settings.tax_rate_percent ?? 0),
      shipping_cost: String(settings.shipping_cost ?? 0),
      free_shipping_threshold: String(settings.free_shipping_threshold ?? 0),
    },
    "/admin/settings/checkout"
  );

  // A worked example on a round number, so the percentage/fraction distinction
  // is visible rather than merely documented. Presentation only — the authority
  // is service/order.go, which computes the real thing at checkout.
  const rate = toAmount(form.values.tax_rate_percent) ?? 0;
  const threshold = toAmount(form.values.free_shipping_threshold) ?? 0;

  return (
    <form onSubmit={form.submit}>
      <FormCard
        title="Tax"
        description="Applied to the order subtotal at checkout."
      >
        <TextInput
          label="Tax rate"
          name="tax_rate_percent"
          type="number"
          step="0.01"
          min="0"
          max="100"
          required
          suffix="%"
          value={form.values.tax_rate_percent}
          onChange={(value) => form.set("tax_rate_percent", value)}
          error={errors.tax_rate_percent}
          hint={`A percentage, not a fraction: 8 means 8%. On a ${formatMoney(
            100,
            currency
          )} subtotal that is ${formatMoney((100 * rate) / 100, currency)} tax.`}
          className="sm:max-w-xs"
        />
      </FormCard>

      <div className="mt-4">
        <FormCard
          title="Shipping"
          description="A single flat fee, waived above a threshold."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <TextInput
              label="Shipping fee"
              name="shipping_cost"
              type="number"
              step="0.01"
              min="0"
              required
              value={form.values.shipping_cost}
              onChange={(value) => form.set("shipping_cost", value)}
              error={errors.shipping_cost}
              hint="Charged once per order."
            />

            <TextInput
              label="Free shipping threshold"
              name="free_shipping_threshold"
              type="number"
              step="0.01"
              min="0"
              required
              value={form.values.free_shipping_threshold}
              onChange={(value) => form.set("free_shipping_threshold", value)}
              error={errors.free_shipping_threshold}
              hint={
                threshold > 0
                  ? `Orders with a subtotal of ${formatMoney(
                      threshold,
                      currency
                    )} or more ship free.`
                  : "Set to 0 to charge the shipping fee on every order."
              }
            />
          </div>

          <div className="mt-5 space-y-4">
            <SettingsWarning
              tone={form.isDirty ? "caution" : "info"}
              title={
                form.isDirty
                  ? "This changes what customers are charged"
                  : "How these are applied"
              }
            >
              <p>
                New orders are charged using these values from the moment they
                are saved. Orders already placed keep the totals they were
                charged — the admin never recalculates a recorded order, so this
                will not correct past invoices.
              </p>
              <p className="mt-2">
                Carts already open are re-priced when the shopper reaches
                checkout, so somebody mid-purchase sees the new figures before
                they pay.
              </p>
            </SettingsWarning>

            {/* The store has one flat shipping fee and no carriers, methods or
                zones. Saying so is more useful than leaving an administrator
                hunting for the page that would configure them. */}
            <p className="text-xs text-gray-500">
              This store has a single flat shipping rate. There are no carriers,
              shipping methods or delivery zones to configure.
            </p>

            <SettingsSaveBar
              isDirty={form.isDirty}
              dirtyCount={form.dirtyFields.length}
              processing={form.processing}
              onReset={form.reset}
            />
          </div>
        </FormCard>
      </div>
    </form>
  );
}
