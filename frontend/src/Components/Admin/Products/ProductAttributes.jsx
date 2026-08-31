import { useState } from "react";
import FormCard from "../Form/FormCard";
import { inputClass } from "../Form/Field";

function newRow() {
  return { key: `a${Math.random().toString(36).slice(2, 10)}`, attribute_id: "", option_id: "", value: "" };
}

function AttributeValueInput({ attribute, row, update, onAddOption, error }) {
  if (!attribute) {
    return <input disabled placeholder="Choose an attribute first" className={inputClass(false)} />;
  }

  switch (attribute.type) {
    case "select":
      return (
        <div className="flex gap-2">
          <select
            value={row.option_id || ""}
            onChange={(e) => update({ option_id: e.target.value, value: "" })}
            className={inputClass(error)}
          >
            <option value="">Select a value</option>
            {attribute.options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.value}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onAddOption}
            title={`Add a new ${attribute.name} value`}
            className="flex-shrink-0 rounded-lg border border-gray-300 px-2.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            +
          </button>
        </div>
      );

    case "multiselect": {
      const selected = row.value ? row.value.split(",").map((part) => part.trim()) : [];
      return (
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-gray-300 p-2">
          {attribute.options.map((option) => {
            const active = selected.includes(option.value);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() =>
                  update({
                    option_id: "",
                    value: (active ? selected.filter((v) => v !== option.value) : [...selected, option.value]).join(", "),
                  })
                }
                className={`rounded-md px-2 py-1 text-xs font-medium ${
                  active ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {option.value}
              </button>
            );
          })}
          {attribute.options.length === 0 && <span className="text-xs text-gray-500">No values defined yet.</span>}
        </div>
      );
    }

    case "boolean":
      return (
        <select value={row.value} onChange={(e) => update({ value: e.target.value })} className={inputClass(error)}>
          <option value="">Not set</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      );

    case "textarea":
      return (
        <textarea
          rows={2}
          value={row.value}
          onChange={(e) => update({ value: e.target.value })}
          className={inputClass(error)}
          placeholder={`Enter ${attribute.name.toLowerCase()}`}
        />
      );

    default:
      return (
        <input
          type={attribute.type === "number" ? "number" : "text"}
          value={row.value}
          onChange={(e) => update({ value: e.target.value })}
          className={inputClass(error)}
          placeholder={`Enter ${attribute.name.toLowerCase()}`}
        />
      );
  }
}

export default function ProductAttributes({ form, setField, errors, attributes, onAttributeCreated }) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", type: "select", is_variant: false, options: "" });
  const [createError, setCreateError] = useState("");
  const [saving, setSaving] = useState(false);

  const rows = form.attributes;
  const used = new Set(rows.map((row) => row.attribute_id).filter(Boolean));

  function updateRow(index, patch) {
    setField(
      "attributes",
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  async function addOption(attribute, index) {
    const value = window.prompt(`New ${attribute.name} value`);
    if (!value || !value.trim()) return;

    const response = await fetch(`/admin/attributes/${attribute.id}/options`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: value.trim() }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      window.alert(payload.error || "Could not add the value.");
      return;
    }

    onAttributeCreated({ ...attribute, options: [...attribute.options, { id: payload.id, value: payload.value }] });
    updateRow(index, { option_id: payload.id, value: "" });
  }

  async function createAttribute(event) {
    event.preventDefault();
    setSaving(true);
    setCreateError("");

    try {
      const response = await fetch("/admin/attributes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          type: draft.type,
          is_variant: draft.is_variant,
          options: draft.options
            .split(",")
            .map((option) => option.trim())
            .filter(Boolean),
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setCreateError(payload.error || "Could not create the attribute.");
        return;
      }

      onAttributeCreated(payload);
      setField("attributes", [...rows, { ...newRow(), attribute_id: payload.id }]);
      setDraft({ name: "", type: "select", is_variant: false, options: "" });
      setCreating(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormCard
      title="Attributes"
      description="Specifications shown on the product page — material, fit, care and so on."
      actions={
        <button
          type="button"
          onClick={() => setCreating((current) => !current)}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          {creating ? "Cancel" : "New attribute"}
        </button>
      }
    >
      {creating && (
        <form onSubmit={createAttribute} className="mb-5 rounded-lg border border-indigo-200 bg-indigo-50/50 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Attribute name, e.g. Fit"
              required
              className={inputClass(false)}
            />
            <select
              value={draft.type}
              onChange={(e) => setDraft({ ...draft, type: e.target.value })}
              className={inputClass(false)}
            >
              <option value="select">Single choice</option>
              <option value="multiselect">Multiple choice</option>
              <option value="text">Text</option>
              <option value="textarea">Long text</option>
              <option value="number">Number</option>
              <option value="boolean">Yes / No</option>
            </select>
          </div>

          {(draft.type === "select" || draft.type === "multiselect") && (
            <input
              value={draft.options}
              onChange={(e) => setDraft({ ...draft, options: e.target.value })}
              placeholder="Values, comma separated — e.g. Slim, Regular, Relaxed"
              className={`${inputClass(false)} mt-3`}
            />
          )}

          <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={draft.is_variant}
              onChange={(e) => setDraft({ ...draft, is_variant: e.target.checked })}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Can be used to build variants
          </label>

          {createError && <p className="mt-2 text-sm text-red-600">{createError}</p>}

          <button
            type="submit"
            disabled={saving}
            className="mt-3 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? "Adding…" : "Add attribute"}
          </button>
        </form>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">No attributes yet. Add one to describe this product in detail.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row, index) => {
            const attribute = attributes.find((a) => a.id === row.attribute_id);
            return (
              <li key={row.key} className="grid gap-2 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto] sm:items-start">
                <select
                  value={row.attribute_id}
                  onChange={(e) => updateRow(index, { attribute_id: e.target.value, option_id: "", value: "" })}
                  className={inputClass(errors[`attributes.${index}.attribute_id`])}
                  aria-label="Attribute"
                >
                  <option value="">Select an attribute</option>
                  {attributes.map((option) => (
                    <option key={option.id} value={option.id} disabled={used.has(option.id) && option.id !== row.attribute_id}>
                      {option.name}
                    </option>
                  ))}
                </select>

                <div>
                  <AttributeValueInput
                    attribute={attribute}
                    row={row}
                    update={(patch) => updateRow(index, patch)}
                    onAddOption={() => addOption(attribute, index)}
                    error={errors[`attributes.${index}.value`]}
                  />
                  {(errors[`attributes.${index}.attribute_id`] || errors[`attributes.${index}.value`]) && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors[`attributes.${index}.attribute_id`] || errors[`attributes.${index}.value`]}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setField("attributes", rows.filter((_, i) => i !== index))}
                  aria-label="Remove attribute"
                  className="mt-1 self-start rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setField("attributes", [...rows, newRow()])}
        className="mt-4 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-600"
      >
        + Add attribute
      </button>
    </FormCard>
  );
}
