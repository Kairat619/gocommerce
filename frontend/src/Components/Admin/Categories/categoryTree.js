/**
 * Tree maths for the flat `categories` prop.
 *
 * The Go serializers send categories as a flat list with a nullable
 * `parent_id` (see API_CONTRACT.md, Admin → Categories). Everything that needs
 * the shape of the tree — the parent picker, the form's circular-reference
 * guard, the admin list — derives it here rather than each growing its own copy.
 *
 * Every walker below is cycle-safe. The server rejects loops, but a list is a
 * list and a bad row must never hang the admin.
 *
 * @module Components/Admin/Categories/categoryTree
 */

/** Sibling order: the server's `sort_order ASC, name ASC`, reapplied per level. */
function bySortOrder(a, b) {
  return (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name);
}

/**
 * Group a flat list into roots and children.
 *
 * A category whose `parent_id` points at a row that is not in the list (or at
 * itself) is treated as a root, so a partial or inconsistent list still renders
 * completely instead of dropping branches.
 */
export function buildIndex(categories) {
  const byId = new Map();
  categories.forEach((category) => byId.set(category.id, category));

  const childrenOf = new Map();
  const roots = [];

  categories.forEach((category) => {
    const parentId = category.parent_id;
    if (parentId && parentId !== category.id && byId.has(parentId)) {
      if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
      childrenOf.get(parentId).push(category);
    } else {
      roots.push(category);
    }
  });

  roots.sort(bySortOrder);
  childrenOf.forEach((list) => list.sort(bySortOrder));

  return { byId, childrenOf, roots };
}

/**
 * The categories whose parent chain never reaches a root — i.e. those sitting
 * in a loop. Everything else is reachable from `roots` by walking children.
 */
function strandedIds(byId, categories) {
  const stranded = new Set();

  categories.forEach((category) => {
    const walked = new Set();
    let current = category;

    while (current) {
      if (walked.has(current.id)) {
        stranded.add(category.id);
        break;
      }
      walked.add(current.id);

      const parentId = current.parent_id;
      // buildIndex treats a missing or self-referential parent as a root, so
      // these chains terminate rather than strand.
      if (!parentId || parentId === current.id || !byId.has(parentId)) break;

      current = byId.get(parentId);
    }
  });

  return stranded;
}

/**
 * Depth-first rows ready to render as table lines.
 *
 * @param {object[]} categories
 * @param {object} [options]
 * @param {Set<string>} [options.collapsedIds] branches to render closed
 * @param {Set<string>} [options.visibleIds]   when searching: the matches plus
 *   their ancestors. Everything visible is forced open, because a hit hidden
 *   inside a collapsed branch is a hit the merchant never sees.
 * @returns {{category: object, depth: number, isLast: boolean,
 *   ancestorLines: boolean[], childCount: number, hasChildren: boolean,
 *   collapsed: boolean, detached: boolean}[]} one row per category — the count
 *   always matches the input (minus anything filtered out by `visibleIds`)
 */
export function flattenTree(categories, { collapsedIds, visibleIds } = {}) {
  const { byId, childrenOf, roots } = buildIndex(categories);
  const searching = !!visibleIds;

  const rows = [];
  const seen = new Set();

  // `lines[i]` — does the ancestor at depth i have a sibling after it? That is
  // what decides whether a vertical guide continues through this row.
  //
  // Note the shift when turning that into columns. A row at depth d draws d
  // cells: columns 0..d-2 are guides and column d-1 is its own elbow. An
  // ancestor at depth i has ITS elbow in column i-1, so its continuation line
  // belongs in column i-1 too — hence `lines.slice(1, depth)`, not
  // `slice(0, depth - 1)`. Depth-0 rows have no elbow at all, so `lines[0]`
  // never corresponds to a column.
  function walk(siblings, depth, lines) {
    const shown = searching ? siblings.filter((category) => visibleIds.has(category.id)) : siblings;

    shown.forEach((category, index) => {
      if (seen.has(category.id)) return;
      seen.add(category.id);

      const children = childrenOf.get(category.id) || [];
      const shownChildren = searching
        ? children.filter((child) => visibleIds.has(child.id))
        : children;

      const isLast = index === shown.length - 1;
      const collapsed = !searching && !!collapsedIds?.has(category.id);

      rows.push({
        category,
        depth,
        isLast,
        ancestorLines: lines.slice(1, depth),
        childCount: children.length,
        hasChildren: shownChildren.length > 0,
        collapsed,
        detached: false,
      });

      if (shownChildren.length > 0 && !collapsed) {
        walk(children, depth + 1, [...lines, !isLast]);
      }
    });
  }

  walk(roots, 0, []);

  // Categories stranded in a parent cycle are unreachable from any root, so the
  // walk above never emits them. The server rejects cycles, but if one ever
  // existed these rows would silently disappear from the admin and could never
  // be fixed. Surface them at the top level instead — the merchant can then
  // open one and give it a valid parent.
  //
  // Reachability is decided by walking parent chains, NOT by what the walk
  // emitted: a row hidden inside a collapsed branch is reachable, and must not
  // be mistaken for a stranded one.
  const stranded = strandedIds(byId, categories);

  const orphaned = categories
    .filter((category) => stranded.has(category.id))
    .filter((category) => !searching || visibleIds.has(category.id))
    .sort(bySortOrder);

  orphaned.forEach((category) => {
    rows.push({
      category,
      depth: 0,
      isLast: true,
      ancestorLines: [],
      childCount: (childrenOf.get(category.id) || []).length,
      hasChildren: false,
      collapsed: false,
      detached: true,
    });
  });

  return rows;
}

/**
 * A category plus every category beneath it.
 *
 * Reparenting a category under one of its own descendants would detach that
 * whole branch from the tree, so the picker greys these out and the server
 * rejects them (validateCategoryParent in admin_categories.go).
 */
export function subtreeIds(categories, rootId) {
  const ids = new Set();
  if (!rootId) return ids;

  ids.add(rootId);

  // Repeat until nothing new is found: the list is flat and unordered, so one
  // pass could miss a grandchild that appears before its parent.
  let grew = true;
  while (grew) {
    grew = false;
    categories.forEach((category) => {
      if (category.parent_id && ids.has(category.parent_id) && !ids.has(category.id)) {
        ids.add(category.id);
        grew = true;
      }
    });
  }

  return ids;
}

/** The chain of names from the root down to `id`, e.g. ["Electronics", "Phones"]. */
export function pathOf(categories, id) {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const chain = [];
  const seen = new Set();

  let current = byId.get(id);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    chain.unshift(current.name);
    current = current.parent_id ? byId.get(current.parent_id) : null;
  }

  return chain;
}

/**
 * The ids to keep when filtering: every category matching `query`, plus each
 * one's ancestors so a deep hit is still reachable through its branch.
 *
 * Returns null when the query is blank — "no filter", as distinct from "nothing
 * matched".
 */
export function searchIds(categories, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return null;

  const byId = new Map(categories.map((category) => [category.id, category]));
  const ids = new Set();

  categories.forEach((category) => {
    const haystack = `${category.name} ${category.slug}`.toLowerCase();
    if (!haystack.includes(needle)) return;

    const seen = new Set();
    let current = category;
    while (current && !seen.has(current.id)) {
      seen.add(current.id);
      ids.add(current.id);
      current = current.parent_id ? byId.get(current.parent_id) : null;
    }
  });

  return ids;
}
