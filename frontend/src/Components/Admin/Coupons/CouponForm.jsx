import { router, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";

import CouponBasicInfo from "./CouponBasicInfo";
import CouponConditions from "./CouponConditions";
import CouponDiscount from "./CouponDiscount";
import CouponFormActions from "./CouponFormActions";
import CouponFormHeader from "./CouponFormHeader";
import CouponStatus from "./CouponStatus";
import CouponSummary from "./CouponSummary";
import CouponUsageLimits from "./CouponUsageLimits";
import CouponValidity from "./CouponValidity";
import { buildInitialForm, toPayload, validateForm } from "./couponFormState";

// Shared by Pages/Admin/Coupons/Create and .../Edit so the two workflows cannot
// drift apart — the only difference is the initial state and the submit URL.
// Modelled on Components/Admin/Categories/CategoryForm.
export default function CouponForm({ action, isEdit = false, coupon }) {
  const { errors: serverErrors = {} } = usePage().props;

  const [form, setForm] = useState(() => buildInitialForm(coupon));
  const [dismissed, setDismissed] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => setDismissed({}), [serverErrors]);

  const formRef = useRef(null);

  function setField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: typeof value === "function" ? value(current[field]) : value,
    }));
    setDismissed((current) => ({ ...current, [field]: true }));
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
      <CouponFormHeader isEdit={isEdit} coupon={coupon} />

      {errorCount > 0 && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3" role="alert">
          <p className="text-sm font-medium text-red-800">
            {errorCount} field{errorCount === 1 ? "" : "s"} need{errorCount === 1 ? "s" : ""} attention before
            this coupon can be saved.
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
            <CouponBasicInfo form={form} setField={setField} errors={errors} isEdit={isEdit} />
            <CouponDiscount form={form} setField={setField} errors={errors} />
            <CouponConditions form={form} setField={setField} errors={errors} />
            <CouponUsageLimits
              form={form}
              setField={setField}
              errors={errors}
              usedCount={isEdit ? (coupon?.used_count ?? 0) : null}
            />
            <CouponValidity form={form} setField={setField} errors={errors} />
          </div>

          <div className="space-y-6">
            <div className="space-y-6 lg:sticky lg:top-20">
              <CouponStatus form={form} setField={setField} usedCount={coupon?.used_count ?? 0} />
              <CouponSummary form={form} />
            </div>
          </div>
        </div>

        <CouponFormActions
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
