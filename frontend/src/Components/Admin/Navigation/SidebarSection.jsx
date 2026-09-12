import { useId } from "react";

import { isShortcutActive } from "../../../Layouts/adminNavigation";
import SidebarItem from "./SidebarItem";

/**
 * One L1 section: a header that expands, and the L2 items beneath it.
 *
 * THE HEADER IS A BUTTON, NOT A LINK.
 *
 * It expands a section; it does not navigate anywhere. A <button> says that to
 * a keyboard and to a screen reader for free, and carries aria-expanded and
 * aria-controls without any extra work. Making it a link that also toggles
 * would be a link that lies about where it goes.
 *
 * THE ANIMATION IS A GRID ROW.
 *
 * Transitioning grid-template-rows between 0fr and 1fr animates to the content's
 * natural height without measuring it or hardcoding a max-height that clips a
 * section once it grows a fifth item. Nothing outside the section moves, so
 * expanding cannot shift the rest of the sidebar.
 *
 * A closed section is `invisible`, which removes its links from the tab order
 * and the accessibility tree while still allowing the height transition — the
 * alternative, `display: none`, cannot animate, and leaving them merely
 * height-zero leaves focusable links inside a collapsed panel.
 */
export default function SidebarSection({
  section,
  url,
  isOpen,
  activeItemId,
  onToggle,
  onNavigate,
}) {
  const panelId = `${useId()}-${section.id}`;

  // A section containing the current page is marked even while collapsed, so
  // "where am I" survives the user collapsing it to look elsewhere. It stays
  // deliberately quieter than the active L2 item: the page you are on should
  // read louder than the drawer it lives in.
  const containsActive = Boolean(activeItemId);

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          containsActive
            ? "text-gray-900"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        <svg
          aria-hidden="true"
          className={`h-5 w-5 shrink-0 ${containsActive ? "text-indigo-600" : "text-gray-400"}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={section.icon} />
        </svg>

        <span className="min-w-0 flex-1 text-left">{section.label}</span>

        {/* A dot, so "this section holds the current page" is not carried by
            colour alone when the section is collapsed. */}
        {containsActive && !isOpen && (
          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
        )}

        <svg
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-90" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      <div
        id={panelId}
        className={`grid transition-all duration-200 ease-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "invisible grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          {/* The rule is the hierarchy: L2 items hang off a line descending from
              their parent, so the nesting reads without relying on indentation
              alone. */}
          <ul className="ml-[1.4rem] mt-0.5 space-y-0.5 border-l border-gray-200 pl-3">
            {section.children.map((item) => (
              <SidebarItem
                key={item.id}
                item={item}
                isActive={item.id === activeItemId}
                isShortcutActive={isShortcutActive(item, url)}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}
