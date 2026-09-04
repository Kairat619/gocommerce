/**
 * Quantity stepper. Clamps to [min, max] so callers cannot push an
 * out-of-stock quantity into the cart.
 *
 * @param {Object} props
 * @param {number} props.value
 * @param {(next: number) => void} props.onChange
 * @param {number} [props.min]
 * @param {number} [props.max]
 */
export default function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
}) {
  const step = (delta) => onChange(Math.min(max, Math.max(min, value + delta)));

  return (
    <div className="flex h-14 items-center border border-ink/20">
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className="flex h-full w-12 items-center justify-center text-lg text-ink transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        &minus;
      </button>
      <span
        aria-live="polite"
        className="w-12 text-center text-body-md font-medium"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => step(1)}
        disabled={value >= max}
        aria-label="Increase quantity"
        className="flex h-full w-12 items-center justify-center text-lg text-ink transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
