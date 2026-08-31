import FormCard from "../Form/FormCard";
import TextInput from "../Form/TextInput";
import Textarea from "../Form/Textarea";
import { slugify } from "./productFormState";

function stripHtml(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function ProductSEO({ form, setField, errors, isEdit, originalSlug }) {
  const slug = form.url_key ? slugify(form.url_key) : slugify(form.name);
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  const title = form.meta_title.trim() || form.name.trim() || "Product name";
  const description =
    form.meta_description.trim() || form.short_description.trim() || stripHtml(form.description).slice(0, 160);

  const slugChanged = isEdit && originalSlug && slug && slug !== originalSlug;

  return (
    <FormCard title="Search engine optimization" description="How this product appears in search results.">
      <div className="space-y-4">
        <TextInput
          label="URL key"
          name="url_key"
          value={form.url_key}
          onChange={(value) => setField("url_key", value)}
          error={errors.url_key}
          prefix="/products/"
          placeholder={slugify(form.name) || "product-name"}
          autoComplete="off"
          hint={isEdit ? "Changing this changes the product's public URL." : "Generated from the product name — edit it if you like."}
        />

        {slugChanged && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            The public URL will change from <span className="font-mono">/products/{originalSlug}</span> to{" "}
            <span className="font-mono">/products/{slug}</span>. Existing links to the old address will stop working.
          </p>
        )}

        <TextInput
          label="Meta title"
          name="meta_title"
          value={form.meta_title}
          onChange={(value) => setField("meta_title", value)}
          error={errors.meta_title}
          hint="Falls back to the product name. Around 60 characters reads best."
        />

        <Textarea
          label="Meta description"
          name="meta_description"
          rows={3}
          maxLength={320}
          value={form.meta_description}
          onChange={(value) => setField("meta_description", value)}
          error={errors.meta_description}
          hint="Around 155 characters reads best."
        />

        <TextInput
          label="Search keywords"
          name="meta_keywords"
          value={form.meta_keywords}
          onChange={(value) => setField("meta_keywords", value)}
          error={errors.meta_keywords}
          hint="Comma-separated terms used by on-site search."
        />

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Search preview</p>
          <p className="truncate text-xs text-gray-600">
            {origin}
            /products/{slug || "product-name"}
          </p>
          <p className="mt-0.5 truncate text-base text-[#1a0dab]">{title}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-gray-600">
            {description || "Add a meta description or short description to control this snippet."}
          </p>
        </div>
      </div>
    </FormCard>
  );
}
