import { useRef, useState } from "react";

import FormCard from "../Form/FormCard";
import { inputClass } from "../Form/Field";
import { MAX_OPTIONS, newOption, typeInfo } from "./attributeFormState";

/**
 * The fixed list of values a select/multiselect attribute draws from.
 *
 * Structured rows rather than one comma-separated field: a value is a stored
 * row that products point at, so it needs an identity, an order, and — once it
 * is in use — a warning before it is taken away.
 *
 * Rows carry their attribute_options id. Editing a row's text renames that row
 * in place on save, which is why relabelling a value never disturbs the products
 * carrying it. Only rows actually removed here are deleted.
 */
export default function AttributeValues({ type, options, setOptions, error, isEdit }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);
  const rowRefs = useRef({});

  const info = typeInfo(type);

  function update(index, value) {
    setOptions((current) => current.map((option, i) => (i === index ? { ...option, value } : option)));
  }

  function add() {
    const option = newOption();
    setOptions((current) => [...current, option]);
    // Focus the row that was just created, so adding several values in a row
    // never requires reaching for the mouse.
    requestAnimationFrame(() => rowRefs.current[option.key]?.focus());
  }

  function remove(index) {
    setOptions((current) => {
      const next = current.filter((_, i) => i !== index);
      return next.length === 0 ? [newOption()] : next;
    });
  }

  function move(from, to) {
    if (to < 0 || to >= options.length || from === to) return;
    setOptions((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  // Enter adds the next value, so a list can be typed straight through.
  function onKeyDown(event, index) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (index === options.length - 1) add();
    else rowRefs.current[options[index + 1].key]?.focus();
  }

  const inUse = options.filter((option) => (option.product_count ?? 0) > 0).length;

  return (
    <FormCard
      title="Values"
      description={`The list a merchant picks from when setting ${info.label.toLowerCase()} on a product.`}
      actions={
        <span className="text-sm text-gray-500">
          {options.filter((option) => option.value.trim()).length} / {MAX_OPTIONS}
        </span>
      }
    >
      <div className="space-y-3">
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <ol className="space-y-2">
          {options.map((option, index) => {
            const used = option.product_count ?? 0;

            return (
              <li
                key={option.key}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropIndex(index);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setDropIndex(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null) move(dragIndex, index);
                  setDragIndex(null);
                  setDropIndex(null);
                }}
                className={`flex items-center gap-2 rounded-lg ${dragIndex === index ? "opacity-40" : ""} ${
                  dropIndex === index && dragIndex !== index ? "ring-2 ring-indigo-400" : ""
                }`}
              >
                <span
                  aria-hidden="true"
                  title="Drag to reorder"
                  className="cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 4a1 1 0 112 0 1 1 0 01-2 0zm0 6a1 1 0 112 0 1 1 0 01-2 0zm0 6a1 1 0 112 0 1 1 0 01-2 0zm5-12a1 1 0 112 0 1 1 0 01-2 0zm0 6a1 1 0 112 0 1 1 0 01-2 0zm0 6a1 1 0 112 0 1 1 0 01-2 0z" />
                  </svg>
                </span>

                <span className="w-5 flex-shrink-0 text-right text-xs tabular-nums text-gray-400">
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <label htmlFor={`option-${option.key}`} className="sr-only">
                    Value {index + 1}
                  </label>
                  <input
                    id={`option-${option.key}`}
                    ref={(element) => {
                      rowRefs.current[option.key] = element;
                    }}
                    value={option.value}
                    onChange={(e) => update(index, e.target.value)}
                    onKeyDown={(e) => onKeyDown(e, index)}
                    placeholder={index === 0 ? "e.g. Black" : "Add another value"}
                    autoComplete="off"
                    maxLength={255}
                    className={inputClass(false)}
                  />
                  {used > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      Used by {used} product{used === 1 ? "" : "s"} · renaming it here updates them all
                    </p>
                  )}
                </div>

                <div className="flex flex-shrink-0 items-center">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                    aria-label={`Move value ${index + 1} up`}
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    disabled={index === options.length - 1}
                    onClick={() => move(index, index + 1)}
                    aria-label={`Move value ${index + 1} down`}
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Removing a value that products carry blanks it on those
                      // products (product_attributes.option_id is ON DELETE SET
                      // NULL), so the cost is stated before it is paid.
                      if (
                        used > 0 &&
                        !window.confirm(
                          `“${option.value}” is used by ${used} product${used === 1 ? "" : "s"}.\n\n` +
                            "Removing it clears that value on those products when you save. " +
                            "Rename it instead if you only want to relabel it.\n\nRemove anyway?",
                        )
                      ) {
                        return;
                      }
                      remove(index);
                    }}
                    aria-label={`Remove value ${index + 1}`}
                    className="ml-1 rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M8.75 1a1 1 0 00-.96.71L7.5 2.5H4.75a.75.75 0 000 1.5h10.5a.75.75 0 000-1.5H12.5l-.29-.79A1 1 0 0011.25 1h-2.5zM5.5 5.5l.54 10.13A1.75 1.75 0 007.79 17.3h4.42a1.75 1.75 0 001.75-1.67L14.5 5.5h-9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10 5a.75.75 0 01.75.75v3.5h3.5a.75.75 0 010 1.5h-3.5v3.5a.75.75 0 01-1.5 0v-3.5h-3.5a.75.75 0 010-1.5h3.5v-3.5A.75.75 0 0110 5z" />
            </svg>
            Add value
          </button>

          <p className="text-xs text-gray-500">
            Drag or use the arrows to reorder. This is the order shoppers and merchants see.
          </p>
        </div>

        {isEdit && inUse > 0 && (
          <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800">
            {inUse} value{inUse === 1 ? " is" : "s are"} already in use by products. Renaming is safe — the
            products follow the rename. Removing one clears it on those products.
          </p>
        )}
      </div>
    </FormCard>
  );
}
