import { useState } from "react";
import Field, { inputClass } from "./Field";

export default function TagInput({ label, name, tags = [], onChange, error, hint, placeholder = "Add a tag and press Enter", suggestions = [] }) {
  const [draft, setDraft] = useState("");

  function add(raw) {
    const value = raw.trim().replace(/,$/, "");
    if (!value) return;
    if (tags.some((tag) => tag.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...tags, value]);
    setDraft("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  const available = suggestions.filter((s) => !tags.some((tag) => tag.toLowerCase() === s.toLowerCase())).slice(0, 6);

  return (
    <Field label={label} htmlFor={name} error={error} hint={hint}>
      <div className={`${inputClass(error)} flex flex-wrap items-center gap-1.5 !py-1.5`}>
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-indigo-50 py-0.5 pl-2 pr-1 text-xs font-medium text-indigo-700">
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="rounded text-indigo-400 hover:text-indigo-700"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </span>
        ))}
        <input
          id={name}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => add(draft)}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="min-w-[8rem] flex-1 border-0 p-0 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-0"
        />
      </div>
      {available.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {available.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-md border border-dashed border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:border-indigo-400 hover:text-indigo-600"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </Field>
  );
}
