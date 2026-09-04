import "./app.css";
import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import ThemeProvider from "./theme/ThemeProvider";

const pages = import.meta.glob("./Pages/**/*.jsx");

createInertiaApp({
  resolve: (name) => {
    const path = `./${name}.jsx`;
    const importFn = pages[path];
    if (!importFn) {
      throw new Error(`Page not found: ${name}`);
    }
    return importFn().then((mod) => mod.default);
  },
  setup({ el, App, props }) {
    createRoot(el).render(
      <ThemeProvider>
        <App {...props} />
      </ThemeProvider>
    );
  },
  // The accent token's default value. Inertia reads this before React mounts,
  // so it cannot come from a CSS custom property.
  progress: {
    color: "#C5A059",
  },
});
