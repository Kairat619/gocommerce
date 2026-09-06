import FormCard from "../Form/FormCard";
import { slugify } from "./collectionFormState";

/**
 * A read-only restatement of the configuration, so the merchant can check what
 * they are about to publish without scrolling back through five cards.
 */
export default function CollectionSummary({ form, products = [] }) {
  const slug = form.url_key ? slugify(form.url_key) : slugify(form.name);
  const live = products.filter((product) => product.is_active).length;

  return (
    <FormCard title="Summary">
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">Name</dt>
          <dd className="mt-0.5 truncate font-medium text-gray-900">
            {form.name.trim() || <span className="font-normal text-gray-400">Not set yet</span>}
          </dd>
        </div>

        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">Address</dt>
          <dd className="mt-0.5 truncate font-mono text-xs text-gray-600">
            /collections/{slug || "…"}
          </dd>
        </div>

        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">Products</dt>
          <dd className="mt-0.5 text-gray-900">
            {products.length === 0 ? (
              <span className="text-gray-400">None selected</span>
            ) : (
              <>
                {products.length} selected
                {live !== products.length && (
                  <span className="text-amber-600"> · {live} visible to shoppers</span>
                )}
              </>
            )}
          </dd>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              form.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
            }`}
          >
            {form.is_active ? "Active" : "Disabled"}
          </span>
          {form.is_featured && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Featured
            </span>
          )}
        </div>
      </dl>
    </FormCard>
  );
}
