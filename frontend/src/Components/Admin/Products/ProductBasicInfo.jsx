import FormCard from "../Form/FormCard";
import TextInput from "../Form/TextInput";
import Textarea from "../Form/Textarea";
import RichTextEditor from "../Form/RichTextEditor";

export default function ProductBasicInfo({ form, setField, errors }) {
  return (
    <FormCard
      title="General information"
      description="The essentials a shopper sees first."
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextInput
            className="sm:col-span-2"
            label="Product name"
            name="name"
            required
            value={form.name}
            onChange={(value) => setField("name", value)}
            error={errors.name}
            placeholder="e.g. Merino Wool Overcoat"
            autoComplete="off"
          />
          <TextInput
            label="SKU"
            name="sku"
            value={form.sku}
            onChange={(value) => setField("sku", value)}
            error={errors.sku}
            hint="Your internal product code"
            placeholder="e.g. COAT-WOOL-01"
            autoComplete="off"
          />
        </div>

        <Textarea
          label="Short description"
          name="short_description"
          rows={2}
          maxLength={500}
          value={form.short_description}
          onChange={(value) => setField("short_description", value)}
          error={errors.short_description}
          hint="Shown in listings and previews. Keep it to a line or two."
        />

        <RichTextEditor
          label="Description"
          name="description"
          value={form.description}
          onChange={(value) => setField("description", value)}
          error={errors.description}
          placeholder="Describe the product, its materials, fit and care."
        />
      </div>
    </FormCard>
  );
}
