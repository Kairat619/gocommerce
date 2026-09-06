import FormCard from "../Form/FormCard";
import { formatMoney } from "../../../lib/money";
import { DISCOUNT_TYPES, normalizeCode } from "./couponFormState";

function amountOf(raw) {
  const value = Number(String(raw ?? "").trim());
  return Number.isFinite(value) && value > 0 ? value : null;
}

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/**
 * A plain-language restatement of the configured coupon, so the merchant can
 * check their intent without re-reading every field. Purely derived from form
 * state — it never computes anything the backend will not also compute.
 */
export default function CouponSummary({ form }) {
  const code = normalizeCode(form.code);

  const discountValue = amountOf(form.discount_value);
  const cap = amountOf(form.max_discount_amount);
  const minAmount = amountOf(form.min_order_amount);
  const minQuantity = amountOf(form.min_order_quantity);

  let discount = "No discount set";
  if (form.discount_type === DISCOUNT_TYPES.FREE_SHIPPING) {
    discount = "Free shipping";
  } else if (discountValue !== null) {
    discount =
      form.discount_type === DISCOUNT_TYPES.PERCENTAGE
        ? `${discountValue}% off${cap !== null ? `, up to ${formatMoney(cap)}` : ""}`
        : `${formatMoney(discountValue)} off`;
  }

  const starts = formatDate(form.starts_at);
  const ends = formatDate(form.ends_at);

  let validity = "No expiry";
  if (starts && ends) validity = `${starts} – ${ends}`;
  else if (starts) validity = `From ${starts}`;
  else if (ends) validity = `Until ${ends}`;

  const conditions = [];
  if (minAmount !== null) conditions.push(`Min. order ${formatMoney(minAmount)}`);
  if (minQuantity !== null) conditions.push(`Min. ${minQuantity} item${minQuantity === 1 ? "" : "s"}`);

  const total = String(form.max_uses ?? "").trim();
  const perCustomer = String(form.max_uses_per_customer ?? "").trim();

  const rows = [
    ["Discount", discount],
    ["Conditions", conditions.length ? conditions.join(" · ") : "None"],
    ["Total uses", total ? Number(total).toLocaleString() : "Unlimited"],
    ["Per customer", perCustomer ? Number(perCustomer).toLocaleString() : "Unlimited"],
    ["Valid", validity],
  ];

  return (
    <FormCard title="Summary" description="How this coupon will behave once saved.">
      <div className="space-y-3">
        <p className="break-all font-mono text-lg font-semibold tracking-[0.12em] text-gray-900">
          {code || <span className="font-sans text-sm font-normal italic text-gray-400">No code yet</span>}
        </p>

        <dl className="divide-y divide-gray-100 border-t border-gray-100 text-sm">
          {rows.map(([term, value]) => (
            <div key={term} className="flex items-baseline justify-between gap-3 py-2">
              <dt className="shrink-0 text-gray-500">{term}</dt>
              <dd className="text-right font-medium text-gray-900">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </FormCard>
  );
}
