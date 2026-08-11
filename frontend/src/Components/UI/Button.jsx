import { Link } from "@inertiajs/react";

const variants = {
  primary:
    "bg-ink text-white hover:bg-ink/90 focus-visible:ring-ink",
  accent:
    "bg-accent text-white hover:bg-accent/90 focus-visible:ring-accent",
  outline:
    "border border-ink/20 text-ink hover:border-ink hover:bg-ink/5 focus-visible:ring-ink",
  ghost:
    "text-ink hover:bg-ink/5 focus-visible:ring-ink",
  inverse:
    "bg-white text-ink hover:bg-accent hover:text-white focus-visible:ring-white",
  "inverse-outline":
    "border border-white/40 text-white hover:bg-white/10 focus-visible:ring-white",
};

const sizes = {
  sm: "h-9 px-4 text-label-sm",
  md: "h-11 px-6 text-label-lg",
  lg: "h-14 px-8 text-label-lg",
};

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold uppercase tracking-[0.08em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

export default function Button({
  variant = "primary",
  size = "md",
  href,
  className = "",
  children,
  ...props
}) {
  const classes = `${base} ${variants[variant] || variants.primary} ${
    sizes[size] || sizes.md
  } ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
