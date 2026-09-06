import FormCard from "../Form/FormCard";
import TextInput from "../Form/TextInput";

export default function AttributeOrganization({ form, setField, errors }) {
  return (
    <FormCard title="Placement" description="Where this attribute sits among the others.">
      <TextInput
        label="Sort position"
        name="sort_order"
        inputMode="numeric"
        value={form.sort_order}
        onChange={(value) => setField("sort_order", value)}
        error={errors.sort_order}
        hint="Lower numbers come first in the attribute list and on the product form. Ties fall back to alphabetical order."
      />
    </FormCard>
  );
}
