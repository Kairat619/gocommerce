/**
 * Page-prop type definitions for the storefront.
 *
 * These modules contain only JSDoc `@typedef` blocks — no runtime code — so
 * importing them costs nothing in the bundle. They exist because this project
 * has no TypeScript and no frontend test runner: they are what makes a
 * mistyped or renamed prop visible in an editor instead of at runtime.
 *
 * Usage in a page component:
 *
 *   /** @param {import('../../types/pages').ProductsShowProps} props *\/
 *   export default function ProductsShow({ product, images }) { ... }
 *
 * Usage for a single shape:
 *
 *   /** @param {{product: import('../types/commerce').ProductListItem}} props *\/
 *
 * The shapes here mirror the Go serializers in `internal/handler/`. They are
 * the machine-readable half of API_CONTRACT.md — when one changes, change both,
 * and remember that changing a prop name at all is a backend change requiring
 * authorization (see AI_RULES.md).
 *
 * @module types
 */

export * from "./commerce";
export * from "./shared";
export * from "./pages";
