import FormCard from "../Form/FormCard";
import RadioCards from "../Form/RadioCards";

export default function CategoryStatus({ form, setField, isEdit, productCount = 0 }) {
  return (
    <FormCard title="Category status" description="Controls whether shoppers can reach this collection.">
      <div className="space-y-4">
        <RadioCards
          label="Status"
          name="is_active"
          value={form.is_active}
          onChange={(value) => setField("is_active", value)}
          options={[
            { value: true, label: "Active", description: "Listed in the storefront" },
            { value: false, label: "Disabled", description: "Hidden from shoppers" },
          ]}
        />

        {!form.is_active && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {isEdit
              ? `Disabling hides this collection from /categories${
                  productCount > 0
                    ? `. Its ${productCount} product${productCount === 1 ? "" : "s"} stay published and remain reachable from search and direct links.`
                    : "."
                }`
              : "Saved as disabled — it stays out of the storefront until you set it to Active."}
          </p>
        )}
      </div>
    </FormCard>
  );
}
