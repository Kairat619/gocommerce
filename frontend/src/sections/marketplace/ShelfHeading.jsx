import { Link } from "@inertiajs/react";
import Icon from "../../Components/UI/Icon";

/**
 * The compact marketplace section header: optional icon, bold title, and a
 * "View All" link on the right.
 */
export default function ShelfHeading({ icon, title, actionLabel, actionHref }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        {icon && <Icon name={icon} className="h-6 w-6 text-orange-600" />}
        <h2 className="text-xl font-extrabold tracking-tight text-ink md:text-2xl">
          {title}
        </h2>
      </div>
      {actionHref && (
        <Link
          href={actionHref}
          className="flex shrink-0 items-center gap-0.5 rounded text-[13px] font-bold text-accent transition-colors hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {actionLabel || "View All"}
          <Icon name="chevronRight" className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
