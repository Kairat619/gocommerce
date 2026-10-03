import { Link } from "@inertiajs/react";
import cn from "../lib/cn";

/**
 * Breadcrumb trail. Always prepends a "Home" crumb; pass the rest as `items`,
 * with the final entry omitting `href` to mark the current page.
 *
 * `tone="inverse"` is for trails sitting on a dark hero image. `look` picks
 * the typographic treatment: uppercase with slashes, or the marketplace's
 * sentence case with chevrons.
 */
const tones = {
  default: { nav: "text-outline", separator: "text-outline", current: "text-ink" },
  inverse: {
    nav: "text-white/70",
    separator: "text-white/40",
    current: "text-white",
  },
};

const looks = {
  classic: { nav: "text-label-sm uppercase tracking-[0.1em]", separator: "/" },
  marketplace: { nav: "text-[13px]", separator: "›" },
};

export default function Breadcrumbs({
  items = [],
  tone = "default",
  look = "classic",
  className = "mb-6",
}) {
  if (items.length === 0) return null;

  const scale = tones[tone] || tones.default;
  const style = looks[look] || looks.classic;

  return (
    <nav
      className={cn(
        style.nav,
        scale.nav,
        className
      )}
      aria-label="Breadcrumb"
    >
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href="/" className="transition-colors hover:text-accent">
            Home
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <span aria-hidden="true" className={scale.separator}>
              {style.separator}
            </span>
            {item.href ? (
              <Link
                href={item.href}
                className="transition-colors hover:text-accent"
              >
                {item.label}
              </Link>
            ) : (
              <span className={scale.current}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
