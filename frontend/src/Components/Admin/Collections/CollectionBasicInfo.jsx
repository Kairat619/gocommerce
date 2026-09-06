import FormCard from "../Form/FormCard";
import RichTextEditor from "../Form/RichTextEditor";
import TextInput from "../Form/TextInput";

export default function CollectionBasicInfo({ form, setField, errors }) {
  return (
    <FormCard
      title="General information"
      description="What shoppers see at the top of the collection page."
    >
      <div className="space-y-5">
        <TextInput
          label="Collection name"
          name="name"
          required
          value={form.name}
          onChange={(value) => setField("name", value)}
          error={errors.name}
          placeholder="e.g. Summer Kitchen Essentials"
          autoComplete="off"
          maxLength={255}
          hint="Name it for the shopper, not the catalogue — this is the heading on the collection page."
        />

        <RichTextEditor
          label="Description"
          name="description"
          value={form.description}
          onChange={(value) => setField("description", value)}
          error={errors.description}
          placeholder="Say what ties these products together and who the collection is for."
          hint="Shown on the collection page beneath the heading."
        />
      </div>
    </FormCard>
  );
}
