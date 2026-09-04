import cn from "../../lib/cn";

/**
 * A text/number input in the storefront's visual language.
 *
 * Padding is a `size` prop rather than something you override through
 * `className`, because Tailwind resolves conflicting utilities by its own
 * stylesheet order, not by the order they appear in the class string — so
 * `className="px-3"` on top of a base `px-4` silently loses.
 */
const sizes = {
  sm: "px-3 py-2.5",
  md: "px-4 py-2.5",
};

export default function Input({ size = "md", className = "", ...props }) {
  return (
    <input
      className={cn(
        "w-full border border-ink/20 bg-white text-body-sm text-ink placeholder:text-outline focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink",
        sizes[size] || sizes.md,
        className
      )}
      {...props}
    />
  );
}
