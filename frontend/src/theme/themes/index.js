import defaultTheme from "./default";
import luxuryTheme from "./luxury";

/**
 * The installed themes.
 *
 * To add one: copy ./default, change the values, register it here.
 * To switch the storefront: change ACTIVE_THEME below.
 *
 * Theme selection is deliberately a frontend constant. Making it
 * store-configurable would mean adding a column to `store_settings` and a new
 * page prop — a backend change, which needs authorization (see AI_RULES.md).
 */
export const themes = {
  default: defaultTheme,
  luxury: luxuryTheme,
};

/** The theme the storefront currently renders. */
export const ACTIVE_THEME = "default";

/** Look up a theme by name, falling back to the default rather than crashing. */
export function resolveTheme(name = ACTIVE_THEME) {
  return themes[name] || themes.default;
}

export default resolveTheme;
