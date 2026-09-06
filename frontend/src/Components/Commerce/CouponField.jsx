import { router, usePage } from "@inertiajs/react";
import { useState } from "react";

import Button from "../UI/Button";
import Field from "../UI/Field";
import Input from "../UI/Input";
import { formatMoney } from "../../lib/money";

/**
 * Coupon entry for the cart.
 *
 * The applied coupon comes from the server on every render, already
 * re-validated against the current cart, so this component never decides
 * whether a code is good or what it is worth — it only shows the answer.
 *
 * @param {Object} props
 * @param {import('../../types/commerce').AppliedCoupon | null} [props.coupon]
 */
export default function CouponField({ coupon }) {
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
      },
    );
  }

  function remove() {
    router.post("/cart/coupon/remove", {}, { preserveScroll: true });
  }

  if (coupon) {
    return (
      <div className="border border-green-600/30 bg-green-50 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-label-sm font-semibold uppercase tracking-[0.1em] text-green-800">
              Coupon applied
            </p>
            <p className="mt-1 font-mono text-body-sm font-semibold tracking-[0.08em] text-ink">
              {coupon.code}
            </p>
            <p className="mt-0.5 text-label-sm text-green-800">
              {coupon.free_shipping
                ? "Free shipping on this order"
                : `${formatMoney(coupon.discount_amount)} off your subtotal`}
            </p>
          </div>

          <button
            type="button"
            onClick={remove}
            className="shrink-0 text-label-sm font-semibold uppercase tracking-[0.1em] text-outline transition-colors hover:text-red-600"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={apply} noValidate>
      <Field label="Discount code" htmlFor="coupon-code" error={errors.code}>
        <div className="flex gap-2">
          <Input
            id="coupon-code"
            name="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter code"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-invalid={errors.code ? "true" : undefined}
            className="font-mono uppercase tracking-[0.08em]"
          />
          <Button
            type="submit"
            variant="outline"
            size="md"
            disabled={processing || !code.trim()}
            className="shrink-0"
          >
            {processing ? "Applying…" : "Apply"}
          </Button>
        </div>
      </Field>
    </form>
  );
}
