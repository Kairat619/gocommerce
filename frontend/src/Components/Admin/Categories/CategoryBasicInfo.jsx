import FormCard from "../Form/FormCard";
import RichTextEditor from "../Form/RichTextEditor";
import TextInput from "../Form/TextInput";

export default function CategoryBasicInfo({ form, setField, errors }) {
  return (
    <FormCard title="General information" description="What shoppers see at the top of the collection page.">
      <div className="space-y-5">
        <TextInput
          label="Category name"
          name="name"
          required
          value={form.name}
          onChange={(value) => setField("name", value)}
          error={errors.name}
          placeholder="e.g. Kitchen Appliances"
          autoComplete="off"
          maxLength={255}
        />

        <RichTextEditor
          label="Description"
          name="description"
          value={form.description}
          onChange={(value) => setField("description", value)}
          error={errors.description}
          placeholder="Introduce the collection — what belongs in it and who it is for."
          hint="Shown on the category page beneath the heading."
        />
      </div>
    </FormCard>
  );
}
