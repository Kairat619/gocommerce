import { Link } from "@inertiajs/react";

import FormCard from "../Form/FormCard";
import { formatMoney } from "../../../lib/money";

/**
 * Who placed the order.
 *
 * Links through to the existing customer page rather than restating a profile
 * here — there is one customer record and this is not it.
 */
export default function OrderCustomerCard({ customer, currency }) {
  const otherOrders = Math.max(0, Number(customer.order_count || 0) - 1);

  return (
    <FormCard title="Customer">
      <div className="space-y-3 text-sm">
        <div>
          <p className="font-medium text-gray-900">{customer.name}</p>
          <a href={`mailto:${customer.email}`} className="text-indigo-600 hover:text-indigo-500">
            {customer.email}
          </a>
        </div>

        <dl className="grid grid-cols-2 gap-3 border-t border-gray-200 pt-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-500">Orders</dt>
            <dd className="mt-0.5 text-gray-900">{customer.order_count}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-500">Lifetime value</dt>
            <dd className="mt-0.5 text-gray-900">
              {formatMoney(customer.lifetime_value, currency)}
            </dd>
          </div>
        </dl>

        {otherOrders > 0 && (
          <p className="text-xs text-gray-500">
            {otherOrders} other order{otherOrders === 1 ? "" : "s"} from this customer.
          </p>
        )}

        <Link
          href={`/admin/customers/${customer.id}`}
          className="inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          View customer →
        </Link>
      </div>
    </FormCard>
  );
}
