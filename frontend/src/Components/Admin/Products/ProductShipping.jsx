import FormCard from "../Form/FormCard";
import TextInput from "../Form/TextInput";

export default function ProductShipping({ form, setField, errors }) {
  return (
    <FormCard title="Shipping" description="Used for packing and carrier rates.">
      <div className="grid gap-4 sm:grid-cols-4">
        <TextInput
          label="Weight"
          name="weight"
          inputMode="decimal"
          suffix="kg"
          value={form.weight}
          onChange={(value) => setField("weight", value)}
          error={errors.weight}
          placeholder="0.00"
        />
        <TextInput
          label="Length"
          name="length"
          inputMode="decimal"
          suffix="cm"
          value={form.length}
          onChange={(value) => setField("length", value)}
          error={errors.length}
          placeholder="0.00"
        />
        <TextInput
          label="Width"
          name="width"
          inputMode="decimal"
          suffix="cm"
          value={form.width}
          onChange={(value) => setField("width", value)}
          error={errors.width}
          placeholder="0.00"
        />
        <TextInput
          label="Height"
          name="height"
          inputMode="decimal"
          suffix="cm"
          value={form.height}
          onChange={(value) => setField("height", value)}
          error={errors.height}
          placeholder="0.00"
        />
      </div>
    </FormCard>
  );
}
