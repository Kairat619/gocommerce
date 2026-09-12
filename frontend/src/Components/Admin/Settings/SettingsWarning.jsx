/**
 * What a setting will actually do.
 *
 * Used sparingly and only where a change reaches beyond its own page — the
 * currency relabelling every price in the database, the tax rate applying to
 * orders not yet placed. A callout on every field is a callout nobody reads,
 * which is exactly how the one that mattered gets missed.
 *
 * `tone` carries emphasis, never meaning: each variant is introduced by its own
 * word ("Before you change this", "Worth knowing") and an icon, so the message
 * survives greyscale and a screen reader.
 */
const tones = {
  info: {
    wrapper: "bg-sky-50 ring-sky-200",
    icon: "text-sky-600",
    heading: "text-sky-900",
    body: "text-sky-800",
    label: "Worth knowing",
    path: "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z",
  },
  caution: {
    wrapper: "bg-amber-50 ring-amber-200",
    icon: "text-amber-600",
    heading: "text-amber-900",
    body: "text-amber-800",
    label: "Before you change this",
    path: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z",
  },
};

export default function SettingsWarning({ tone = "info", title, children }) {
  const style = tones[tone] || tones.info;

  return (
    <div className={`flex gap-3 rounded-lg p-4 ring-1 ring-inset ${style.wrapper}`}>
      <svg
        aria-hidden="true"
        className={`mt-0.5 h-5 w-5 shrink-0 ${style.icon}`}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.8"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={style.path} />
      </svg>
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${style.heading}`}>
          {title || style.label}
        </p>
        <div className={`mt-0.5 text-sm ${style.body}`}>{children}</div>
      </div>
    </div>
  );
}
