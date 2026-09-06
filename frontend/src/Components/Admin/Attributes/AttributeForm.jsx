import { router, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";

import AttributeBasicInfo from "./AttributeBasicInfo";
import AttributeFormActions from "./AttributeFormActions";
import AttributeFormHeader from "./AttributeFormHeader";
import AttributeOrganization from "./AttributeOrganization";
import AttributePreview from "./AttributePreview";
import AttributeTypeSelector from "./AttributeTypeSelector";
import AttributeUsage from "./AttributeUsage";
import AttributeValues from "./AttributeValues";
import {
  buildInitialForm,
  buildInitialOptions,
  hasOptions,
  slugify,
  toPayload,
  validateForm,
} from "./attributeFormState";

// Shared by Pages/Admin/Attributes/Create and .../Edit so the two workflows
// cannot drift apart — the only difference is the initial state and the submit
// URL. Modelled on Components/Admin/Collections/CollectionForm.
export default function AttributeForm({ action, isEdit = false, attribute, options: initialOptions }) {
  const { errors: serverErrors = {} } = usePage().props;

  const [form, setForm] = useState(() => buildInitialForm(attribute));
  const [options, setOptions] = useState(() => buildInitialOptions(initialOptions));
  const [dismissed, setDismissed] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => setDismissed({}), [serverErrors]);

  // On edit the code is already referenced elsewhere, so it is never
  // regenerated from the name behind the merchant's back.
  const codeTouched = useRef(isEdit);
  const formRef = useRef(null);

  const productCount = attribute?.product_count ?? 0;

  function setField(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: typeof value === "function" ? value(current[field]) : value };

      if (field === "code") codeTouched.current = true;
      if (field === "name" && !codeTouched.current) next.code = slugify(next.name);

      return next;
    });
    setDismissed((current) => ({ ...current, [field]: true }));
  }

  function updateOptions(value) {
    setOptions(value);
    setDismissed((current) => ({ ...current, options: true }));
  }

  const validationContext = useMemo(
    () => ({ isEdit, originalType: attribute?.type, productCount }),
    [isEdit, attribute, productCount],
  );

  const liveErrors = useMemo(
    () => (submitted ? validateForm(form, options, validationContext) : {}),
    [submitted, form, options, validationContext],
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

    const found = validateForm(form, options, validationContext);
    setSubmitted(true);

    if (Object.keys(found).length > 0) {
      formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    router.post(action, toPayload(form, options, redirectTo), {
      preserveScroll: true,
      // Keeps the typed-out value rows, which live only in this component,
      // through a bounce back to the form on a validation error.
      preserveState: true,
      onStart: () => setProcessing(true),
      onFinish: () => setProcessing(false),
    });
  }

  return (
    <div ref={formRef}>
      <AttributeFormHeader isEdit={isEdit} attribute={attribute} />

      {errorCount > 0 && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3" role="alert">
          <p className="text-sm font-medium text-red-800">
            {errorCount} field{errorCount === 1 ? "" : "s"} need{errorCount === 1 ? "s" : ""} attention before
            this attribute can be saved.
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
            <AttributeBasicInfo
              form={form}
              setField={setField}
              errors={errors}
              isEdit={isEdit}
              originalCode={attribute?.code}
            />
            <AttributeTypeSelector
              form={form}
              setField={setField}
              errors={errors}
              isEdit={isEdit}
              productCount={productCount}
            />
            {/* Only the list types have a fixed set of values; for the rest the
                merchant types a value per product, so the editor is not shown. */}
            {hasOptions(form.type) && (
              <AttributeValues
                type={form.type}
                options={options}
                setOptions={updateOptions}
                error={errors.options}
                isEdit={isEdit}
              />
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-6 lg:sticky lg:top-20">
              <AttributePreview form={form} options={options} />
              <AttributeUsage
                form={form}
                setField={setField}
                isEdit={isEdit}
                productCount={productCount}
              />
              <AttributeOrganization form={form} setField={setField} errors={errors} />
            </div>
          </div>
        </div>

        <AttributeFormActions
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
