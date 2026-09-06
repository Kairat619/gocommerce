import FormCard from "../Form/FormCard";
import { inputClass } from "../Form/Field";
import { hasOptions, slugify, typeInfo } from "./attributeFormState";

/**
 * How this attribute will appear on the product form, rendered from the same
 * type rules the product form itself uses. It is the quickest way to see that
 * "Single choice" means a dropdown and "Yes / No" means a checkbox, without
 * saving and navigating away.
 */
function ControlPreview({ type, values, name }) {
  const label = name || "Attribute";

  switch (type) {
    case "select":
      return (
        <select disabled className={`${inputClass(false)} pointer-events-none`}>
          <option>{values[0] || `Choose ${label.toLowerCase()}`}</option>
        </select>
      );

    case "multiselect":
      return (
        <div className="flex flex-wrap gap-1.5">
          {values.length === 0 ? (
            <span className="text-xs text-gray-400">Add values to preview the choices</span>
          ) : (
            values.slice(0, 6).map((value) => (
              <span
                key={value}
                className="rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-700"
              >
                {value}
              </span>
            ))
          )}
          {values.length > 6 && (
            <span className="px-1 py-1 text-xs text-gray-500">+{values.length - 6} more</span>
          )}
        </div>
      );

    case "textarea":
      return (
        <textarea
          disabled
          rows={2}
          placeholder={`Enter ${label.toLowerCase()}`}
          className={`${inputClass(false)} pointer-events-none`}
        />
      );

    case "boolean":
      return (
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" disabled className="rounded border-gray-300" />
          {label}
        </label>
      );

    case "number":
      return (
        <input
          disabled
          inputMode="numeric"
          placeholder="0"
          className={`${inputClass(false)} pointer-events-none`}
        />
      );

    default:
      return (
        <input
          disabled
          placeholder={`Enter ${label.toLowerCase()}`}
          className={`${inputClass(false)} pointer-events-none`}
        />
      );
  }
}

export default function AttributePreview({ form, options = [] }) {
  const info = typeInfo(form.type);
  const code = form.code ? slugify(form.code) : slugify(form.name);
  const values = options.map((option) => option.value.trim()).filter(Boolean);

  return (
    <FormCard title="Preview">
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">On the product form</p>
          <p className="mb-1.5 text-sm font-medium text-gray-700">
            {form.name.trim() || "Attribute name"}
            {form.is_required && <span className="ml-1 text-red-500">*</span>}
          </p>
          <ControlPreview type={form.type} values={values} name={form.name.trim()} />
        </div>

        <dl className="space-y-2.5 text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-xs uppercase tracking-wide text-gray-500">Code</dt>
            <dd className="truncate font-mono text-xs text-gray-600">{code || "…"}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-xs uppercase tracking-wide text-gray-500">Type</dt>
            <dd className="text-gray-900">{info.label}</dd>
          </div>
          {hasOptions(form.type) && (
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-xs uppercase tracking-wide text-gray-500">Values</dt>
              <dd className="text-gray-900">
                {values.length === 0 ? <span className="text-gray-400">None yet</span> : values.length}
              </dd>
            </div>
          )}
        </dl>

        <div className="flex flex-wrap gap-1.5 border-t border-gray-200 pt-3">
          {hasOptions(form.type) && form.is_variant && (
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
              Builds variants
            </span>
          )}
          {form.is_required && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Required (not enforced)
            </span>
          )}
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
            Specification
          </span>
        </div>
      </div>
    </FormCard>
  );
}
