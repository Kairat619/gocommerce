import Field, { inputClass } from "./Field";

export default function Select({ label, name, value, onChange, options = [], error, hint, required, placeholder, className = "", ...props }) {
  return (
    <Field label={label} htmlFor={name} required={required} hint={hint} error={error} className={className}>
      <select
        id={name}
        name={name}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? "true" : undefined}
        className={inputClass(error)}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
