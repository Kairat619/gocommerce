import FormCard from "../Form/FormCard";
import MediaUploader from "../Form/MediaUploader";

export default function ProductMedia({ form, setField, errors }) {
  return (
    <FormCard
      title="Media"
      description="Upload photos, drag to reorder, and pick the main image."
      actions={
        form.images.length > 0 && (
          <span className="text-xs text-gray-500">
            {form.images.length} image{form.images.length === 1 ? "" : "s"}
          </span>
        )
      }
    >
      <MediaUploader images={form.images} onChange={(next) => setField("images", next)} errors={errors} />
    </FormCard>
  );
}
