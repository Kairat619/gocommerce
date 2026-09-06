import FormCard from "../Form/FormCard";
import SingleImageUploader from "../Form/SingleImageUploader";

export default function CollectionMedia({ form, setField, errors }) {
  return (
    <FormCard
      title="Collection image"
      description="Used on the collection tiles and as the banner on the collection page."
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
