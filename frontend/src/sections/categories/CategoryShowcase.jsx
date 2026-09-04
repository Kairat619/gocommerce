import { Link } from "@inertiajs/react";
import Container from "../../Components/UI/Container";
import SectionHeading from "../../Components/UI/SectionHeading";
import cn from "../../lib/cn";
import { decorativeImage } from "../../lib/image";

/**
 * Category tiles.
 *
 * The imagery is still a seeded placeholder: `categories.image_url` exists in
 * the database and is populated by the admin category form, but is not part of
 * the category page props. Exposing it is a backend change — see
 * API_CONTRACT.md, "Data available in the database but absent from props".
 *
 * @param {Object} props
 * @param {import('../../types/commerce').Category[]} props.categories
 * @param {"portrait"|"landscape"} [props.variant]
 * @param {number} [props.limit]
 */
const variants = {
  portrait: { tile: "aspect-[3/4]", grid: "grid-cols-2 lg:grid-cols-4" },
  landscape: { tile: "aspect-[4/3]", grid: "grid-cols-1 sm:grid-cols-2" },
};

export default function CategoryShowcase({
  categories = [],
  variant = "portrait",
  limit = 4,
  eyebrow,
  title,
  actionLabel,
  actionHref,
}) {
  const items = categories.slice(0, limit);
  if (items.length === 0) return null;

  const style = variants[variant] || variants.portrait;

  return (
    <Container as="section" className="py-16 md:py-24">
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        actionLabel={actionLabel}
        actionHref={actionHref}
      />
      <div className={cn("grid gap-4 md:gap-6", style.grid)}>
        {items.map((cat) => (
          <Link
            key={cat.slug}
            href={`/categories/${cat.slug}`}
            className={cn(
              "group relative overflow-hidden bg-surface-container",
              style.tile
            )}
          >
            <img
              src={decorativeImage(`category-${cat.slug}`, 800, 1000)}
              alt={cat.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <h3 className="font-serif text-headline-md text-white">
                {cat.name}
              </h3>
              <span className="mt-1 inline-block text-label-sm uppercase tracking-[0.12em] text-white/80">
                {cat.product_count} item{cat.product_count !== 1 ? "s" : ""}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}
