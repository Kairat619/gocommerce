const tones = {
  neutral: "bg-white/90 text-ink",
  accent: "bg-accent text-white",
  success: "bg-ink text-white",
  danger: "bg-red-600 text-white",
  outline: "border border-ink/20 text-ink",
};

export default function Badge({ tone = "neutral", className = "", children }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-label-sm font-semibold uppercase tracking-[0.15em] ${
        tones[tone] || tones.neutral
      } ${className}`}
    >
      {children}
    </span>
  );
}
