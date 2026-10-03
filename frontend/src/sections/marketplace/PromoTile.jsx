import { Link } from "@inertiajs/react";
import cn from "../../lib/cn";
import Icon from "../../Components/UI/Icon";

/**
 * A gradient promotion card: copy and a call to action on the left, framed
 * artwork bleeding off the bottom-right corner.
 *
 * Shared by the hero duo and the promo trio. A theme picks the colourway by
 * `tone` and the scale by `size`; both map to literal classes here so the
 * production purge can see them.
 *
 * @param {Object} props
 * @param {"midnight"|"ocean"|"forest"|"royal"|"ember"} [props.tone]
 * @param {"feature"|"spotlight"|"standard"} [props.size]
 * @param {string} [props.eyebrow]
 * @param {string} props.title
 * @param {string} [props.highlight]  a second, gradient-lettered title line
 * @param {string} [props.description]
 * @param {{label: string, href: string}} [props.action]
 * @param {string} [props.image]
 * @param {string} [props.imageAlt]
 * @param {"h1"|"h2"|"h3"} [props.headingLevel]
 */
const tones = {
  midnight: "bg-gradient-to-r from-[#0d1630] via-[#162550] to-[#1e3472]",
  ocean: "bg-gradient-to-br from-[#0284c7] via-[#0369a1] to-[#075985]",
  forest: "bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#40916c]",
  royal: "bg-gradient-to-br from-[#3b82f6] via-[#2563eb] to-[#1d4ed8]",
  ember: "bg-gradient-to-br from-[#991b1b] via-[#b91c1c] to-[#c2410c]",
};

const sizes = {
  feature: {
    card: "min-h-[340px] p-6 md:min-h-[380px] md:p-10",
    body: "max-w-[60%] sm:max-w-md",
    title: "text-[28px] leading-[34px] md:text-[40px] md:leading-[48px]",
    description: "text-sm leading-5",
    image:
      "-bottom-6 -right-6 w-[46%] max-w-[360px] rotate-[-4deg] md:bottom-6 md:right-8 md:w-[42%]",
    action: "bg-accent text-white hover:bg-accent/90 px-6 py-3",
  },
  spotlight: {
    card: "min-h-[300px] p-6 md:p-8 lg:min-h-[380px]",
    body: "max-w-[70%]",
    title: "text-[22px] leading-7 md:text-[26px] md:leading-8",
    description: "text-[13px] leading-[18px]",
    image: "-bottom-4 -right-4 w-[58%] max-w-[300px] rotate-[-8deg]",
    action: "bg-white/15 text-white backdrop-blur-sm hover:bg-white/25 px-4 py-2",
  },
  standard: {
    card: "min-h-[260px] p-6",
    body: "max-w-[62%]",
    title: "text-[22px] leading-7 md:text-2xl md:leading-8",
    description: "text-[13px] leading-[18px]",
    image: "-bottom-4 -right-4 w-[52%] max-w-[240px] rotate-[-6deg]",
    action: "bg-white text-ink hover:bg-accent-soft px-4 py-2",
  },
};

export default function PromoTile({
  tone = "midnight",
  size = "standard",
  eyebrow,
  title,
  highlight,
  description,
  action,
  image,
  imageAlt = "",
  headingLevel = "h3",
  className = "",
}) {
  const scale = sizes[size] || sizes.standard;
  const Heading = headingLevel;

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between overflow-hidden rounded-2xl text-white shadow-sm",
        tones[tone] || tones.midnight,
        scale.card,
        className
      )}
    >
      {size === "feature" && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-accent/30 blur-3xl"
        />
      )}

      <div className={cn("relative z-10 flex flex-col items-start gap-2", scale.body)}>
        {eyebrow && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase leading-[14px] tracking-wider backdrop-blur-sm">
            {size === "feature" && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-soft" />
            )}
            {eyebrow}
          </span>
        )}
        <Heading className={cn("font-extrabold tracking-tight", scale.title)}>
          {title}
          {highlight && (
            <span className="block bg-gradient-to-r from-white via-accent-soft to-sky-200 bg-clip-text text-transparent">
              {highlight}
            </span>
          )}
        </Heading>
        {description && (
          <p className={cn("text-white/80", scale.description)}>{description}</p>
        )}
      </div>

      {image && (
        <div
          className={cn(
            "pointer-events-none absolute overflow-hidden rounded-xl shadow-[0_20px_35px_rgba(0,0,0,0.35)] ring-4 ring-white/10",
            scale.image
          )}
        >
          <img
            src={image}
            alt={imageAlt}
            aria-hidden={imageAlt ? undefined : "true"}
            className="aspect-[800/436] w-full object-cover"
          />
        </div>
      )}

      {action && (
        <div className="relative z-10 pt-6">
          <Link
            href={action.href}
            className={cn(
              "group inline-flex items-center gap-1.5 rounded-lg text-[13px] font-bold leading-4 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-95",
              scale.action
            )}
          >
            {action.label}
            <Icon
              name="arrowRight"
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      )}
    </div>
  );
}
