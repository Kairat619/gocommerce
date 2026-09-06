import FormCard from "../Form/FormCard";
import RadioCards from "../Form/RadioCards";
import TextInput from "../Form/TextInput";
import { DISCOUNT_TYPES } from "./couponFormState";

/**
 * Discount type and the fields that type actually uses. Irrelevant inputs are
 * unmounted rather than disabled, so nothing on screen can be filled in and
 * then silently ignored on save.
 */
export default function CouponDiscount({ form, setField, errors }) {
  const isPercentage = form.discount_type === DISCOUNT_TYPES.PERCENTAGE;
  const isFixed = form.discount_type === DISCOUNT_TYPES.FIXED;
  const isFreeShipping = form.discount_type === DISCOUNT_TYPES.FREE_SHIPPING;

  return (
    <FormCard title="Discount" description="What this coupon takes off the order.">
      <div className="space-y-5">
        <RadioCards
          label="Discount type"
          name="discount_type"
          value={form.discount_type}
          onChange={(value) => setField("discount_type", value)}
          error={errors.discount_type}
          columns={1}
          options={[
            {
              value: DISCOUNT_TYPES.PERCENTAGE,
              label: "Percentage off",
              description: "A share of the order subtotal, optionally capped",
            },
            {
              value: DISCOUNT_TYPES.FIXED,
              label: "Fixed amount off",
              description: "A flat sum off the order subtotal",
            },
            {
              value: DISCOUNT_TYPES.FREE_SHIPPING,
              label: "Free shipping",
              description: "Removes the shipping charge; the subtotal is untouched",
            },
          ]}
        />

        {/* Live region: the fields below change with the selection, and a
            keyboard or screen-reader user needs that announced. */}
        <div aria-live="polite">
          {isPercentage && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <TextInput
                label="Percentage off"
                name="discount_value"
                required
                inputMode="decimal"
                value={form.discount_value}
                onChange={(value) => setField("discount_value", value)}
                error={errors.discount_value}
                suffix="%"
                placeholder="10"
                autoComplete="off"
              />
              <TextInput
                label="Maximum discount"
                name="max_discount_amount"
                inputMode="decimal"
                value={form.max_discount_amount}
                onChange={(value) => setField("max_discount_amount", value)}
                error={errors.max_discount_amount}
                prefix="$"
                placeholder="No cap"
                hint="Caps what a large order can save. Leave blank for no cap."
                autoComplete="off"
              />
            </div>
          )}

          {isFixed && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <TextInput
                label="Amount off"
                name="discount_value"
                required
                inputMode="decimal"
                value={form.discount_value}
                onChange={(value) => setField("discount_value", value)}
                error={errors.discount_value}
                prefix="$"
                placeholder="25.00"
                hint="Never takes more off than the order subtotal."
                autoComplete="off"
              />
            </div>
          )}

          {isFreeShipping && (
            <p className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
              The shipping line is set to $0 at checkout. Nothing comes off the subtotal, so there is no amount
              to enter.
            </p>
          )}
        </div>
      </div>
    </FormCard>
  );
}
