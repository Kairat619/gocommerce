import FormCard from "../Form/FormCard";
import TextInput from "../Form/TextInput";
import { formatMoney } from "../../../lib/money";

/**
 * Order-level qualifying rules. Both are optional and blank means "no
 * requirement", which is why neither carries a spurious 0.
 */
export default function CouponConditions({ form, setField, errors }) {
  const amount = Number(String(form.min_order_amount ?? "").trim());
  const quantity = Number(String(form.min_order_quantity ?? "").trim());

  const hasAmount = Number.isFinite(amount) && amount > 0;
  const hasQuantity = Number.isFinite(quantity) && quantity > 0;

  return (
    <FormCard title="Conditions" description="What an order must meet before this coupon applies.">
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextInput
            label="Minimum order amount"
            name="min_order_amount"
            inputMode="decimal"
            value={form.min_order_amount}
            onChange={(value) => setField("min_order_amount", value)}
            error={errors.min_order_amount}
            prefix="$"
            placeholder="No minimum"
            hint="Measured against the cart subtotal, before tax and shipping."
            autoComplete="off"
          />

          <TextInput
            label="Minimum item quantity"
            name="min_order_quantity"
            inputMode="numeric"
            value={form.min_order_quantity}
            onChange={(value) => setField("min_order_quantity", value)}
            error={errors.min_order_quantity}
            placeholder="No minimum"
            hint="Total units in the cart, not distinct products."
            autoComplete="off"
          />
        </div>

        {/* Restates the rule as the shopper will experience it. */}
        <p className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
          {hasAmount || hasQuantity ? (
            <>
              Applies only when the cart{" "}
              {hasAmount && <>subtotal is at least {formatMoney(amount)}</>}
              {hasAmount && hasQuantity && " and "}
              {hasQuantity && (
                <>
                  contains at least {quantity} item{quantity === 1 ? "" : "s"}
                </>
              )}
              .
            </>
          ) : (
            "Applies to any order, however small."
          )}
        </p>
      </div>
    </FormCard>
  );
}
