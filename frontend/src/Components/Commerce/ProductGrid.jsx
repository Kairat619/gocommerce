import cn from "../../lib/cn";
import ProductCard from "./ProductCard";

/**
 * The product grid. Four pages rendered this markup by hand, differing only in
 * how many columns they reach at the widest breakpoints.
 *
 * Column classes are a static map, never interpolated — Tailwind scans for
 * literal class strings, so a computed `lg:grid-cols-${n}` would compile away
 * to nothing in the production build only.
 *
 * @param {Object} props
 * @param {import('../../types/commerce').ProductListItem[]} props.products
 * @param {"four"|"three"|"threeToFour"|"marketplace"} [props.columns]
 * @param {"airy"|"compact"} [props.spacing]  `compact` suits the boxed tile card
 */
const columnVariants = {
  four: "lg:grid-cols-4",
  three: "xl:grid-cols-3",
  threeToFour: "lg:grid-cols-3 xl:grid-cols-4",
  marketplace: "md:grid-cols-3 xl:grid-cols-4",
};

const spacings = {
  airy: "gap-x-4 gap-y-10 md:gap-x-6",
  compact: "gap-3",
};

export default function ProductGrid({
  products,
  columns = "four",
  spacing = "airy",
  className = "",
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2",
        spacings[spacing] || spacings.airy,
        columnVariants[columns] || columnVariants.four,
        className
      )}
    >
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  );
}
