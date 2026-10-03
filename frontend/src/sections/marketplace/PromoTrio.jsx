import Container from "../../Components/UI/Container";
import PromoTile from "./PromoTile";

/**
 * A row of promotional tiles between product shelves. Theme copy only.
 *
 * @param {Object} props
 * @param {Object[]} props.items  PromoTile props
 */
export default function PromoTrio({ items = [] }) {
  if (items.length === 0) return null;

  return (
    <Container as="section" className="py-4 md:py-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {items.map((item) => (
          <PromoTile key={item.title} {...item} size="standard" />
        ))}
      </div>
    </Container>
  );
}
