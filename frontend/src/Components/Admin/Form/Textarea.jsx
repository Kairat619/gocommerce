import Field, { inputClass } from "./Field";

export default function Textarea({ label, name, value, onChange, error, hint, required, rows = 3, maxLength, className = "", ...props }) {
  const length = (value || "").length;

  return (
    <Field label={label} htmlFor={name} required={required} hint={hint} error={error} className={className}>
      <textarea
        id={name}
        name={name}
        rows={rows}
        maxLength={maxLength}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? "true" : undefined}
        className={inputClass(error)}
        {...props}
      />
      {maxLength && (
        <p className={`mt-1 text-right text-xs ${length > maxLength * 0.9 ? "text-amber-600" : "text-gray-400"}`}>
          {length} / {maxLength}
        </p>
      )}
    </Field>
  );
}
