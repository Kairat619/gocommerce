import { stripHtml } from "../../../lib/html";
import FormCard from "../Form/FormCard";
import TextInput from "../Form/TextInput";
import Textarea from "../Form/Textarea";
import { slugify } from "./categoryFormState";

export default function CategorySEO({ form, setField, errors, isEdit, originalSlug }) {
  const slug = form.url_key ? slugify(form.url_key) : slugify(form.name);
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  const title = form.meta_title.trim() || form.name.trim() || "Category name";
  const description = form.meta_description.trim() || stripHtml(form.description).slice(0, 160);

  const slugChanged = isEdit && originalSlug && slug && slug !== originalSlug;

  return (
    <FormCard title="Search engine optimization" description="How this collection appears in search results.">
      <div className="space-y-4">
        <TextInput
          label="URL key"
          name="url_key"
          value={form.url_key}
          onChange={(value) => setField("url_key", value)}
          error={errors.url_key}
          prefix="/categories/"
          placeholder={slugify(form.name) || "category-name"}
          autoComplete="off"
          hint={
            isEdit
              ? "Changing this changes the collection's public address."
              : "Generated from the category name — edit it if you like."
          }
        />

        {slugChanged && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            The public address will change from <span className="font-mono">/categories/{originalSlug}</span> to{" "}
            <span className="font-mono">/categories/{slug}</span>. Existing links to the old address will stop
            working.
          </p>
        )}

        <TextInput
          label="Meta title"
          name="meta_title"
          value={form.meta_title}
          onChange={(value) => setField("meta_title", value)}
          error={errors.meta_title}
          hint="Falls back to the category name. Around 60 characters reads best."
        />

        <Textarea
          label="Meta description"
          name="meta_description"
          rows={3}
          maxLength={500}
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
          hint="Comma-separated terms describing the collection."
        />

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Search preview</p>
          <p className="truncate text-xs text-gray-600">
            {origin}
            /categories/{slug || "category-name"}
          </p>
          <p className="mt-0.5 truncate text-base text-[#1a0dab]">{title}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-gray-600">
            {description || "Add a meta description or a category description to control this snippet."}
          </p>
        </div>
      </div>
    </FormCard>
  );
}
