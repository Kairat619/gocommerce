import Container from "../../Components/UI/Container";
import ProductCard from "../../Components/Commerce/ProductCard";
import { isOnSale } from "../../lib/product";
import ShelfHeading from "./ShelfHeading";

/**
 * A five-up product shelf.
 *
 * `source` splits the products by a fact the server already sent — whether a
 * product is genuinely marked down — so a "deals" shelf never invents a
 * discount, and a "sale" shelf plus a "regular" shelf show every product once.
 * A shelf with nothing to show renders nothing.
 *
 * @param {Object} props
 * @param {import('../../types/commerce').ProductListItem[]} props.products
 * @param {"all"|"sale"|"regular"} [props.source]
 * @param {number} [props.limit]
 * @param {string} [props.icon]  an Icon name
 */
const sources = {
  all: () => true,
  sale: (product) => isOnSale(product),
  regular: (product) => !isOnSale(product),
};

export default function ProductShelf({
  products = [],
  source = "all",
  limit = 10,
  icon,
  title,
  actionLabel,
  actionHref,
}) {
  const keep = sources[source] || sources.all;
  const items = products.filter(keep).slice(0, limit);
  if (items.length === 0) return null;

  return (
    <Container as="section" className="py-6 md:py-8">
      <ShelfHeading
        icon={icon}
        title={title}
        actionLabel={actionLabel}
        actionHref={actionHref}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {items.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
    </Container>
  );
}
