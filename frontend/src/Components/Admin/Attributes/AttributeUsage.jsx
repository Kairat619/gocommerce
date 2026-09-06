import FormCard from "../Form/FormCard";
import Toggle from "../Form/Toggle";
import { hasOptions } from "./attributeFormState";

/**
 * How the attribute behaves once it is on a product.
 *
 * Only two switches, because only two are real. `is_variant` genuinely drives
 * the product form's variant builder; `is_required` is stored but not yet
 * enforced, and says so rather than implying otherwise.
 *
 * Deliberately absent: "use in filters" and "show on product page". The
 * storefront filter query matches on search, category and price only, and the
 * product page never loads product_attributes — so either switch would be
 * decoration. They belong here the day the storefront can honour them.
 */
export default function AttributeUsage({ form, setField, isEdit, productCount = 0 }) {
  const optionType = hasOptions(form.type);

  return (
    <FormCard title="Usage" description="What this attribute does once it is on a product.">
      <div className="space-y-5">
        <div>
          <Toggle
            name="is_variant"
            label="Can build variants"
            description="Lets the product form generate variant combinations from this attribute's values."
            checked={optionType && form.is_variant}
            onChange={(value) => setField("is_variant", value)}
            disabled={!optionType}
          />

          {!optionType ? (
            <p className="mt-2 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
              Variants are built by combining values from a fixed list, so this needs a{" "}
              <span className="font-medium">Single choice</span> or{" "}
              <span className="font-medium">Multiple choice</span> type.
            </p>
          ) : (
            form.is_variant && (
              <p className="mt-2 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800">
                The product form will offer this attribute's values when generating variants — for example
                Color × Size producing one variant per pairing, each with its own SKU, price and stock.
              </p>
            )
          )}
        </div>

        <div className="border-t border-gray-200 pt-5">
          <Toggle
            name="is_required"
            label="Required on products"
            description="Marks the attribute as one every product ought to carry."
            checked={form.is_required}
            onChange={(value) => setField("is_required", value)}
          />

          {form.is_required && (
            <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Recorded, but <span className="font-medium">not yet enforced</span>: saving a product without
              this attribute still succeeds. The flag is stored so product validation can honour it later —
              turning it on now will not block anyone.
            </p>
          )}
        </div>

        {isEdit && productCount > 0 && (
          <div className="border-t border-gray-200 pt-5">
            <p className="text-sm text-gray-600">
              Currently on{" "}
              <span className="font-medium text-gray-900">
                {productCount} product{productCount === 1 ? "" : "s"}
              </span>
              . Changing these settings does not alter values already stored on them.
            </p>
          </div>
        )}
      </div>
    </FormCard>
  );
}
