import FormCard from "../Form/FormCard";
import RadioCards from "../Form/RadioCards";
import { ATTRIBUTE_TYPES, typeInfo } from "./attributeFormState";

/**
 * The attribute's type, and the one setting on this page that cannot be undone.
 *
 * A stored product_attributes row is shaped by the type it was written under —
 * an option_id for the list types, a free-typed value for the rest — so once
 * products carry the attribute the type is locked rather than merely
 * discouraged. The server enforces this too; this is the explanation.
 */
export default function AttributeTypeSelector({ form, setField, errors, isEdit, productCount = 0 }) {
  const locked = isEdit && productCount > 0;
  const info = typeInfo(form.type);

  return (
    <FormCard
      title="Type"
      description="What kind of value this attribute holds. This decides how merchants fill it in."
    >
      <div className="space-y-4">
        <RadioCards
          name="type"
          value={form.type}
          onChange={(value) => setField("type", value)}
          error={errors.type}
          disabled={locked}
          options={ATTRIBUTE_TYPES.map((entry) => ({
            value: entry.value,
            label: entry.label,
            description: entry.description,
            disabledReason: locked
              ? "The type cannot change once products use this attribute."
              : undefined,
          }))}
        />

        <p className="text-xs text-gray-500">
          Example: <span className="font-medium text-gray-700">{info.example}</span>
        </p>

        {locked ? (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            This attribute is used by {productCount} product{productCount === 1 ? "" : "s"}, so its type is
            locked. Those products store their value in the shape this type implies — changing it would leave
            that data meaningless. Create a new attribute instead.
          </p>
        ) : (
          isEdit && (
            <p className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
              No products use this attribute yet, so the type can still change. Once one does, it is fixed.
            </p>
          )
        )}
      </div>
    </FormCard>
  );
}
