import cn from "../../lib/cn";

/**
 * A small pill of metadata — "Exclusive", "-30% Off", "Sold Out".
 *
 * Tones are named for their role, not their colour, so a theme can repaint
 * them without any call site changing.
 */
const tones = {
  neutral: "bg-white/90 text-ink",
  accent: "bg-accent text-white",
  ink: "bg-ink text-white",
  danger: "bg-red-600 text-white",
  outline: "border border-ink/20 text-ink",
};

const sizes = {
  sm: "text-[10px]",
  md: "text-label-sm",
};

export default function Badge({
  tone = "neutral",
  size = "md",
  className = "",
  children,
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 font-semibold uppercase tracking-[0.15em]",
        tones[tone] || tones.neutral,
        sizes[size] || sizes.md,
        className
      )}
    >
      {children}
    </span>
  );
}
