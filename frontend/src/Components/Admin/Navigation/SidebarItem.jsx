import { Link } from "@inertiajs/react";

/**
 * One L2 navigation item.
 *
 * An Inertia <Link>, exactly as every other navigation link in this admin — so
 * a click is a client-side visit, the browser history entry is real, back and
 * forward behave, and nothing about routing, auth or permissions changes
 * because the sidebar was rebuilt.
 *
 * TWO KINDS OF HIGHLIGHT, AND THEY MEAN DIFFERENT THINGS.
 *
 * `isActive` is the owner of the current route — the page you are on, including
 * when you are somewhere beneath it (/admin/products/17/edit still lights
 * Products). It gets the indigo bar and `aria-current="page"`.
 *
 * `isShortcutActive` is a Quick Links entry pointing at exactly this path. It
 * is highlighted more faintly and never claims aria-current, because the page
 * is already owned by the section it belongs to. Two items claiming to be the
 * current page is worse than one item looking slightly inert.
 */
export default function SidebarItem({ item, isActive, isShortcutActive, onNavigate }) {
  const highlighted = isActive || isShortcutActive;

  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
        className={`group relative flex items-center gap-2.5 rounded-lg py-1.5 pl-3 pr-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          isActive
            ? "bg-indigo-50 font-medium text-indigo-700"
            : isShortcutActive
            ? "font-medium text-gray-900"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        {/* The marker sits on the parent's rule, so the active item reads as a
            node on the tree rather than as a floating pill. Colour is not doing
            this alone — the label also goes medium-weight. */}
        {isActive && (
          <span
            aria-hidden="true"
            className="absolute -left-[13px] top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-indigo-600"
          />
        )}

        {item.icon && (
          <svg
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 ${
              isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-500"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
          </svg>
        )}

        <span className="min-w-0 truncate">{item.label}</span>

        {/* Spoken only. The visual cue is the bar and the weight; a screen
            reader gets aria-current, and this covers the shortcut case, which
            deliberately has no aria-current to give. */}
        {highlighted && !isActive && <span className="sr-only">(current page)</span>}
      </Link>
    </li>
  );
}
