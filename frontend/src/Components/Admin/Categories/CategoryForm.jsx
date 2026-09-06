import { router, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";

import CategoryBasicInfo from "./CategoryBasicInfo";
import CategoryFormActions from "./CategoryFormActions";
import CategoryFormHeader from "./CategoryFormHeader";
import CategoryMedia from "./CategoryMedia";
import CategoryOrganization from "./CategoryOrganization";
import CategorySEO from "./CategorySEO";
import CategoryStatus from "./CategoryStatus";
import { buildInitialForm, slugify, toPayload, validateForm } from "./categoryFormState";
import { pathOf, subtreeIds } from "./categoryTree";

// Shared by Pages/Admin/Categories/Create and .../Edit so the two workflows
// cannot drift apart — the only difference is the initial state and the submit
// URL. Modelled on Components/Admin/Products/ProductForm.
export default function CategoryForm({ action, isEdit = false, category, categories = [] }) {
  const { errors: serverErrors = {} } = usePage().props;

  const [form, setForm] = useState(() => buildInitialForm(category));
  const [dismissed, setDismissed] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => setDismissed({}), [serverErrors]);

  // On edit the slug is already public, so it is never regenerated from the
  // name behind the merchant's back.
  const slugTouched = useRef(isEdit);
  const formRef = useRef(null);

  // The category being edited and everything under it cannot become its parent.
  const forbiddenParentIds = useMemo(
    () => (isEdit && category ? subtreeIds(categories, category.id) : undefined),
    [isEdit, category, categories],
  );

  // The breadcrumb under the page heading, so the destination is legible
  // without scrolling back to the picker.
  const parentPath = useMemo(
    () => (form.parent_id ? pathOf(categories, form.parent_id) : []),
    [categories, form.parent_id],
  );

  function setField(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: typeof value === "function" ? value(current[field]) : value };

      if (field === "url_key") slugTouched.current = true;
      if (field === "name" && !slugTouched.current) next.url_key = slugify(next.name);

      return next;
    });
    setDismissed((current) => ({ ...current, [field]: true }));
  }

  const liveErrors = useMemo(
    () => (submitted ? validateForm(form, forbiddenParentIds) : {}),
    [submitted, form, forbiddenParentIds],
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

    const found = validateForm(form, forbiddenParentIds);
    setSubmitted(true);

    if (Object.keys(found).length > 0) {
      formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    router.post(action, toPayload(form, redirectTo), {
      preserveScroll: true,
      preserveState: true,
      onStart: () => setProcessing(true),
      onFinish: () => setProcessing(false),
    });
  }

  return (
    <div ref={formRef}>
      <CategoryFormHeader isEdit={isEdit} category={category} parentPath={parentPath} />

      {errorCount > 0 && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3" role="alert">
          <p className="text-sm font-medium text-red-800">
            {errorCount} field{errorCount === 1 ? "" : "s"} need{errorCount === 1 ? "s" : ""} attention before this
            category can be saved.
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
            <CategoryBasicInfo form={form} setField={setField} errors={errors} />
            <CategoryMedia form={form} setField={setField} errors={errors} />
            <CategorySEO
              form={form}
              setField={setField}
              errors={errors}
              isEdit={isEdit}
              originalSlug={category?.slug}
            />
          </div>

          <div className="space-y-6">
            <div className="space-y-6 lg:sticky lg:top-20">
              <CategoryStatus
                form={form}
                setField={setField}
                isEdit={isEdit}
                productCount={category?.product_count}
              />
              <CategoryOrganization
                form={form}
                setField={setField}
                errors={errors}
                categories={categories}
                forbiddenParentIds={forbiddenParentIds}
                isEdit={isEdit}
              />
            </div>
          </div>
        </div>

        <CategoryFormActions
          isEdit={isEdit}
          processing={processing}
          errorCount={errorCount}
          onSubmit={() => submit("index")}
          onSubmitAndContinue={() => submit("edit")}
        />
      </form>
    </div>
  );
}
