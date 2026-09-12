/**
 * The admin navigation tree.
 *
 * Data, not markup. The sidebar components render whatever is here, so adding a
 * module is adding an object to this array — no JSX to duplicate, no component
 * to edit. That is the whole point: the Commerce Core is going to grow
 * Inventory, Finance, Analytics and Reports, and none of them should require
 * touching the sidebar's rendering.
 *
 * The pipeline is deliberately one-directional:
 *
 *   NAVIGATION (here)  ->  permission filter  ->  active route  ->  accordion
 *   ->  UI
 *
 * Each stage is a pure function in this file. The components do presentation.
 *
 * ICONS are inline SVG path data, which is the icon system this admin already
 * uses — every icon in AdminLayout, the dashboard and the settings pages is an
 * inline path. No icon library is introduced for this.
 *
 * ROUTES ARE THE ONES THAT EXIST. Every href below is a real, registered route
 * in cmd/server/main.go. Nothing here points at a page that would 404.
 */

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

const icons = {
  bolt: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
  home: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
  plus: "M12 4.5v15m7.5-7.5h-15",
  box: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z",
  folder:
    "M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z",
  tag: "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z",
  grid: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
  sliders:
    "M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122",
  receipt:
    "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z",
  cart: "M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12A1.125 1.125 0 0119.75 21.75H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z",
  users:
    "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
  ticket:
    "M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z",
  megaphone:
    "M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46",
  cog: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.281z",
  server:
    "M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.923a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008zm-3 0h.008v.008h-.008v-.008z",
};

/**
 * The tree.
 *
 * A SECTION is one of two shapes:
 *
 *   a group  — has `children`, renders as an expandable accordion header
 *   a leaf    — has `href`, renders as a direct link with no chevron
 *
 * Item fields:
 *   href      the route. Must exist in cmd/server/main.go.
 *   exact     this item owns only its exact path, never anything beneath it.
 *   shortcut  a convenience link, not the owner of its route. See ownership
 *             below — this is what stops "New Product" hijacking Catalog when
 *             you are on /admin/products/create.
 *   permission  optional capability key, checked by filterNavigation.
 */
export const ADMIN_NAVIGATION = [
  {
    // A LEAF SECTION: an L1 that is a destination, not a drawer.
    //
    // The dashboard is where the admin starts and the one page that is not
    // "inside" anything, so filing it under a group was making the most-visited
    // page the least reachable — two clicks and a mental step through a
    // container it never belonged in. It renders as a direct link with no
    // chevron.
    //
    // Exact, because /admin is a prefix of every admin route and would
    // otherwise claim ownership of the entire panel.
    id: "dashboard",
    label: "Dashboard",
    icon: icons.home,
    href: "/admin",
    exact: true,
  },
  {
    id: "quick-links",
    label: "Quick Links",
    icon: icons.bolt,
    children: [
      {
        id: "new-product",
        label: "New Product",
        href: "/admin/products/create",
        icon: icons.plus,
        shortcut: true,
      },
      {
        id: "new-coupon",
        label: "New Coupon",
        href: "/admin/coupons/create",
        icon: icons.ticket,
        shortcut: true,
      },
    ],
  },
  {
    id: "catalog",
    label: "Catalog",
    icon: icons.box,
    children: [
      { id: "products", label: "Products", href: "/admin/products", icon: icons.box },
      { id: "categories", label: "Categories", href: "/admin/categories", icon: icons.folder },
      { id: "collections", label: "Collections", href: "/admin/collections", icon: icons.grid },
      { id: "attributes", label: "Attributes", href: "/admin/attributes", icon: icons.sliders },
    ],
  },
  {
    id: "sale",
    label: "Sale",
    icon: icons.cart,
    children: [{ id: "orders", label: "Orders", href: "/admin/orders", icon: icons.receipt }],
  },
  {
    id: "customer",
    label: "Customer",
    icon: icons.users,
    children: [{ id: "customers", label: "Customers", href: "/admin/customers", icon: icons.users }],
  },
  {
    id: "promotion",
    label: "Promotion",
    icon: icons.megaphone,
    children: [{ id: "coupons", label: "Coupons", href: "/admin/coupons", icon: icons.ticket }],
  },
  {
    id: "configuration",
    label: "Configuration",
    icon: icons.cog,
    children: [
      { id: "settings", label: "Settings", href: "/admin/settings", icon: icons.cog },
      {
        // A deep link to one section, because "is storage connected" is a
        // question people come to the admin specifically to answer.
        id: "system",
        label: "System status",
        href: "/admin/settings/system",
        icon: icons.server,
        shortcut: true,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Stage 1 — permissions
// ---------------------------------------------------------------------------

/**
 * Drop what this user may not reach.
 *
 * TODAY THIS FILTERS NOTHING, AND THAT IS CORRECT. The application has exactly
 * two roles, `admin` and `customer`, and the whole /admin tree sits behind one
 * RequireAdmin middleware — so an administrator who can see the sidebar can
 * reach every page in it. No item declares a `permission`, so every item
 * passes.
 *
 * The seam exists because the moment a finer role appears, this is where it
 * belongs, and retrofitting it into the rendering is how permission checks end
 * up scattered through JSX.
 *
 * THE SIDEBAR IS NOT THE SECURITY BOUNDARY. Hiding a link hides a link. The
 * server rejects the request either way, and that stays true.
 *
 * A section whose children are all filtered out is dropped rather than rendered
 * as an empty expandable group.
 *
 * @param {(permission: string) => boolean} [can]
 */
export function filterNavigation(navigation, can) {
  if (typeof can !== "function") return navigation;

  return navigation
    .map((section) => {
      // A leaf section is a single destination — it stands or falls on its own
      // permission, and there is nothing beneath it to filter.
      if (!section.children) return section;

      return {
        ...section,
        children: section.children.filter((item) => !item.permission || can(item.permission)),
      };
    })
    .filter((section) => {
      if (!section.children) return !section.permission || can(section.permission);
      return section.children.length > 0;
    });
}

// ---------------------------------------------------------------------------
// Stage 2 — active route
// ---------------------------------------------------------------------------

/**
 * Strip the query string and any trailing slash so `/admin/products?page=2`
 * and `/admin/products/` both resolve like `/admin/products`.
 */
export function normalizePath(url) {
  if (typeof url !== "string") return "/";
  const path = url.split("?")[0].split("#")[0];
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/**
 * Does this item own this path?
 *
 * Prefix matching, so a nested route belongs to its list page —
 * /admin/products/{id}/edit is Catalog → Products, which is what a merchant
 * editing a product expects the sidebar to say. Exact items opt out.
 *
 * The boundary check matters: `/admin/products` must not match
 * `/admin/products-archive`, so a prefix only counts when the next character is
 * a slash.
 */
function matchesItem(item, path) {
  if (path === item.href) return true;
  if (item.exact) return false;
  return path.startsWith(`${item.href}/`);
}

/**
 * Which item owns the current path.
 *
 * LONGEST MATCH WINS. /admin/products/create is matched by both Products
 * (/admin/products) and, were it eligible, New Product — the more specific href
 * is the better answer generally, so specificity decides.
 *
 * SHORTCUTS ARE NOT OWNERS. "New Product" and "New Coupon" are conveniences
 * that point at pages Catalog and Promotion already own. If they could win
 * ownership, opening the create-product page would collapse Catalog and open
 * Quick Links — telling the merchant they are in "Quick Links → New Product"
 * when they are plainly working inside the catalogue. So shortcuts are skipped
 * here and merely highlighted (see isShortcutActive).
 *
 * Returns { sectionId, itemId } or null when nothing matches, which is a real
 * state: an admin page that is not in the navigation should not force a section
 * open.
 */
export function resolveActive(navigation, url) {
  const path = normalizePath(url);

  let best = null;
  let bestLength = -1;

  for (const section of navigation) {
    // A leaf section owns its route directly. itemId is null, which is how the
    // caller tells "the section itself is the page" from "a child of it is".
    if (!section.children) {
      if (matchesItem(section, path) && section.href.length > bestLength) {
        bestLength = section.href.length;
        best = { sectionId: section.id, itemId: null };
      }
      continue;
    }

    for (const item of section.children) {
      if (item.shortcut) continue;
      if (!matchesItem(item, path)) continue;

      if (item.href.length > bestLength) {
        bestLength = item.href.length;
        best = { sectionId: section.id, itemId: item.id };
      }
    }
  }

  return best;
}

/**
 * Whether a shortcut points at exactly where we are.
 *
 * Shortcuts do not own routes, but standing on /admin/products/create while
 * "New Product" looks untouched is its own small confusion — so it gets a
 * highlight without controlling which section is open.
 */
export function isShortcutActive(item, url) {
  return Boolean(item.shortcut) && normalizePath(url) === item.href;
}
