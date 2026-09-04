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
 * @param {"four"|"three"|"threeToFour"} [props.columns]
 */
const columnVariants = {
  four: "lg:grid-cols-4",
  three: "xl:grid-cols-3",
  threeToFour: "lg:grid-cols-3 xl:grid-cols-4",
};

export default function ProductGrid({
  products,
  columns = "four",
  className = "",
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6",
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
