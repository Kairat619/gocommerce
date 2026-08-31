import FormCard from "../Form/FormCard";
import RadioCards from "../Form/RadioCards";
import Toggle from "../Form/Toggle";

export default function ProductStatus({ form, setField, isEdit }) {
  return (
    <FormCard title="Product status" description="Controls whether shoppers can see and buy this product.">
      <div className="space-y-4">
        <RadioCards
          label="Status"
          name="is_active"
          value={form.is_active}
          onChange={(value) => setField("is_active", value)}
          options={[
            { value: true, label: "Active", description: "Live in the storefront" },
            { value: false, label: "Disabled", description: "Hidden from shoppers" },
          ]}
        />

        <div className="border-t border-gray-200 pt-4">
          <Toggle
            name="is_featured"
            label="Featured product"
            description="Promote this product on the home page."
            checked={form.is_featured}
            onChange={(value) => setField("is_featured", value)}
          />
        </div>

        {!isEdit && !form.is_active && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Saved as disabled — it stays out of the storefront until you set it to Active.
          </p>
        )}
      </div>
    </FormCard>
  );
}
