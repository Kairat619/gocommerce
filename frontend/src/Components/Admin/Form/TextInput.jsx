import Field, { inputClass } from "./Field";

export default function TextInput({
  label,
  name,
  value,
  onChange,
  error,
  hint,
  required,
  type = "text",
  prefix,
  suffix,
  className = "",
  ...props
}) {
  const input = (
    <input
      id={name}
      name={name}
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={error ? "true" : undefined}
      className={`${inputClass(error)} ${prefix ? "pl-7" : ""} ${suffix ? "pr-12" : ""}`}
      {...props}
    />
  );

  return (
    <Field label={label} htmlFor={name} required={required} hint={hint} error={error} className={className}>
      {prefix || suffix ? (
        <div className="relative">
          {prefix && (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500">
              {prefix}
            </span>
          )}
          {input}
          {suffix && (
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-500">
              {suffix}
            </span>
          )}
        </div>
      ) : (
        input
      )}
    </Field>
  );
}
