import Container from "../../Components/UI/Container";

/**
 * The reassurance strip under the hero: shipping, returns, secure checkout.
 *
 * Pure marketing copy — it takes no commerce data, so a theme owns its
 * contents entirely.
 *
 * @param {Object} props
 * @param {{title: string, body: string}[]} props.items
 */
export default function ValueProps({ items = [] }) {
  if (items.length === 0) return null;

  return (
    <section className="border-b border-ink/10 bg-surface">
      <Container className="grid grid-cols-1 divide-y divide-ink/10 md:grid-cols-3 md:divide-x md:divide-y-0">
        {items.map((item) => (
          <div key={item.title} className="px-2 py-8 md:px-8">
            <h3 className="text-headline-md font-semibold text-ink">
              {item.title}
            </h3>
            <p className="mt-1.5 text-body-sm text-muted-foreground">
              {item.body}
            </p>
          </div>
        ))}
      </Container>
    </section>
  );
}
