import { formatMoney } from "../../lib/money";

/**
 * Variant chooser. Shows a variant's price alongside its name only when it
 * differs from the product's base price.
 *
 * Selection is controlled by the page, because the chosen variant drives the
 * displayed price and, in future, what gets added to the cart.
 *
 * @param {Object} props
 * @param {import('../../types/commerce').ProductVariant[]} props.variants
 * @param {import('../../types/commerce').ProductVariant|null} props.selected
 * @param {(variant: import('../../types/commerce').ProductVariant) => void} props.onSelect
 * @param {string} props.basePrice the product's own price, for comparison
 */
export default function VariantSelector({
  variants,
  selected,
  onSelect,
  basePrice,
}) {
  if (variants.length === 0) return null;

  return (
    <div className="mt-8">
      <p
        id="variant-label"
        className="mb-3 block text-label-lg font-semibold uppercase tracking-[0.1em] text-ink"
      >
        Variant
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-labelledby="variant-label">
        {variants.map((variant) => (
          <button
            key={variant.id}
            type="button"
            onClick={() => onSelect(variant)}
            aria-pressed={selected?.id === variant.id}
            className={`border px-4 py-2.5 text-body-sm font-medium transition-colors ${
              selected?.id === variant.id
                ? "border-ink bg-ink text-white"
                : "border-ink/20 text-ink hover:border-ink"
            }`}
          >
            {variant.name}
            {variant.price !== basePrice && (
              <span className="ml-1 opacity-70">
                ({formatMoney(variant.price)})
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
