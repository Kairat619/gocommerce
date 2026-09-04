import cn from "../../lib/cn";

/**
 * The "nothing here" panel: a heading, a line of guidance, and an optional way
 * out passed as children.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.children] the action — a Button or a link
 */
export default function EmptyState({
  title,
  description,
  className = "",
  children,
}) {
  return (
    <div
      className={cn(
        "border border-dashed border-ink/15 py-24 text-center",
        className
      )}
    >
      <p className="font-serif text-headline-md text-ink">{title}</p>
      {description && (
        <p className="mt-2 text-body-sm text-muted-foreground">{description}</p>
      )}
      {children && <div className="mt-6 flex justify-center">{children}</div>}
    </div>
  );
}
