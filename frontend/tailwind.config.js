/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#F8F9FA",
          container: "#EDEEEF",
        },
        ink: {
          DEFAULT: "#212529",
          container: "#0C1014",
        },
        accent: {
          DEFAULT: "#C5A059",
          soft: "#E7D8B6",
        },
        muted: {
          DEFAULT: "#F3F4F5",
          foreground: "#75777B",
        },
        outline: "#75777B",
      },
      fontFamily: {
        serif: ['"Noto Serif"', "Georgia", "serif"],
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["clamp(2.75rem, 5vw, 4rem)", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-lg": ["clamp(2rem, 4vw, 3rem)", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-md": ["clamp(1.75rem, 3vw, 2.25rem)", { lineHeight: "1.15", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-lg": ["1.75rem", { lineHeight: "1.3", fontWeight: "600" }],
        "headline-md": ["1.375rem", { lineHeight: "1.4", fontWeight: "600" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body-md": ["1rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }],
        "label-lg": ["0.875rem", { lineHeight: "1.2", letterSpacing: "0.05em", fontWeight: "600" }],
        "label-sm": ["0.75rem", { lineHeight: "1.2", letterSpacing: "0.02em", fontWeight: "500" }],
      },
      maxWidth: {
        "screen-2xl": "1536px",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};
