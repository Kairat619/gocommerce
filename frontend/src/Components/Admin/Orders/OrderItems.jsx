import FormCard from "../Form/FormCard";
import ProductThumb from "../Collections/ProductThumb";
import { formatMoney } from "../../../lib/money";

/**
 * What was bought.
 *
 * `product_name` and `unit_price` come from order_items — the historical record
 * of what was sold and for how much. They are never replaced with the product's
 * current name or price, so renaming or repricing a product cannot rewrite an
 * old order.
 *
 * The thumbnail and SKU are the exception: the order never captured them, so
 * they are read from the product as it is now, and the card says so.
 */
export default function OrderItems({ items = [], currency }) {
  const unitsTotal = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <FormCard
      title="Items"
      description={`${items.length} line${items.length === 1 ? "" : "s"} · ${unitsTotal} unit${unitsTotal === 1 ? "" : "s"}`}
    >
      <ul className="divide-y divide-gray-200">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <ProductThumb product={{ image_url: item.product_image_url }} size="h-12 w-12" />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">{item.product_name}</p>

              {item.variant_name && <p className="text-xs text-gray-600">{item.variant_name}</p>}

              <p className="mt-0.5 text-xs text-gray-500">
                {item.product_sku && <span className="font-mono">{item.product_sku}</span>}
                {item.product_sku && " · "}
                {item.quantity} × {formatMoney(item.unit_price, currency)}
              </p>

              {!item.product_slug && (
                <p className="mt-0.5 text-xs text-amber-600">
                  This product has since been removed from the catalogue.
                </p>
              )}
            </div>

            <p className="flex-shrink-0 text-sm font-medium text-gray-900">
              {formatMoney(item.total, currency)}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-3 border-t border-gray-200 pt-3 text-xs text-gray-500">
        Names and prices are as recorded when the order was placed. Product images and SKUs show
        the catalogue's current values.
      </p>
    </FormCard>
  );
}
