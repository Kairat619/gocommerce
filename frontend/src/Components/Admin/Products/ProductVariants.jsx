import { useRef, useState } from "react";
import FormCard from "../Form/FormCard";
import { inputClass } from "../Form/Field";
import { buildCombinations, emptyVariant, slugify } from "./productFormState";

function combinationName(options) {
  return Object.values(options).join(" / ");
}

function optionsKey(options) {
  return Object.entries(options)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name}=${value}`)
    .join("|");
}

function VariantImage({ url, onChange }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  async function upload(file) {
    if (!file) return;
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/admin/uploads", { method: "POST", body });
      const payload = await response.json().catch(() => ({}));
      if (response.ok && payload.url) onChange(payload.url);
      else window.alert(payload.error || "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        title={url ? "Replace variant image" : "Add variant image"}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-gray-300 bg-gray-50 text-gray-400 hover:border-indigo-400"
      >
        {busy ? (
          <span className="text-[10px]">…</span>
        ) : url ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        )}
      </button>
      {url && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Remove variant image"
          className="absolute -right-1.5 -top-1.5 rounded-full bg-white p-0.5 text-gray-400 shadow ring-1 ring-gray-200 hover:text-red-600"
        >
          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          upload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export default function ProductVariants({ form, setField, errors, attributes, currency = "USD" }) {
  const variantAttributes = attributes.filter((attribute) => attribute.is_variant && attribute.options.length > 0);
  const [selections, setSelections] = useState({});

  const variants = form.variants;
  const existingKeys = new Set(variants.map((variant) => optionsKey(variant.options || {})));

  function toggleValue(attribute, value) {
    setSelections((current) => {
      const values = current[attribute.id] || [];
      return {
        ...current,
        [attribute.id]: values.includes(value) ? values.filter((v) => v !== value) : [...values, value],
      };
    });
  }

  function generate() {
    const combinations = buildCombinations(
      variantAttributes
        .map((attribute) => ({ name: attribute.name, values: selections[attribute.id] || [] }))
        .filter((selection) => selection.values.length > 0),
    );

    const created = [];
    combinations.forEach((combination) => {
      const options = Object.fromEntries(combination.map((part) => [part.name, part.value]));
      if (existingKeys.has(optionsKey(options))) return;

      const suffix = combination.map((part) => slugify(part.value).toUpperCase()).join("-");
      created.push(
        emptyVariant({
          name: combinationName(options),
          options,
          price: form.price,
          sku: form.sku ? `${form.sku}-${suffix}` : "",
          stock_quantity: "0",
        }),
      );
    });

    if (created.length === 0) return;
    setField("variants", [...variants, ...created]);
    setSelections({});
  }

  function updateVariant(index, patch) {
    setField(
      "variants",
      variants.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)),
    );
  }

  function applyBasePrice() {
    setField("variants", variants.map((variant) => ({ ...variant, price: form.price })));
  }

  const pendingCount = buildCombinations(
    variantAttributes
      .map((attribute) => ({ name: attribute.name, values: selections[attribute.id] || [] }))
      .filter((selection) => selection.values.length > 0),
  ).length;

  return (
    <FormCard
      title="Variants"
      description="Sell the same product in several sizes, colours or materials."
      actions={
        variants.length > 0 && (
          <button type="button" onClick={applyBasePrice} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Apply base price to all
          </button>
        )
      }
    >
      {variantAttributes.length === 0 ? (
        <p className="text-sm text-gray-500">
          No variant attributes are available yet. Create an attribute in the Attributes section above and tick “Can be
          used to build variants”.
        </p>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-700">Build combinations</p>
          <p className="mt-0.5 text-xs text-gray-500">Pick the values you sell, then generate one row per combination.</p>

          <div className="mt-3 space-y-3">
            {variantAttributes.map((attribute) => (
              <div key={attribute.id}>
                <p className="mb-1.5 text-xs font-medium text-gray-600">{attribute.name}</p>
                <div className="flex flex-wrap gap-1.5">
                  {attribute.options.map((option) => {
                    const active = (selections[attribute.id] || []).includes(option.value);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => toggleValue(attribute, option.value)}
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                          active
                            ? "border-indigo-500 bg-indigo-600 text-white"
                            : "border-gray-300 bg-white text-gray-700 hover:border-indigo-400"
                        }`}
                      >
                        {option.value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={generate}
            disabled={pendingCount === 0}
            className="mt-4 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
          >
            {pendingCount > 0 ? `Generate ${pendingCount} combination${pendingCount === 1 ? "" : "s"}` : "Generate variants"}
          </button>
        </div>
      )}

      {variants.length > 0 && (
        <div className="mt-5 -mx-5 overflow-x-auto sm:-mx-6">
          <table className="min-w-full px-5 text-sm sm:px-6">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-5 py-2 sm:px-6">Variant</th>
                <th className="px-2 py-2">SKU</th>
                <th className="px-2 py-2">Price</th>
                <th className="px-2 py-2">Stock</th>
                <th className="px-2 py-2">Barcode</th>
                <th className="px-2 py-2">Weight</th>
                <th className="px-2 py-2">Active</th>
                <th className="px-5 py-2 sm:px-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {variants.map((variant, index) => (
                <tr key={variant.key} className="align-top">
                  <td className="px-5 py-3 sm:px-6">
                    <div className="flex items-start gap-2">
                      <VariantImage url={variant.image_url} onChange={(url) => updateVariant(index, { image_url: url })} />
                      <div className="min-w-[9rem]">
                        <input
                          value={variant.name}
                          onChange={(e) => updateVariant(index, { name: e.target.value })}
                          placeholder="Variant name"
                          aria-label="Variant name"
                          className={`${inputClass(errors[`variants.${index}.name`])} !py-1.5`}
                        />
                        {errors[`variants.${index}.name`] && (
                          <p className="mt-1 text-xs text-red-600">{errors[`variants.${index}.name`]}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <input
                      value={variant.sku}
                      onChange={(e) => updateVariant(index, { sku: e.target.value })}
                      aria-label="Variant SKU"
                      className={`${inputClass(errors[`variants.${index}.sku`])} !py-1.5 min-w-[7rem]`}
                    />
                    {errors[`variants.${index}.sku`] && (
                      <p className="mt-1 text-xs text-red-600">{errors[`variants.${index}.sku`]}</p>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <input
                      value={variant.price}
                      inputMode="decimal"
                      onChange={(e) => updateVariant(index, { price: e.target.value })}
                      aria-label={`Variant price in ${currency}`}
                      className={`${inputClass(errors[`variants.${index}.price`])} !py-1.5 w-24`}
                    />
                    {errors[`variants.${index}.price`] && (
                      <p className="mt-1 text-xs text-red-600">{errors[`variants.${index}.price`]}</p>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <input
                      value={variant.stock_quantity}
                      inputMode="numeric"
                      onChange={(e) => updateVariant(index, { stock_quantity: e.target.value })}
                      aria-label="Variant stock"
                      className={`${inputClass(errors[`variants.${index}.stock_quantity`])} !py-1.5 w-20`}
                    />
                    {errors[`variants.${index}.stock_quantity`] && (
                      <p className="mt-1 text-xs text-red-600">{errors[`variants.${index}.stock_quantity`]}</p>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <input
                      value={variant.barcode}
                      onChange={(e) => updateVariant(index, { barcode: e.target.value })}
                      aria-label="Variant barcode"
                      className={`${inputClass(false)} !py-1.5 min-w-[7rem]`}
                    />
                  </td>
                  <td className="px-2 py-3">
                    <input
                      value={variant.weight}
                      inputMode="decimal"
                      onChange={(e) => updateVariant(index, { weight: e.target.value })}
                      aria-label="Variant weight"
                      className={`${inputClass(errors[`variants.${index}.weight`])} !py-1.5 w-20`}
                    />
                  </td>
                  <td className="px-2 py-3">
                    <input
                      type="checkbox"
                      checked={variant.is_active}
                      onChange={(e) => updateVariant(index, { is_active: e.target.checked })}
                      aria-label="Variant is active"
                      className="mt-2 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-5 py-3 text-right sm:px-6">
                    <button
                      type="button"
                      onClick={() => setField("variants", variants.filter((_, i) => i !== index))}
                      aria-label="Remove variant"
                      className="mt-1 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        type="button"
        onClick={() => setField("variants", [...variants, emptyVariant({ price: form.price })])}
        className="mt-4 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-600"
      >
        + Add variant manually
      </button>
    </FormCard>
  );
}
