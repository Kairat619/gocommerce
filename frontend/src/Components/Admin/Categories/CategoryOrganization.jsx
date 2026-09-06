import CategoryPicker from "../Form/CategoryPicker";
import FormCard from "../Form/FormCard";
import TextInput from "../Form/TextInput";

export default function CategoryOrganization({
  form,
  setField,
  errors,
  categories = [],
  forbiddenParentIds,
  isEdit,
}) {
  return (
    <FormCard title="Placement" description="Where this category sits in the catalogue.">
      <div className="space-y-5">
        <CategoryPicker
          label="Parent category"
          categories={categories}
          value={form.parent_id}
          onChange={(value) => setField("parent_id", value)}
          error={errors.parent_id}
          disabledIds={forbiddenParentIds}
          disabledHint={isEdit ? "(itself or below)" : undefined}
          rootOption={{
            label: "Top level",
            description: "A root collection with no parent",
          }}
          emptyMessage="No other categories yet — this one will be a top-level collection."
          searchPlaceholder="Search parent categories"
          hint="Search, or expand a branch to place this category inside it."
        />

        <TextInput
          label="Sort position"
          name="sort_order"
          inputMode="numeric"
          value={form.sort_order}
          onChange={(value) => setField("sort_order", value)}
          error={errors.sort_order}
          hint="Lower numbers come first. Categories with the same position fall back to alphabetical order."
        />
      </div>
    </FormCard>
  );
}
