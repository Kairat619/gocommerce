import { sectionRegistry } from "./registry";

/**
 * Renders a theme's page composition.
 *
 * `composition` is data — an ordered list of `{ section, props }` — so a theme
 * can reorder, drop or repeat a section without any page component changing.
 * Commerce data arrives separately in `data` and is handed to each section by
 * its registry `select`, keeping theme content and page props apart.
 *
 * An unknown section name is skipped with a console warning rather than
 * throwing: a typo in a theme should not blank the storefront.
 *
 * @param {Object} props
 * @param {{section: string, props?: Object}[]} props.composition
 * @param {Object} props.data  the page's Inertia props
 */
export default function SectionList({ composition = [], data = {} }) {
  return composition.map((entry, index) => {
    const definition = sectionRegistry[entry.section];

    if (!definition) {
      if (import.meta.env.DEV) {
        console.warn(
          `[theme] Unknown section "${entry.section}". Known sections: ${Object.keys(
            sectionRegistry
          ).join(", ")}`
        );
      }
      return null;
    }

    const Section = definition.component;
    const dataProps = definition.select ? definition.select(data) : {};

    return (
      <Section
        key={`${entry.section}-${index}`}
        {...dataProps}
        {...(entry.props || {})}
      />
    );
  });
}
