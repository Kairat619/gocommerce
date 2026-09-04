import { createContext, useContext, useEffect, useMemo } from "react";
import { resolveTheme, ACTIVE_THEME } from "./themes";

/**
 * Makes the active theme available to the tree, and applies its colours.
 *
 * Colours are written to `document.documentElement` as the same custom
 * properties `theme/tokens/tokens.css` declares. That file stays the
 * build-time default so the first paint is never unstyled; this hook simply
 * overwrites the values when a theme other than the default is active.
 *
 * Writing to the root element (rather than a wrapper div) matters: `body`
 * takes its background from `var(--color-surface)`, and a wrapper would leave
 * the page behind the content unthemed.
 */
const ThemeContext = createContext(resolveTheme());

export default function ThemeProvider({ name = ACTIVE_THEME, children }) {
  const theme = useMemo(() => resolveTheme(name), [name]);

  useEffect(() => {
    const root = document.documentElement;

    Object.entries(theme.colors || {}).forEach(([token, channels]) => {
      root.style.setProperty(`--color-${token}`, channels);
    });

    return () => {
      Object.keys(theme.colors || {}).forEach((token) => {
        root.style.removeProperty(`--color-${token}`);
      });
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

/** The active theme. Safe outside a provider — returns the default. */
export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * A component's variant configuration from the active theme.
 *
 * Returns variant NAMES, never class strings — the component maps a name to
 * its own literal classes so Tailwind can see them.
 *
 * @param {string} component  e.g. "ProductCard"
 * @param {Object} [fallback] used when the theme says nothing about it
 */
export function useComponentVariant(component, fallback = {}) {
  const theme = useTheme();
  return { ...fallback, ...(theme.components?.[component] || {}) };
}
