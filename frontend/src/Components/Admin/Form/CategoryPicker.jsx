import { useEffect, useMemo, useState } from "react";
import Field, { inputClass } from "./Field";

function buildTree(categories) {
  const byId = new Map();
  categories.forEach((category) => byId.set(category.id, category));

  const children = new Map();
  const roots = [];

  categories.forEach((category) => {
    const parentId = category.parent_id;
    if (parentId && byId.has(parentId)) {
      if (!children.has(parentId)) children.set(parentId, []);
      children.get(parentId).push(category);
    } else {
      roots.push(category);
    }
  });

  return { byId, children, roots };
}

function ancestorsOf(id, byId) {
  const chain = [];
  let current = byId.get(id);
  const guard = new Set();

  while (current && !guard.has(current.id)) {
    guard.add(current.id);
    chain.unshift(current);
    current = current.parent_id ? byId.get(current.parent_id) : null;
  }
  return chain;
}

// Hierarchical category selector. Searching stays client-side because the whole
// (small) category tree is already delivered with the page; matched branches are
// expanded automatically so deep trees stay navigable.
export default function CategoryPicker({ label, categories = [], value, onChange, error, hint, required }) {
  const { byId, children, roots } = useMemo(() => buildTree(categories), [categories]);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(() => new Set());

  useEffect(() => {
    if (!value) return;
    setExpanded((current) => {
      const next = new Set(current);
      ancestorsOf(value, byId).forEach((node) => next.add(node.id));
      return next;
    });
  }, [value, byId]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return null;

    const ids = new Set();
    categories.forEach((category) => {
      if (category.name.toLowerCase().includes(needle) || category.slug.toLowerCase().includes(needle)) {
        ancestorsOf(category.id, byId).forEach((node) => ids.add(node.id));
      }
    });
    return ids;
  }, [query, categories, byId]);

  const selectedPath = value ? ancestorsOf(value, byId) : [];

  function toggle(id) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function renderNode(category, depth) {
    if (visible && !visible.has(category.id)) return null;

    const kids = children.get(category.id) || [];
    const isOpen = visible ? true : expanded.has(category.id);
    const isSelected = value === category.id;

    return (
      <li key={category.id}>
        <div
          className={`flex items-center gap-1 rounded-md pr-2 ${isSelected ? "bg-indigo-50" : "hover:bg-gray-50"}`}
          style={{ paddingLeft: `${depth * 16}px` }}
        >
          {kids.length > 0 ? (
            <button
              type="button"
              onClick={() => toggle(category.id)}
              aria-label={isOpen ? `Collapse ${category.name}` : `Expand ${category.name}`}
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-gray-400 hover:text-gray-700"
            >
              <svg
                className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-90" : ""}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" />
              </svg>
            </button>
          ) : (
            <span className="h-6 w-6 flex-shrink-0" />
          )}

          <button
            type="button"
            onClick={() => onChange(isSelected ? "" : category.id)}
            className={`flex-1 truncate py-1.5 text-left text-sm ${
              isSelected ? "font-medium text-indigo-700" : "text-gray-700"
            }`}
          >
            {category.name}
            {category.is_active === false && <span className="ml-2 text-xs text-gray-400">(inactive)</span>}
          </button>

          {isSelected && (
            <svg className="h-4 w-4 flex-shrink-0 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4l3.8 3.79 6.8-6.8a1 1 0 011.4 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>

        {kids.length > 0 && isOpen && <ul>{kids.map((child) => renderNode(child, depth + 1))}</ul>}
      </li>
    );
  }

  return (
    <Field label={label} required={required} hint={hint} error={error}>
      {selectedPath.length > 0 && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-sm text-indigo-800">
            {selectedPath.map((node, index) => (
              <span key={node.id}>
                {index > 0 && <span className="mx-1 text-indigo-400">/</span>}
                <span className={index === selectedPath.length - 1 ? "font-medium" : ""}>{node.name}</span>
              </span>
            ))}
          </span>
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear selected category"
            className="text-indigo-400 hover:text-indigo-700"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      )}

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search categories"
        className={`${inputClass(error)} mb-2`}
      />

      <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 p-1">
        {categories.length === 0 ? (
          <p className="px-2 py-3 text-sm text-gray-500">
            No categories yet. Create one under Categories first.
          </p>
        ) : (
          <ul>{roots.map((root) => renderNode(root, 0))}</ul>
        )}
        {visible && visible.size === 0 && (
          <p className="px-2 py-3 text-sm text-gray-500">No categories match “{query}”.</p>
        )}
      </div>
    </Field>
  );
}
