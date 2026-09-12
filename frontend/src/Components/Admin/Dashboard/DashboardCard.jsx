import { Link } from "@inertiajs/react";

import cn from "../../../lib/cn";

/**
 * The panel every dashboard section sits in.
 *
 * One shell, used thirteen times: a title, a line saying what the number
 * actually measures, and a link to the page that manages it. The description is
 * not decoration — "Top products" is ambiguous and "Ranked by revenue" is not,
 * and a dashboard whose figures cannot be pinned to a definition is a dashboard
 * nobody trusts twice.
 *
 * The action link is what turns the dashboard into a starting point rather than
 * a terminus: every section can be opened in the screen that owns it.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.description] what the section measures
 * @param {string} [props.href] the management page this section belongs to
 * @param {string} [props.actionLabel]
 * @param {React.ReactNode} [props.aside] controls that live in the header
 * @param {boolean} [props.flush] drop the body padding, for edge-to-edge tables
 */
export default function DashboardCard({
  title,
  description,
  href,
  actionLabel = "View all",
  aside,
  flush = false,
  className = "",
  children,
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-xl bg-white shadow-sm ring-1 ring-gray-200",
        className
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-5 pb-4 pt-5">
        <div className="min-w-0">
          {/* h3: the page owns the h1 and each band of the dashboard its h2, so
              a section heading sits at this level and the document outline
              stays readable to a screen reader. */}
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-gray-500">{description}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {aside}
          {href && (
            <Link
              href={href}
              className="rounded text-xs font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              {actionLabel}
            </Link>
          )}
        </div>
      </header>

      <div className={cn("flex-1", flush ? "" : "px-5 pb-5")}>{children}</div>
    </section>
  );
}
