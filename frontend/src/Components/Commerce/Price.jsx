import cn from "../../lib/cn";
import { formatMoney } from "../../lib/money";

/**
 * A selling price, optionally alongside a struck-through compare-at price.
 *
 * Pass `compareAt` only when it should be shown — the caller decides, because
 * a selected variant overrides the product's own markdown. Use
 * `comparePrice(product)` from lib/product to get a value that is already
 * filtered down to genuine markdowns.
 */
const sizes = {
  md: { row: "gap-2", current: "text-headline-md", compare: "text-body-sm" },
  lg: { row: "gap-3", current: "text-headline-lg", compare: "text-body-lg" },
};

export default function Price({
  amount,
  compareAt = null,
  currency = "USD",
  size = "md",
  className = "",
}) {
  const scale = sizes[size] || sizes.md;
  const compareLabel = compareAt === null ? "" : formatMoney(compareAt, currency);

  return (
    <div className={cn("flex items-baseline", scale.row, className)}>
      <span className={cn(scale.current, "font-semibold text-ink")}>
        {formatMoney(amount, currency)}
      </span>
      {compareLabel && (
        <span className={cn(scale.compare, "text-outline line-through")}>
          {compareLabel}
        </span>
      )}
    </div>
  );
}
