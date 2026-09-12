import { router } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { searchSettings } from "./settingsFields";

/**
 * Find a setting by name.
 *
 * Worth having the moment a configuration page stops fitting on one screen:
 * "where do I change the tax rate" is a faster question to type than to browse,
 * and it only gets truer as sections are added.
 *
 * Results are fields, not pages — "Tax rate — Tax & Shipping" — because knowing
 * which page to open is the whole answer. Selecting one navigates to that
 * section and highlights the field via a #hash, so the administrator lands
 * looking at the thing they searched for.
 *
 * Entirely client-side over a fixed index of under twenty entries, so there is
 * no request and no debounce to get wrong.
 */
export default function SettingsSearch({ sections = [] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const containerRef = useRef(null);

  const results = useMemo(() => searchSettings(query, sections), [query, sections]);

  useEffect(() => setActive(0), [query]);

  // Close on an outside click, so the panel does not linger over the form.
  useEffect(() => {
    function onPointerDown(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function go(result) {
    setOpen(false);
    setQuery("");
    router.get(`/admin/settings/${result.section.key}`, {}, { preserveScroll: false });
  }

  function onKeyDown(event) {
    if (!open || results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(results[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const listboxId = "settings-search-results";

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor="settings-search" className="sr-only">
        Search settings
      </label>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
          clipRule="evenodd"
        />
      </svg>
      <input
        id="settings-search"
        type="search"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && results.length > 0 ? `settings-result-${active}` : undefined
        }
        value={query}
        placeholder="Search settings"
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-gray-200">
          {results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-gray-500">
              Nothing matches “{query.trim()}”.
            </p>
          ) : (
            <ul id={listboxId} role="listbox" aria-label="Matching settings">
              {results.map((result, index) => (
                <li
                  key={result.key}
                  id={`settings-result-${index}`}
                  role="option"
                  aria-selected={index === active}
                >
                  <button
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => go(result)}
                    className={`flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left ${
                      index === active ? "bg-indigo-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="truncate text-sm font-medium text-gray-900">
                      {result.label}
                    </span>
                    <span className="shrink-0 text-xs text-gray-500">
                      {result.section.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
