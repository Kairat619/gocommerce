import Container from "../../Components/UI/Container";
import SectionHeading from "../../Components/UI/SectionHeading";
import ProductGrid from "../../Components/Commerce/ProductGrid";
import cn from "../../lib/cn";

/**
 * A band of products, fed straight from page props.
 *
 * The `products` prop is commerce data supplied by the section renderer; the
 * copy around it belongs to the theme.
 *
 * @param {Object} props
 * @param {import('../../types/commerce').ProductListItem[]} props.products
 * @param {"light"|"surface"} [props.variant]
 * @param {number} [props.limit]
 */
const variants = {
  light: "border-y border-ink/10 bg-white",
  surface: "bg-surface",
};

export default function FeaturedProducts({
  products = [],
  variant = "light",
  limit = 8,
  eyebrow,
  title,
  description,
  actionLabel,
  actionHref,
  columns = "four",
}) {
  const items = products.slice(0, limit);
  if (items.length === 0) return null;

  return (
    <section className={cn(variants[variant] || variants.light)}>
      <Container className="py-16 md:py-24">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
          actionLabel={actionLabel}
          actionHref={actionHref}
        />
        <ProductGrid products={items} columns={columns} />
      </Container>
    </section>
  );
}
