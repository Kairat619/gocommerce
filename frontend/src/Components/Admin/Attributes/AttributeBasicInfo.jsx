import FormCard from "../Form/FormCard";
import TextInput from "../Form/TextInput";
import { slugify } from "./attributeFormState";

export default function AttributeBasicInfo({ form, setField, errors, isEdit, originalCode }) {
  const code = form.code ? slugify(form.code) : slugify(form.name);
  const codeChanged = isEdit && originalCode && code && code !== originalCode;

  return (
    <FormCard
      title="General information"
      description="What this attribute is called, and how the rest of the system refers to it."
    >
      <div className="space-y-5">
        <TextInput
          label="Attribute name"
          name="name"
          required
          value={form.name}
          onChange={(value) => setField("name", value)}
          error={errors.name}
          placeholder="e.g. Material"
          autoComplete="off"
          maxLength={255}
          hint="What a merchant sees when filling in a product — keep it a noun, like Color or Capacity."
        />

        <TextInput
          label="Code"
          name="code"
          value={form.code}
          onChange={(value) => setField("code", value)}
          error={errors.code}
          placeholder={slugify(form.name) || "material"}
          autoComplete="off"
          maxLength={100}
          hint={
            isEdit
              ? "The internal identifier. Products reference this attribute by its ID, not its code, so renaming it is safe."
              : "Generated from the name — edit it if you like. Lowercase letters, numbers and hyphens."
          }
        />

        {codeChanged && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            The code will change from <span className="font-mono">{originalCode}</span> to{" "}
            <span className="font-mono">{code}</span>. No product data moves, but anything referring to the
            attribute by code will need updating.
          </p>
        )}
      </div>
    </FormCard>
  );
}
