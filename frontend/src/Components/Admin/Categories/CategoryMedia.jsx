import FormCard from "../Form/FormCard";
import SingleImageUploader from "../Form/SingleImageUploader";

export default function CategoryMedia({ form, setField, errors }) {
  return (
    <FormCard
      title="Category image"
      description="Used on the collection tiles and as the banner on the category page."
    >
      <SingleImageUploader
        name="image_url"
        value={form.image_url}
        alt={form.name}
        onChange={(url) => setField("image_url", url)}
        error={errors.image_url}
      />

      {!form.image_url && (
        <p className="mt-3 text-xs text-gray-500">
          Without an image the storefront falls back to a generic placeholder tile. A wide (16:9) photo works best.
        </p>
      )}
    </FormCard>
  );
}
