import Container from "../../Components/UI/Container";
import Icon from "../../Components/UI/Icon";

/**
 * Four reassurance cards — delivery, payment, returns, support. Theme copy.
 *
 * @param {Object} props
 * @param {{icon: string, title: string, body: string}[]} props.items
 */
export default function ServiceHighlights({ items = [] }) {
  if (items.length === 0) return null;

  return (
    <Container as="section" className="py-6 md:py-8">
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <li
            key={item.title}
            className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Icon name={item.icon} className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-base font-bold leading-6 text-ink">
                {item.title}
              </h3>
              <p className="text-[13px] leading-[18px] text-muted-foreground">
                {item.body}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Container>
  );
}
