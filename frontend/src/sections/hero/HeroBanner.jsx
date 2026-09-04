import Button from "../../Components/UI/Button";
import Container from "../../Components/UI/Container";
import cn from "../../lib/cn";
import { decorativeImage } from "../../lib/image";

/**
 * The homepage hero.
 *
 * Variant class strings are held HERE, not in the theme. A theme picks a
 * variant by name; it never supplies Tailwind classes. That keeps every class
 * literal and scannable, which is the only way the production purge can see
 * them.
 *
 * @param {Object} props
 * @param {"split"|"centered"} [props.variant]
 * @param {string} [props.eyebrow]
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {{label: string, href: string, variant?: string}[]} [props.actions]
 * @param {string} [props.imageSeed] seed for the decorative background
 * @param {string} [props.imageAlt]
 * @param {"short"|"standard"|"tall"} [props.height]
 */
const heights = {
  short: "min-h-[60vh]",
  standard: "min-h-[78vh]",
  tall: "min-h-[86vh]",
};

const variants = {
  split: {
    overlay: "bg-gradient-to-r from-ink via-ink/70 to-transparent",
    container: "flex items-center",
    body: "max-w-xl py-24 text-left",
    actions: "justify-start",
    imageOpacity: "opacity-70",
  },
  centered: {
    overlay: "bg-ink/60",
    container: "flex items-center justify-center",
    body: "mx-auto max-w-2xl py-28 text-center",
    actions: "justify-center",
    imageOpacity: "opacity-50",
  },
};

export default function HeroBanner({
  variant = "split",
  eyebrow,
  title,
  description,
  actions = [],
  imageSeed = "hero",
  imageAlt = "",
  height = "standard",
}) {
  const style = variants[variant] || variants.split;
  const minHeight = heights[height] || heights.standard;

  return (
    <section className={cn("relative overflow-hidden bg-ink", minHeight)}>
      <img
        src={decorativeImage(imageSeed, 1920, 1200)}
        alt={imageAlt}
        aria-hidden={imageAlt ? undefined : "true"}
        className={cn(
          "absolute inset-0 h-full w-full object-cover",
          style.imageOpacity
        )}
      />
      <div className={cn("absolute inset-0", style.overlay)} />
      <Container className={cn("relative", minHeight, style.container)}>
        <div className={cn("animate-fade-up text-white", style.body)}>
          {eyebrow && (
            <span className="mb-5 block text-label-lg font-semibold uppercase tracking-[0.2em] text-accent">
              {eyebrow}
            </span>
          )}
          <h1 className="text-display-xl text-white">{title}</h1>
          {description && (
            <p
              className={cn(
                "mt-6 max-w-md text-body-lg text-zinc-300",
                variant === "centered" && "mx-auto"
              )}
            >
              {description}
            </p>
          )}
          {actions.length > 0 && (
            <div className={cn("mt-9 flex flex-wrap gap-4", style.actions)}>
              {actions.map((action) => (
                <Button
                  key={action.label}
                  href={action.href}
                  variant={action.variant || "inverse"}
                  size="lg"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
