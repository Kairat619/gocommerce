import Field, { inputClass } from "../Form/Field";
import FormCard from "../Form/FormCard";

/**
 * The validity window. Both bounds are optional: blank start means "live as
 * soon as it is enabled", blank end means "never expires".
 *
 * Times are wall-clock in the store's timezone — the same zone the Go handler
 * parses them in — so what the merchant types is what the engine compares.
 */
export default function CouponValidity({ form, setField, errors }) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <FormCard
      title="Validity period"
      description="When the coupon may be used. Separate from the on/off switch."
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            label="Starts"
            htmlFor="starts_at"
            error={errors.starts_at}
            hint="Leave blank to start as soon as it is enabled."
          >
            <input
              id="starts_at"
              name="starts_at"
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => setField("starts_at", e.target.value)}
              aria-invalid={errors.starts_at ? "true" : undefined}
              className={inputClass(errors.starts_at)}
            />
          </Field>

          <Field
            label="Ends"
            htmlFor="ends_at"
            error={errors.ends_at}
            hint="Leave blank for no expiry."
          >
            <input
              id="ends_at"
              name="ends_at"
              type="datetime-local"
              value={form.ends_at}
              onChange={(e) => setField("ends_at", e.target.value)}
              aria-invalid={errors.ends_at ? "true" : undefined}
              min={form.starts_at || undefined}
              className={inputClass(errors.ends_at)}
            />
          </Field>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
          <span>Times are in {timezone}.</span>
          {(form.starts_at || form.ends_at) && (
            <button
              type="button"
              onClick={() => {
                setField("starts_at", "");
                setField("ends_at", "");
              }}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Clear dates
            </button>
          )}
        </div>
      </div>
    </FormCard>
  );
}
