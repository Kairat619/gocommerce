import FormCard from "../Form/FormCard";
import TextInput from "../Form/TextInput";

/**
 * The two limits are easy to confuse, so each is labelled by what it counts
 * ("across all customers" vs "per customer") rather than by its column name.
 */
export default function CouponUsageLimits({ form, setField, errors, usedCount }) {
  const total = String(form.max_uses ?? "").trim();
  const perCustomer = String(form.max_uses_per_customer ?? "").trim();

  const remaining = total && usedCount != null ? Math.max(Number(total) - usedCount, 0) : null;

  return (
    <FormCard title="Usage limits" description="How many times this coupon can be redeemed.">
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextInput
            label="Total redemptions"
            name="max_uses"
            inputMode="numeric"
            value={form.max_uses}
            onChange={(value) => setField("max_uses", value)}
            error={errors.max_uses}
            placeholder="Unlimited"
            hint="Across all customers. Leave blank for unlimited."
            autoComplete="off"
          />

          <TextInput
            label="Redemptions per customer"
            name="max_uses_per_customer"
            inputMode="numeric"
            value={form.max_uses_per_customer}
            onChange={(value) => setField("max_uses_per_customer", value)}
            error={errors.max_uses_per_customer}
            placeholder="Unlimited"
            hint="How often one customer may reuse it. Leave blank for unlimited."
            autoComplete="off"
          />
        </div>

        {perCustomer && (
          <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800">
            A per-customer limit can only be counted against a signed-in account, so guests are asked to sign in
            before this coupon will apply.
          </p>
        )}

        {usedCount != null && (
          <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
            <span>
              Redeemed <span className="font-semibold text-gray-900">{usedCount}</span>{" "}
              time{usedCount === 1 ? "" : "s"} so far.
            </span>
            <span>
              {remaining === null
                ? "No total limit set."
                : `${remaining} of ${total} remaining.`}
            </span>
          </div>
        )}
      </div>
    </FormCard>
  );
}
