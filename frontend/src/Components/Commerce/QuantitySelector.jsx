import cn from "../../lib/cn";

/**
 * Quantity stepper. Clamps to [min, max] so callers cannot push an
 * out-of-stock quantity into the cart.
 *
 * `editable` swaps the read-out for a number input, which the cart needs so a
 * shopper can type a quantity instead of clicking eight times. The product
 * page uses the plain read-out.
 *
 * @param {Object} props
 * @param {number} props.value
 * @param {(next: number) => void} props.onChange
 * @param {number} [props.min]
 * @param {number} [props.max]
 * @param {"sm"|"md"} [props.size]
 * @param {boolean} [props.editable]
 */
const sizes = {
  sm: { box: "h-10", control: "w-9 text-base", readout: "w-10 text-body-sm" },
  md: { box: "h-14", control: "w-12 text-lg", readout: "w-12 text-body-md" },
};

export default function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
  size = "md",
  editable = false,
  className = "",
}) {
  const scale = sizes[size] || sizes.md;
  const clamp = (n) => Math.min(max, Math.max(min, n));
  const step = (delta) => onChange(clamp(value + delta));

  const control = cn(
    "flex h-full items-center justify-center text-ink transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-40",
    scale.control
  );

  return (
    <div
      className={cn("flex items-center border border-ink/20", scale.box, className)}
    >
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className={control}
      >
        &minus;
      </button>

      {editable ? (
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const next = parseInt(e.target.value, 10);
            if (!Number.isNaN(next)) onChange(clamp(next));
          }}
          aria-label="Quantity"
          className={cn(
            "no-spinner h-full border-x border-ink/20 bg-transparent text-center font-medium text-ink focus:outline-none focus:ring-1 focus:ring-ink",
            scale.readout
          )}
        />
      ) : (
        <span
          aria-live="polite"
          className={cn("text-center font-medium", scale.readout)}
        >
          {value}
        </span>
      )}

      <button
        type="button"
        onClick={() => step(1)}
        disabled={value >= max}
        aria-label="Increase quantity"
        className={control}
      >
        +
      </button>
    </div>
  );
}
