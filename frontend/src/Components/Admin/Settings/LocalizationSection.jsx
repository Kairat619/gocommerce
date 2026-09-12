import FormCard from "../Form/FormCard";
import Select from "../Form/Select";
import SettingsSaveBar from "./SettingsSaveBar";
import SettingsWarning from "./SettingsWarning";
import { useSettingsForm } from "./useSettingsForm";

/**
 * Currency and time.
 *
 * CURRENCY IS A LABEL, NOT A CONVERSION.
 *
 * Amounts are stored as plain decimals with no currency of their own. There is
 * no exchange-rate table and no per-order currency column, so switching this
 * does not convert anything — it re-renders every existing price, order total
 * and coupon value with a different symbol. A €10 product does not become
 * ₸10 worth of anything; it becomes a product whose price reads ₸10.
 *
 * That is a genuinely dangerous operation on a store with orders in it, so it
 * is spelled out on the page before the change is applied rather than in a
 * dialog afterwards.
 *
 * TIMEZONE IS REPORTED, NOT CONFIGURED.
 *
 * Every date window in the application — the dashboard's periods, the orders
 * list's date filters, coupon start and end times — is computed from the
 * server's own clock. A picker here would imply those follow it. Making them
 * follow it is a change to date handling across three screens and a regression
 * pass of its own, not a setting, so this section states the truth and says
 * where it comes from.
 */
export default function LocalizationSection({ settings, currencies = [], timezone, errors = {} }) {
  const form = useSettingsForm(
    { currency: settings.currency ?? "USD" },
    "/admin/settings/localization"
  );

  const changingCurrency = form.dirtyFields.includes("currency");

  return (
    <form onSubmit={form.submit}>
      <FormCard
        title="Currency"
        description="The currency every price in the storefront and the admin is displayed in."
      >
        <div className="space-y-5">
          <Select
            label="Display currency"
            name="currency"
            required
            value={form.values.currency}
            onChange={(value) => form.set("currency", value)}
            error={errors.currency}
            options={currencies.map((currency) => ({
              value: currency.code,
              label: `${currency.label} (${currency.code})`,
            }))}
            hint="Used by product prices, cart and checkout totals, order records, coupons and the dashboard alike."
          />

          {changingCurrency ? (
            <SettingsWarning tone="caution" title="This relabels existing prices — it does not convert them">
              <p>
                Every amount already in the database keeps its number and gains a
                new symbol. A product priced <strong>10.00</strong> today will read
                as <strong>10.00 {form.values.currency}</strong> after this
                change, and so will every order already placed.
              </p>
              <p className="mt-2">
                The store has no exchange rates and orders do not record a
                currency of their own, so there is nothing to convert from. If
                you need the prices themselves to change, update them in the
                catalogue.
              </p>
            </SettingsWarning>
          ) : (
            <SettingsWarning title="One currency, everywhere">
              This is the single source of truth for currency. The storefront,
              the product form, the orders screens and the dashboard all read it,
              so they cannot disagree.
            </SettingsWarning>
          )}

          <SettingsSaveBar
            isDirty={form.isDirty}
            dirtyCount={form.dirtyFields.length}
            processing={form.processing}
            onReset={form.reset}
          />
        </div>
      </FormCard>

      <div className="mt-4">
        <FormCard
          title="Timezone"
          description="The clock every date in the admin is read against."
        >
          <dl className="grid gap-4 sm:grid-cols-3">
            <ReadOnly label="Timezone" value={timezone?.name || "Unknown"} />
            <ReadOnly
              label="Offset"
              value={`${timezone?.offset || ""}${timezone?.abbrev ? ` (${timezone.abbrev})` : ""}`}
            />
            <ReadOnly
              label="Server time"
              value={
                timezone?.now
                  ? new Date(timezone.now).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "—"
              }
            />
          </dl>

          <div className="mt-5">
            <SettingsWarning title="Set by the deployment, not here">
              The application uses the server’s own timezone, so “Today” means
              the same day on the dashboard, the orders list and in coupon
              schedules. Changing it is a deployment change — set <code>TZ</code>{" "}
              on the server — and it shifts which day existing orders fall into
              on every date-filtered report.
            </SettingsWarning>
          </div>
        </FormCard>
      </div>
    </form>
  );
}

function ReadOnly({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}
