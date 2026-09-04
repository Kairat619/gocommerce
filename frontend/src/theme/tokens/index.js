/**
 * Design tokens — the single source of truth for the storefront's visual
 * language. `tailwind.config.js` imports this file, so nothing here may be
 * computed at runtime.
 *
 * Colors are stored as space-separated RGB channels ("33 37 41") rather than
 * hex, because Tailwind needs `rgb(var(--x) / <alpha-value>)` for opacity
 * modifiers such as `border-ink/10` and `bg-ink/90` to keep working.
 *
 * The channel values are mirrored as CSS custom properties in `tokens.css`.
 * Change a value in BOTH files, or the browser and Tailwind will disagree.
 *
 * A future theme swaps the custom properties in `tokens.css`; the Tailwind
 * class names never change.
 */

/** name -> "R G B" channels. Keys become the CSS variable `--color-<key>`. */
export const colorChannels = {
  surface: "248 249 250",
  "surface-container": "237 238 239",
  ink: "33 37 41",
  "ink-container": "12 16 20",
  accent: "197 160 89",
  "accent-soft": "231 216 182",
  muted: "243 244 245",
  "muted-foreground": "117 119 123",
  outline: "117 119 123",
};

/** Reference a token from Tailwind while preserving the `/opacity` modifier. */
export const token = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

/**
 * Tailwind's `theme.extend.colors`. The nesting produces the class names the
 * codebase already uses: bg-surface, bg-surface-container, bg-ink,
 * bg-ink-container, bg-accent, bg-accent-soft, bg-muted, text-muted-foreground,
 * text-outline.
 */
export const colors = {
  surface: {
    DEFAULT: token("surface"),
    container: token("surface-container"),
  },
  ink: {
    DEFAULT: token("ink"),
    container: token("ink-container"),
  },
  accent: {
    DEFAULT: token("accent"),
    soft: token("accent-soft"),
  },
  muted: {
    DEFAULT: token("muted"),
    foreground: token("muted-foreground"),
  },
  outline: token("outline"),
};

export const fontFamily = {
  serif: ['"Noto Serif"', "Georgia", "serif"],
  sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
};

export const fontSize = {
  "display-xl": [
    "clamp(2.75rem, 5vw, 4rem)",
    { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "700" },
  ],
  "display-lg": [
    "clamp(2rem, 4vw, 3rem)",
    { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" },
  ],
  "display-md": [
    "clamp(1.75rem, 3vw, 2.25rem)",
    { lineHeight: "1.15", letterSpacing: "-0.01em", fontWeight: "600" },
  ],
  "headline-lg": ["1.75rem", { lineHeight: "1.3", fontWeight: "600" }],
  "headline-md": ["1.375rem", { lineHeight: "1.4", fontWeight: "600" }],
  "body-lg": ["1.125rem", { lineHeight: "1.6", fontWeight: "400" }],
  "body-md": ["1rem", { lineHeight: "1.6", fontWeight: "400" }],
  "body-sm": ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }],
  "label-lg": [
    "0.875rem",
    { lineHeight: "1.2", letterSpacing: "0.05em", fontWeight: "600" },
  ],
  "label-sm": [
    "0.75rem",
    { lineHeight: "1.2", letterSpacing: "0.02em", fontWeight: "500" },
  ],
};

export const maxWidth = {
  "screen-2xl": "1536px",
};

export const keyframes = {
  "fade-up": {
    from: { opacity: "0", transform: "translateY(16px)" },
    to: { opacity: "1", transform: "translateY(0)" },
  },
  "fade-in": {
    from: { opacity: "0" },
    to: { opacity: "1" },
  },
};

export const animation = {
  "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
  "fade-in": "fade-in 0.4s ease-out both",
};

export default {
  colors,
  fontFamily,
  fontSize,
  maxWidth,
  keyframes,
  animation,
};
