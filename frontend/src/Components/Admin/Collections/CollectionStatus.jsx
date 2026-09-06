import FormCard from "../Form/FormCard";
import RadioCards from "../Form/RadioCards";
import Toggle from "../Form/Toggle";

export default function CollectionStatus({ form, setField, isEdit, productCount = 0 }) {
  return (
    <FormCard title="Status" description="Controls whether shoppers can reach this collection.">
      <div className="space-y-4">
        <RadioCards
          label="Visibility"
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
              ? `Disabling hides this collection from /collections and makes its page return 404${
                  productCount > 0
                    ? `. Its ${productCount} product${productCount === 1 ? "" : "s"} stay published and remain reachable from the catalogue.`
                    : "."
                }`
              : "Saved as disabled — it stays out of the storefront until you set it to Active."}
          </p>
        )}

        <div className="border-t border-gray-200 pt-4">
          <Toggle
            name="is_featured"
            label="Featured collection"
            description="Promoted on the storefront ahead of the others."
            checked={form.is_featured}
            onChange={(value) => setField("is_featured", value)}
          />

          {form.is_featured && !form.is_active && (
            <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Featured has no effect while the collection is disabled — visibility is the authority.
            </p>
          )}
        </div>
      </div>
    </FormCard>
  );
}
