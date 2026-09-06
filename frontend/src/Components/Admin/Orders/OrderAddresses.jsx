import FormCard from "../Form/FormCard";

function Address({ name, address, city, state, postalCode, country }) {
  return (
    <address className="text-sm not-italic text-gray-600">
      <span className="block font-medium text-gray-900">{name}</span>
      <span className="block">{address}</span>
      <span className="block">
        {[city, state].filter(Boolean).join(", ")} {postalCode}
      </span>
      <span className="block">{country}</span>
    </address>
  );
}

/**
 * Where it goes, and who is billed.
 *
 * These are the addresses the order recorded at checkout, not the customer's
 * current address book. A customer who moves house does not retroactively change
 * where an order was shipped.
 */
export default function OrderAddresses({ order }) {
  const hasBilling = Boolean(order.billing_name || order.billing_address);

  // Checkout copies shipping into billing when "same as shipping" is ticked, so
  // the two are usually identical; saying so beats printing it twice.
  const sameAsShipping =
    hasBilling &&
    order.billing_name === order.shipping_name &&
    order.billing_address === order.shipping_address &&
    order.billing_city === order.shipping_city &&
    order.billing_postal_code === order.shipping_postal_code &&
    order.billing_country === order.shipping_country;

  return (
    <FormCard title="Addresses">
      <div className="space-y-4">
        <div>
          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Shipping
          </h4>
          <Address
            name={order.shipping_name}
            address={order.shipping_address}
            city={order.shipping_city}
            state={order.shipping_state}
            postalCode={order.shipping_postal_code}
            country={order.shipping_country}
          />
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Billing
          </h4>

          {!hasBilling ? (
            <p className="text-sm text-gray-500">No billing address was recorded on this order.</p>
          ) : sameAsShipping ? (
            <p className="text-sm text-gray-500">Same as the shipping address.</p>
          ) : (
            <Address
              name={order.billing_name}
              address={order.billing_address}
              city={order.billing_city}
              state={order.billing_state}
              postalCode={order.billing_postal_code}
              country={order.billing_country}
            />
          )}
        </div>

        {order.customer_note && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Note from the customer
            </h4>
            <p className="whitespace-pre-line rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-900">
              {order.customer_note}
            </p>
          </div>
        )}
      </div>
    </FormCard>
  );
}
