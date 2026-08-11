import { Link } from "@inertiajs/react";

export default function SectionHeading({
  eyebrow,
  title,
  description,
  actionLabel,
  actionHref,
  align = "left",
  dark = false,
  className = "",
}) {
  const centered = align === "center";

  return (
    <div
      className={`mb-10 flex flex-col gap-4 md:mb-14 ${
        actionHref && !centered
          ? "md:flex-row md:items-end md:justify-between"
          : ""
      } ${centered ? "items-center text-center" : ""} ${className}`}
    >
      <div className={centered ? "max-w-2xl" : "max-w-2xl"}>
        {eyebrow && (
          <span
            className={`mb-3 block text-label-sm font-semibold uppercase tracking-[0.2em] ${
              dark ? "text-accent" : "text-outline"
            }`}
          >
            {eyebrow}
          </span>
        )}
        <h2
          className={`text-display-md ${dark ? "text-white" : "text-ink"}`}
        >
          {title}
        </h2>
        {description && (
          <p
            className={`mt-3 text-body-md ${
              dark ? "text-zinc-400" : "text-muted-foreground"
            }`}
          >
            {description}
          </p>
        )}
      </div>

      {actionHref && (
        <Link
          href={actionHref}
          className={`group inline-flex items-center gap-2 text-label-lg font-semibold uppercase tracking-[0.08em] ${
            dark ? "text-white" : "text-ink"
          }`}
        >
          {actionLabel || "View All"}
          <span className="transition-transform duration-200 group-hover:translate-x-1">
            &rarr;
          </span>
        </Link>
      )}
    </div>
  );
}
