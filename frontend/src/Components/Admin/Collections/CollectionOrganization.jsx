import FormCard from "../Form/FormCard";
import TextInput from "../Form/TextInput";

export default function CollectionOrganization({ form, setField, errors }) {
  return (
    <FormCard title="Placement" description="How this collection is ordered against the others.">
      <TextInput
        label="Sort position"
        name="sort_order"
        inputMode="numeric"
        value={form.sort_order}
        onChange={(value) => setField("sort_order", value)}
        error={errors.sort_order}
        hint="Lower numbers come first on /collections. Collections with the same position fall back to alphabetical order."
      />
    </FormCard>
  );
}
