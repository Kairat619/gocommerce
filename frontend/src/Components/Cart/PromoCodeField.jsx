import { router, usePage } from "@inertiajs/react";
import { useState } from "react";
import Icon from "../UI/Icon";
import { formatMoney } from "../../lib/money";

/**
 * Marketplace promo-code entry. Same contract as CouponField: the server
 * re-validates the applied coupon on every render and reports a bad code as
 * the field error `code`, so this only submits and shows the answer.
 *
 * @param {Object} props
 * @param {import('../../types/commerce').AppliedCoupon | null} [props.coupon]
 */
export default function PromoCodeField({ coupon }) {
  const { errors = {} } = usePage().props;
  const [code, setCode] = useState("");
  const [processing, setProcessing] = useState(false);

  function apply(e) {
    e.preventDefault();
    if (processing || !code.trim()) return;

    router.post(
      "/cart/coupon",
      { code: code.trim() },
      {
        preserveScroll: true,
        onStart: () => setProcessing(true),
        onFinish: () => setProcessing(false),
        onSuccess: () => setCode(""),
      }
    );
  }

  function remove() {
    router.post("/cart/coupon/remove", {}, { preserveScroll: true });
  }

  return (
    <div>
      {!coupon && (
        <form onSubmit={apply} noValidate>
          <label htmlFor="promo-code" className="mb-2 block text-[13px] font-semibold text-ink">
            Have a promo code?
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Icon
                name="tag"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
              />
              <input
                id="promo-code"
                name="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter code"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                aria-invalid={errors.code ? "true" : undefined}
                aria-describedby={errors.code ? "promo-code-error" : undefined}
                className="w-full rounded-lg border-0 bg-muted py-2 pl-9 pr-3 font-mono text-sm uppercase tracking-wider text-ink placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-outline focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <button
              type="submit"
              disabled={processing || !code.trim()}
              className="shrink-0 rounded-lg bg-surface-container px-4 text-[13px] font-bold text-accent transition-colors hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
            >
              {processing ? "Applying…" : "Apply"}
            </button>
          </div>
          {errors.code && (
            <p id="promo-code-error" className="mt-1.5 text-[13px] text-red-600">
              {errors.code}
            </p>
          )}
        </form>
      )}

      {coupon && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-green-50 px-3 py-2.5 text-[13px] text-green-800">
          <p className="flex min-w-0 items-center gap-2">
            <Icon name="shield" className="h-4 w-4 shrink-0" />
            <span className="min-w-0">
              Code <span className="font-mono font-bold">{coupon.code}</span> applied
              {" — "}
              {coupon.free_shipping
                ? "free shipping"
                : `${formatMoney(coupon.discount_amount)} off`}
            </span>
          </p>
          <button
            type="button"
            onClick={remove}
            aria-label={`Remove code ${coupon.code}`}
            className="shrink-0 rounded p-0.5 text-green-800 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
