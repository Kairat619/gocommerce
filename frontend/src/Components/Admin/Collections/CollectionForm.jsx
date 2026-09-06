import { router, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";

import CollectionBasicInfo from "./CollectionBasicInfo";
import CollectionFormActions from "./CollectionFormActions";
import CollectionFormHeader from "./CollectionFormHeader";
import CollectionMedia from "./CollectionMedia";
import CollectionOrganization from "./CollectionOrganization";
import CollectionProducts from "./CollectionProducts";
import CollectionSEO from "./CollectionSEO";
import CollectionStatus from "./CollectionStatus";
import CollectionSummary from "./CollectionSummary";
import {
  buildInitialForm,
  buildInitialProducts,
  slugify,
  toPayload,
  validateForm,
} from "./collectionFormState";

// Shared by Pages/Admin/Collections/Create and .../Edit so the two workflows
// cannot drift apart — the only difference is the initial state and the submit
// URL. Modelled on Components/Admin/Categories/CategoryForm.
export default function CollectionForm({ action, isEdit = false, collection, products: initialProducts }) {
  const { errors: serverErrors = {}, product_search: search } = usePage().props;

  const [form, setForm] = useState(() => buildInitialForm(collection));
  const [products, setProducts] = useState(() => buildInitialProducts(initialProducts));
  const [dismissed, setDismissed] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => setDismissed({}), [serverErrors]);

  // On edit the slug is already public, so it is never regenerated from the
  // name behind the merchant's back.
  const slugTouched = useRef(isEdit);
  const formRef = useRef(null);

  function setField(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: typeof value === "function" ? value(current[field]) : value };

      if (field === "url_key") slugTouched.current = true;
      if (field === "name" && !slugTouched.current) next.url_key = slugify(next.name);

      return next;
    });
    setDismissed((current) => ({ ...current, [field]: true }));
  }

  // Editing the membership clears a stale server complaint about it, the same
  // way setField does for the scalar fields.
  function updateProducts(value) {
    setProducts(value);
    setDismissed((current) => ({ ...current, product_ids: true }));
  }

  const liveErrors = useMemo(
    () => (submitted ? validateForm(form, products) : {}),
    [submitted, form, products],
  );

  // A server error stands until its field is edited again; live client-side
  // checks take over from the first submit so fixes clear as they are typed.
  const errors = useMemo(() => {
    const merged = {};
    Object.entries(serverErrors).forEach(([field, message]) => {
      if (!dismissed[field]) merged[field] = message;
    });
    return { ...merged, ...liveErrors };
  }, [serverErrors, dismissed, liveErrors]);

  const errorCount = Object.keys(errors).length;

  function submit(redirectTo) {
    if (processing) return;

    const found = validateForm(form, products);
    setSubmitted(true);

    if (Object.keys(found).length > 0) {
      formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    router.post(action, toPayload(form, products, redirectTo), {
      preserveScroll: true,
      // Keeps the staged product selection — which lives only in this
      // component — through a bounce back to the form on a validation error.
      preserveState: true,
      onStart: () => setProcessing(true),
      onFinish: () => setProcessing(false),
    });
  }

  return (
    <div ref={formRef}>
      <CollectionFormHeader isEdit={isEdit} collection={collection} productCount={products.length} />

      {errorCount > 0 && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3" role="alert">
          <p className="text-sm font-medium text-red-800">
            {errorCount} field{errorCount === 1 ? "" : "s"} need{errorCount === 1 ? "s" : ""} attention before
            this collection can be saved.
          </p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-sm text-red-700">
            {Object.entries(errors)
              .slice(0, 5)
              .map(([field, message]) => (
                <li key={field}>{message}</li>
              ))}
          </ul>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit("index");
        }}
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <CollectionBasicInfo form={form} setField={setField} errors={errors} />
            <CollectionProducts
              products={products}
              setProducts={updateProducts}
              search={search}
              error={errors.product_ids}
            />
            <CollectionMedia form={form} setField={setField} errors={errors} />
            <CollectionSEO
              form={form}
              setField={setField}
              errors={errors}
              isEdit={isEdit}
              originalSlug={collection?.slug}
            />
          </div>

          <div className="space-y-6">
            <div className="space-y-6 lg:sticky lg:top-20">
              <CollectionSummary form={form} products={products} />
              <CollectionStatus
                form={form}
                setField={setField}
                isEdit={isEdit}
                productCount={products.length}
              />
              <CollectionOrganization form={form} setField={setField} errors={errors} />
            </div>
          </div>
        </div>

        <CollectionFormActions
          isEdit={isEdit}
          processing={processing}
          errorCount={errorCount}
          productCount={products.length}
          onSubmit={() => submit("index")}
          onSubmitAndContinue={() => submit("edit")}
        />
      </form>
    </div>
  );
}
