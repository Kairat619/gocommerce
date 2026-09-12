import "./app.css";
import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import ThemeProvider from "./theme/ThemeProvider";
import { setStoreIdentity } from "./lib/brand";
import { setStoreCurrency } from "./lib/money";

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
    // Apply the store's configured identity BEFORE the first render.
    //
    // The brand name and the display currency used to be constants in this
    // bundle (lib/brand.js and lib/money.js), each a second copy of something
    // the server already knew. They are settings now, and they arrive on the
    // `store` shared prop.
    //
    // Applying them here rather than through a hook means the ~30 existing
    // `formatMoney(amount)` calls and the nine `BRAND_NAME` readers did not
    // have to change, and the theme — a plain object with no component to hook
    // into — follows the setting too.
    //
    // Settings are per page-load: an Inertia visit brings fresh shared props,
    // but a tab that is already open keeps the identity it booted with until it
    // is reloaded. That is what the settings page tells the administrator.
    applyStoreIdentity(props?.initialPage?.props?.store);

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

/** Hand the `store` shared prop to the two modules that hold display defaults. */
function applyStoreIdentity(store) {
  if (!store) return;
  setStoreIdentity(store);
  setStoreCurrency(store.currency);
}
