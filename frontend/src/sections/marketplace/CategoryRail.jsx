import { useRef } from "react";
import { Link } from "@inertiajs/react";
import Container from "../../Components/UI/Container";
import { categoryImage } from "../../lib/image";
import Icon from "../../Components/UI/Icon";
import ShelfHeading from "./ShelfHeading";

/**
 * Categories as a horizontally scrolling rail of round badges.
 *
 * Touch users swipe the rail; pointer users get arrow buttons that page it.
 *
 * @param {Object} props
 * @param {import('../../types/commerce').Category[]} props.categories
 * @param {number} [props.limit]
 */
export default function CategoryRail({
  categories = [],
  limit = 12,
  title,
  actionLabel,
  actionHref,
}) {
  const railRef = useRef(null);
  const items = categories.slice(0, limit);
  if (items.length === 0) return null;

  function page(direction) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <Container as="section" className="py-6 md:py-8">
      <ShelfHeading title={title} actionLabel={actionLabel} actionHref={actionHref} />
      <div className="relative">
        <ul
          ref={railRef}
          className="flex snap-x gap-3 overflow-x-auto px-1 py-2 [scrollbar-width:none] md:gap-4 [&::-webkit-scrollbar]:hidden"
        >
          {items.map((cat) => (
            <li key={cat.slug} className="shrink-0 snap-start">
              <Link
                href={`/categories/${cat.slug}`}
                className="group flex w-24 flex-col items-center gap-2 rounded-xl text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:w-28"
              >
                <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-surface-container p-1 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-accent-soft md:h-24 md:w-24">
                  <img
                    src={categoryImage(cat, 200, 200)}
                    alt=""
                    loading="lazy"
                    className="h-full w-full rounded-full object-cover"
                  />
                </span>
                <span className="line-clamp-2 text-[13px] font-bold leading-4 text-ink transition-colors group-hover:text-accent">
                  {cat.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => page(-1)}
          aria-label="Previous categories"
          className="absolute left-0 top-10 hidden h-9 w-9 -translate-x-3 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-md transition-all hover:scale-110 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:flex md:top-12"
        >
          <Icon name="chevronLeft" className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => page(1)}
          aria-label="Next categories"
          className="absolute right-0 top-10 hidden h-9 w-9 -translate-y-1/2 translate-x-3 items-center justify-center rounded-full bg-white text-ink shadow-md transition-all hover:scale-110 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:flex md:top-12"
        >
          <Icon name="chevronRight" className="h-4 w-4" />
        </button>
      </div>
    </Container>
  );
}
