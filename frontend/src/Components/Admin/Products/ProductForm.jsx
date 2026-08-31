import { router, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";

import ProductAttributes from "./ProductAttributes";
import ProductBasicInfo from "./ProductBasicInfo";
import ProductCategories from "./ProductCategories";
import ProductFormActions from "./ProductFormActions";
import ProductFormHeader from "./ProductFormHeader";
import ProductInventory from "./ProductInventory";
import ProductMedia from "./ProductMedia";
import ProductOrganization from "./ProductOrganization";
import ProductPricing from "./ProductPricing";
import ProductSEO from "./ProductSEO";
import ProductShipping from "./ProductShipping";
import ProductStatus from "./ProductStatus";
import ProductVariants from "./ProductVariants";
import { buildInitialForm, slugify, toPayload, validateForm } from "./productFormState";

// Shared by Pages/Admin/Products/Create and .../Edit so the two workflows cannot
// drift apart — the only difference is the initial state and the submit URL.
export default function ProductForm({
  action,
  isEdit = false,
  product,
  productImages,
  productVariants,
  productAttributes,
  categories = [],
  attributes: attributeCatalog = [],
  brands = [],
  currency = "USD",
  taxRate = 0,
}) {
  const { errors: serverErrors = {} } = usePage().props;

  const [form, setForm] = useState(() =>
    buildInitialForm({
      product,
      images: productImages,
      variants: productVariants,
      attributes: productAttributes,
    }),
  );
  const [catalog, setCatalog] = useState(attributeCatalog);
  const [dismissed, setDismissed] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => setDismissed({}), [serverErrors]);

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

  function upsertAttribute(attribute) {
    setCatalog((current) => {
      const index = current.findIndex((item) => item.id === attribute.id);
      if (index === -1) return [...current, attribute];
      return current.map((item, i) => (i === index ? attribute : item));
    });
  }

  const liveErrors = useMemo(() => (submitted ? validateForm(form) : {}), [submitted, form]);

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

    const found = validateForm(form);
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
      <ProductFormHeader isEdit={isEdit} product={product} />

      {errorCount > 0 && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3" role="alert">
          <p className="text-sm font-medium text-red-800">
            {errorCount} field{errorCount === 1 ? "" : "s"} need{errorCount === 1 ? "s" : ""} attention before this
            product can be saved.
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
            <ProductBasicInfo form={form} setField={setField} errors={errors} />
            <ProductPricing form={form} setField={setField} errors={errors} currency={currency} taxRate={taxRate} />
            <ProductMedia form={form} setField={setField} errors={errors} />
            <ProductInventory form={form} setField={setField} errors={errors} />
            <ProductShipping form={form} setField={setField} errors={errors} />
            <ProductAttributes
              form={form}
              setField={setField}
              errors={errors}
              attributes={catalog}
              onAttributeCreated={upsertAttribute}
            />
            <ProductVariants
              form={form}
              setField={setField}
              errors={errors}
              attributes={catalog}
              currency={currency}
            />
            <ProductSEO
              form={form}
              setField={setField}
              errors={errors}
              isEdit={isEdit}
              originalSlug={product?.slug}
            />
          </div>

          <div className="space-y-6">
            <div className="space-y-6 lg:sticky lg:top-20">
              <ProductStatus form={form} setField={setField} isEdit={isEdit} />
              <ProductCategories form={form} setField={setField} errors={errors} categories={categories} />
              <ProductOrganization form={form} setField={setField} errors={errors} brands={brands} />
            </div>
          </div>
        </div>

        <ProductFormActions
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
