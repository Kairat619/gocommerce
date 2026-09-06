import FormCard from "../Form/FormCard";
import RadioCards from "../Form/RadioCards";
import { LIFECYCLE_LABELS, lifecycleOf } from "./couponFormState";

const TONES = {
  green: "bg-green-50 text-green-800 ring-green-200",
  blue: "bg-blue-50 text-blue-800 ring-blue-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  gray: "bg-gray-100 text-gray-700 ring-gray-200",
};

/**
 * Status is the manual switch; the schedule and the usage limit decide the rest.
 * Both are shown together because "enabled but not usable" is the state
 * merchants most often misread.
 */
export default function CouponStatus({ form, setField, usedCount }) {
  const lifecycle = lifecycleOf(form, { usedCount: usedCount ?? 0 });
  const { label, tone, hint } = LIFECYCLE_LABELS[lifecycle];

  return (
    <FormCard title="Status" description="Whether the coupon is switched on.">
      <div className="space-y-4">
        <RadioCards
          label="Coupon status"
          name="is_active"
          value={form.is_active}
          onChange={(value) => setField("is_active", value)}
          options={[
            { value: true, label: "Enabled", description: "Available to customers" },
            { value: false, label: "Disabled", description: "Rejected at checkout" },
          ]}
        />

        {/* The resolved state, so an enabled-but-scheduled coupon reads as
            such instead of looking broken. */}
        <div className={`rounded-md px-3 py-2.5 text-xs ring-1 ring-inset ${TONES[tone]}`} aria-live="polite">
          <p className="font-semibold">Right now: {label}</p>
          <p className="mt-0.5 opacity-90">{hint}</p>
        </div>
      </div>
    </FormCard>
  );
}
