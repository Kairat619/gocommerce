import FormCard from "../Form/FormCard";
import TextInput from "../Form/TextInput";

const CURRENCY_SYMBOLS = { USD: "$", EUR: "€", GBP: "£" };

function toNumber(value) {
  const parsed = Number(String(value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

export default function ProductPricing({ form, setField, errors, currency = "USD", taxRate = 0 }) {
  const symbol = CURRENCY_SYMBOLS[currency] || "";
  const price = toNumber(form.price);
  const cost = toNumber(form.cost_price);
  const compareAt = toNumber(form.compare_at_price);

  const hasMargin = price !== null && cost !== null && cost > 0 && price > 0;
  const margin = hasMargin ? ((price - cost) / price) * 100 : null;
  const profit = hasMargin ? price - cost : null;
  const discount = price !== null && compareAt !== null && compareAt > price ? ((compareAt - price) / compareAt) * 100 : null;

  return (
    <FormCard
      title="Pricing"
      description="What the customer pays, and what the product costs you."
      actions={<span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{currency}</span>}
    >
      <div className="space-y-5">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Customer-facing</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Price"
              name="price"
              required
              inputMode="decimal"
              prefix={symbol}
              value={form.price}
              onChange={(value) => setField("price", value)}
              error={errors.price}
              placeholder="0.00"
            />
            <TextInput
              label="Compare-at price"
              name="compare_at_price"
              inputMode="decimal"
              prefix={symbol}
              value={form.compare_at_price}
              onChange={(value) => setField("compare_at_price", value)}
              error={errors.compare_at_price}
              hint="The original price, shown struck through. Leave blank if not on sale."
              placeholder="0.00"
            />
          </div>

          {discount !== null && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
              On sale — {discount.toFixed(0)}% off {symbol}
              {compareAt.toFixed(2)}
            </p>
          )}
        </div>

        <div className="border-t border-gray-200 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Internal cost</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Cost per item"
              name="cost_price"
              inputMode="decimal"
              prefix={symbol}
              value={form.cost_price}
              onChange={(value) => setField("cost_price", value)}
              error={errors.cost_price}
              hint="Never shown to customers."
              placeholder="0.00"
            />
            <div className="rounded-lg bg-gray-50 px-3 py-2.5">
              <p className="text-xs font-medium text-gray-500">Margin</p>
              {margin === null ? (
                <p className="mt-1 text-sm text-gray-400">Add a price and a cost to see the margin.</p>
              ) : (
                <p className="mt-1 text-sm text-gray-900">
                  <span className="font-semibold">{margin.toFixed(1)}%</span>
                  <span className="ml-2 text-gray-500">
                    {symbol}
                    {profit.toFixed(2)} profit per item
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        <p className="border-t border-gray-200 pt-4 text-xs text-gray-500">
          Tax is applied store-wide at checkout ({(taxRate * 100).toFixed(2)}% today) — change it under{" "}
          <a href="/admin/settings" className="font-medium text-indigo-600 hover:text-indigo-500">
            Settings
          </a>
          .
        </p>
      </div>
    </FormCard>
  );
}
