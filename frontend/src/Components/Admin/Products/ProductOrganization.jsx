import FormCard from "../Form/FormCard";
import Combobox from "../Form/Combobox";
import TagInput from "../Form/TagInput";
import TextInput from "../Form/TextInput";

export default function ProductOrganization({ form, setField, errors, brands = [] }) {
  return (
    <FormCard title="Organization" description="Merchandising details used across the store.">
      <div className="space-y-4">
        <Combobox
          label="Brand"
          name="brand"
          value={form.brand}
          onChange={(value) => setField("brand", value)}
          options={brands}
          error={errors.brand}
          placeholder="Search or type a brand"
          hint="Pick an existing brand or enter a new one."
        />

        <TagInput
          label="Tags"
          name="tags"
          tags={form.tags}
          onChange={(value) => setField("tags", value)}
          error={errors.tags}
          hint="Used for internal grouping and search."
        />

        <TextInput
          label="Sort position"
          name="sort_order"
          inputMode="numeric"
          value={form.sort_order}
          onChange={(value) => setField("sort_order", value)}
          error={errors.sort_order}
          hint="Lower numbers come first in curated lists."
        />
      </div>
    </FormCard>
  );
}
