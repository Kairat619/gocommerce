import { usePage } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";

import {
  ADMIN_NAVIGATION,
  filterNavigation,
  resolveActive,
} from "../../../Layouts/adminNavigation";
import SidebarSection from "./SidebarSection";

/**
 * The admin sidebar navigation.
 *
 * Owns one piece of state — which L1 section is open — and derives everything
 * else from the current URL. The sections and items themselves are data
 * (Layouts/adminNavigation.js); this is the only place that decides what is
 * open.
 *
 * THE ROUTE WINS.
 *
 * A sidebar that says "Blog" while you are looking at the products list is
 * worse than one that does not open at all, so the current route always takes
 * priority over whatever the user last clicked. Navigating re-opens the
 * section that owns the new page, including on a refresh, a bookmark, a direct
 * URL and the browser's back and forward buttons.
 *
 * Between navigations the user is free to open any section they like — browsing
 * the menu is not the same as being lost in it.
 *
 * `usePage().url` is the source of truth, NOT window.location. Inertia updates
 * the page prop as part of the visit, so the sidebar re-renders with the new
 * URL; reading window.location would work by coincidence of render timing and
 * break the moment that timing changed.
 */
export default function AdminSidebarNav({ onNavigate, can }) {
  const { url } = usePage();

  // Static data plus a pure filter — cheap enough to run on every render, but
  // memoised because this component sits on every admin page.
  const navigation = useMemo(() => filterNavigation(ADMIN_NAVIGATION, can), [can]);
  const active = useMemo(() => resolveActive(navigation, url), [navigation, url]);

  const [openSection, setOpenSection] = useState(() => active?.sectionId ?? null);

  // Re-assert the route's section whenever the route changes.
  //
  // Keyed on active.sectionId rather than on the URL, so moving between two
  // pages of the same section does not fight a user who has opened a different
  // one to browse. A route with no owning section leaves the accordion alone.
  useEffect(() => {
    if (active?.sectionId) setOpenSection(active.sectionId);
  }, [active?.sectionId]);

  function toggle(sectionId) {
    // One open at a time: opening a section is simply replacing the open one.
    setOpenSection((current) => (current === sectionId ? null : sectionId));
  }

  return (
    <nav aria-label="Admin sections" className="flex-1 overflow-y-auto px-3 py-4">
      <ul className="space-y-0.5">
        {navigation.map((section) => (
          <SidebarSection
            key={section.id}
            section={section}
            url={url}
            isOpen={openSection === section.id}
            activeItemId={active?.sectionId === section.id ? active.itemId : null}
            onToggle={() => toggle(section.id)}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    </nav>
  );
}
