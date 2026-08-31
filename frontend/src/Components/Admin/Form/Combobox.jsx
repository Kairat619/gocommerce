import { useEffect, useMemo, useRef, useState } from "react";
import Field, { inputClass } from "./Field";

// Searchable text field that suggests existing values but still accepts a new
// one, so merchants can reuse a brand without an extra management screen.
export default function Combobox({
  label,
  name,
  value,
  onChange,
  options = [],
  error,
  hint,
  required,
  placeholder,
  allowCustom = true,
  emptyLabel = "No matches",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const search = open ? query : value || "";
  const matches = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return options.slice(0, 50);
    return options.filter((option) => option.toLowerCase().includes(needle)).slice(0, 50);
  }, [options, search]);

  const exactMatch = options.some((option) => option.toLowerCase() === query.trim().toLowerCase());

  function select(option) {
    onChange(option);
    setQuery("");
    setOpen(false);
  }

  return (
    <Field label={label} htmlFor={name} required={required} hint={hint} error={error}>
      <div className="relative" ref={containerRef}>
        <input
          id={name}
          role="combobox"
          aria-expanded={open}
          autoComplete="off"
          value={open ? query : value || ""}
          placeholder={placeholder}
          onFocus={() => {
            setQuery(value || "");
            setOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (allowCustom) onChange(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (matches.length === 1) select(matches[0]);
              else setOpen(false);
            }
            if (e.key === "Escape") setOpen(false);
          }}
          className={inputClass(error)}
        />

        {value && (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => {
              onChange("");
              setQuery("");
            }}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}

        {open && (
          <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {matches.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => select(option)}
                  className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-indigo-50 ${
                    option === value ? "font-medium text-indigo-700" : "text-gray-700"
                  }`}
                >
                  {option}
                </button>
              </li>
            ))}
            {allowCustom && query.trim() && !exactMatch && (
              <li>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => select(query.trim())}
                  className="block w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-indigo-50"
                >
                  Use “<span className="font-medium">{query.trim()}</span>”
                </button>
              </li>
            )}
            {matches.length === 0 && !allowCustom && (
              <li className="px-3 py-2 text-sm text-gray-500">{emptyLabel}</li>
            )}
          </ul>
        )}
      </div>
    </Field>
  );
}
