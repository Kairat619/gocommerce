import { Head, Link } from "@inertiajs/react";
import StoreLayout from "../../Components/StoreLayout";
import { formatMoney } from "../../lib/money";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AccountOrderShow({ order, items }) {
  return (
    <StoreLayout>
      <Head title={`Order #${order.id.slice(0, 8)}...`} />

      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
          <Link
            href="/account/orders"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            ← Back to Orders
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Order Info
                </h2>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize ${
                    statusColors[order.status] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {order.status}
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500">Order ID</dt>
                  <dd className="font-mono text-xs text-gray-900">
                    {order.id}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Date</dt>
                  <dd className="text-gray-900">{order.created_at}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Items
              </h2>
              <ul className="divide-y divide-gray-200">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-4 py-4">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl text-gray-300">
                          📦
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <Link
                        href={`/products/${item.product_slug}`}
                        className="text-sm font-medium text-gray-900 hover:text-indigo-600"
                      >
                        {item.product_name}
                      </Link>
                      {item.variant_name && (
                        <p className="text-xs text-gray-500">
                          {item.variant_name}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity} × {formatMoney(item.unit_price)}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatMoney(item.total)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Summary
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium">${order.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax</span>
                    <span className="font-medium">${order.tax}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shipping</span>
                    <span className="font-medium">
                      {order.shipping_cost === "0.00" ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        `$${order.shipping_cost}`
                      )}
                    </span>
                  </div>
                  {order.discount !== "0.00" && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Discount</span>
                      <span className="font-medium text-green-600">
                        -${order.discount}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 pt-2">
                    <span className="text-base font-semibold text-gray-900">
                      Total
                    </span>
                    <span className="text-base font-semibold text-gray-900">
                      ${order.total}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Shipping
                </h2>
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-900">
                    {order.shipping_name}
                  </p>
                  <p>{order.shipping_address}</p>
                  <p>
                    {order.shipping_city}, {order.shipping_state}{" "}
                    {order.shipping_postal_code}
                  </p>
                  <p>{order.shipping_country}</p>
                </div>
              </div>

              {order.notes && (
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h2 className="mb-2 text-lg font-semibold text-gray-900">
                    Notes
                  </h2>
                  <p className="text-sm text-gray-600">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
