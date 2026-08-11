import { Link } from "@inertiajs/react";

export default function Breadcrumbs({ items = [] }) {
  if (items.length === 0) return null;

  return (
    <nav
      className="mb-6 text-label-sm uppercase tracking-[0.1em] text-outline"
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center gap-2">
        <li>
          <Link href="/" className="transition-colors hover:text-accent">
            Home
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="text-outline">/</span>
            {item.href ? (
              <Link
                href={item.href}
                className="transition-colors hover:text-accent"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-ink">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
