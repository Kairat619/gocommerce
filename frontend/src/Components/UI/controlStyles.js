/**
 * Shared styling for form controls, so Input, Select and Textarea cannot drift
 * apart.
 *
 * Padding is a size prop rather than something a caller overrides through
 * `className`: Tailwind resolves conflicting utilities by its own stylesheet
 * order, not by the order they appear in a class string, so `className="px-3"`
 * on top of a base `px-4` silently loses.
 */
export const controlBase =
  "w-full border border-ink/20 bg-white text-body-sm text-ink placeholder:text-outline focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:cursor-not-allowed disabled:opacity-60";

export const controlSizes = {
  sm: "px-3 py-2.5",
  md: "px-4 py-2.5",
};
