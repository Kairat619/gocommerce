import FormCard from "../Form/FormCard";
import CategoryPicker from "../Form/CategoryPicker";

export default function ProductCategories({ form, setField, errors, categories }) {
  return (
    <FormCard title="Category" description="Where this product lives in the catalogue.">
      <CategoryPicker
        categories={categories}
        value={form.category_id}
        onChange={(value) => setField("category_id", value)}
        error={errors.category_id}
        required
      />
    </FormCard>
  );
}
