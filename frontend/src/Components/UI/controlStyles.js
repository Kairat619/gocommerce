/**
 * Shared styling for form controls, so Input, Select and Textarea cannot drift
 * apart.
 *
 * Padding is a size prop rather than something a caller overrides through
 * `className`: Tailwind resolves conflicting utilities by its own stylesheet
 * order, not by the order they appear in a class string, so `className="px-3"`
 * on top of a base `px-4` silently loses.
 */
import { useComponentVariant } from "../../theme/ThemeProvider";

/**
 * Control and label treatments, chosen by the theme
 * (`components.FormControl.look`): `square` is the original outlined field,
 * `soft` the marketplace's rounded, tinted one.
 */
const looks = {
  square: {
    control:
      "w-full border border-ink/20 bg-white text-body-sm text-ink placeholder:text-outline focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:cursor-not-allowed disabled:opacity-60",
    label: "mb-2 block text-label-sm font-semibold uppercase tracking-[0.1em] text-ink",
  },
  soft: {
    control:
      "w-full rounded-lg border border-transparent bg-muted text-sm text-ink placeholder:text-outline focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60",
    label: "mb-1.5 block text-[13px] font-semibold text-ink",
  },
};

/** The active theme's control and label classes. */
export function useControlLook() {
  const { look } = useComponentVariant("FormControl", { look: "square" });
  return looks[look] || looks.square;
}

export const controlSizes = {
  sm: "px-3 py-2.5",
  md: "px-4 py-2.5",
};
