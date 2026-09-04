import cn from "../../lib/cn";

/**
 * A labelled form control with its validation error and optional hint.
 *
 * Pass the control as children so this works with Input, a select, a textarea
 * or anything else. `htmlFor` must match the control's id — a label that points
 * at nothing announces nothing.
 *
 * (This is the storefront's field. `Components/Admin/Form/Field.jsx` is the
 * admin one and is deliberately separate — the admin area is application
 * chrome, outside the theme.)
 *
 * @param {Object} props
 * @param {string} props.label
 * @param {string} props.htmlFor  id of the control in children
 * @param {string} [props.error]  message from usePage().props.errors
 * @param {string} [props.hint]
 */
export default function Field({
  label,
  htmlFor,
  error,
  hint,
  className = "",
  children,
}) {
  return (
    <div className={cn(className)}>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-label-sm font-semibold uppercase tracking-[0.1em] text-ink"
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-body-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-label-sm text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
