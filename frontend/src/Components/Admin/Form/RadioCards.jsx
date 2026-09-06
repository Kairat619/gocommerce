import Field from "./Field";

export default function RadioCards({ label, name, value, onChange, options = [], error, hint, columns = 2, disabled = false }) {
  return (
    <Field label={label} error={error} hint={hint}>
      <div className={`grid gap-2 ${columns === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
        {options.map((option) => {
          const selected = value === option.value;
          // A locked group still shows which option is set — it just cannot be
          // changed. Used by the attribute type selector, where re-typing an
          // attribute products already carry would invalidate their data.
          const locked = disabled || option.disabled;
          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
              disabled={locked}
              title={locked ? option.disabledReason : undefined}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                selected
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
              } ${locked ? "cursor-not-allowed opacity-60 hover:border-gray-300 hover:bg-white" : ""}`}
            >
              <span className="block font-medium">{option.label}</span>
              {option.description && (
                <span className={`mt-0.5 block text-xs ${selected ? "text-indigo-600" : "text-gray-500"}`}>
                  {option.description}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <input type="hidden" name={name} value={String(value)} />
    </Field>
  );
}
