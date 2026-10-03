/**
 * A numbered checkout section heading. `id` labels the section it heads.
 *
 * @param {Object} props
 * @param {number} props.number
 * @param {string} props.id
 * @param {string} props.title
 * @param {string} [props.subtitle]
 */
export default function SectionTitle({ number, id, title, subtitle }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container text-sm font-bold text-accent"
      >
        {number}
      </span>
      <div>
        <h2 id={id} className="text-xl font-extrabold leading-tight text-ink">
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}
