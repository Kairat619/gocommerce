import cn from "../../lib/cn";
import { orderStatusTone } from "../../lib/order";

/**
 * The order status pill.
 *
 * Replaces six hand-rolled copies of the same span plus its colour map. The
 * three sizes are the three that were actually in use, so adopting this
 * component changed nothing visually.
 *
 * @param {Object} props
 * @param {import('../../types/commerce').OrderStatus} props.status
 * @param {"sm"|"md"|"lg"} [props.size]
 */
const sizes = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-0.5 text-xs",
  lg: "px-3 py-1 text-sm",
};

export default function OrderStatus({ status, size = "sm", className = "" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium capitalize",
        sizes[size] || sizes.sm,
        orderStatusTone(status),
        className
      )}
    >
      {status}
    </span>
  );
}
