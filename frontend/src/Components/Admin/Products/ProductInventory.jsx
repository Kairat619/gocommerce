import FormCard from "../Form/FormCard";
import TextInput from "../Form/TextInput";
import Toggle from "../Form/Toggle";

function availability(form) {
  if (!form.track_inventory) {
    return { label: "Always available", tone: "bg-blue-50 text-blue-700", detail: "Stock is not tracked for this product." };
  }

  const quantity = Number(form.stock_quantity || 0);
  const threshold = Number(form.low_stock_threshold || 0);

  if (quantity <= 0) {
    return form.allow_backorders
      ? { label: "On backorder", tone: "bg-amber-50 text-amber-700", detail: "Out of stock, but customers can still order." }
      : { label: "Out of stock", tone: "bg-red-50 text-red-700", detail: "Customers cannot buy this product." };
  }
  if (threshold > 0 && quantity <= threshold) {
    return { label: "Low stock", tone: "bg-amber-50 text-amber-700", detail: `Only ${quantity} left — at or below your threshold of ${threshold}.` };
  }
  return { label: "In stock", tone: "bg-green-50 text-green-700", detail: `${quantity} available to sell.` };
}

export default function ProductInventory({ form, setField, errors }) {
  const status = availability(form);

  return (
    <FormCard
      title="Inventory"
      description="Stock levels feed the same inventory the storefront and checkout already use."
      actions={<span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.tone}`}>{status.label}</span>}
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextInput
            label="Stock quantity"
            name="stock_quantity"
            required
            inputMode="numeric"
            value={form.stock_quantity}
            onChange={(value) => setField("stock_quantity", value)}
            error={errors.stock_quantity}
            disabled={!form.track_inventory}
          />
          <TextInput
            label="Low stock threshold"
            name="low_stock_threshold"
            inputMode="numeric"
            value={form.low_stock_threshold}
            onChange={(value) => setField("low_stock_threshold", value)}
            error={errors.low_stock_threshold}
            hint="Flagged as low at or below this."
            disabled={!form.track_inventory}
          />
          <TextInput
            label="Barcode"
            name="barcode"
            value={form.barcode}
            onChange={(value) => setField("barcode", value)}
            error={errors.barcode}
            hint="ISBN, UPC, GTIN…"
            autoComplete="off"
          />
        </div>

        <p className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">{status.detail}</p>

        <div className="space-y-4 border-t border-gray-200 pt-4">
          <Toggle
            name="track_inventory"
            label="Track inventory"
            description="Reduce the stock count as orders come in."
            checked={form.track_inventory}
            onChange={(value) => setField("track_inventory", value)}
          />
          <Toggle
            name="allow_backorders"
            label="Allow backorders"
            description="Let customers order while the product is out of stock."
            checked={form.allow_backorders}
            onChange={(value) => setField("allow_backorders", value)}
            disabled={!form.track_inventory}
          />
        </div>
      </div>
    </FormCard>
  );
}
