import { Head, Link } from "@inertiajs/react";
import StoreLayout from "../../Components/StoreLayout";

export default function CheckoutConfirmation({ order }) {
  return (
    <StoreLayout>
      <Head title="Order Confirmed" />

      <div className="mx-auto max-w-2xl py-12 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Thank you for your order!
        </h1>
        <p className="mb-8 text-gray-500">
          Your order has been placed and is being processed.
        </p>

        <div className="rounded-xl border border-gray-200 bg-white p-6 text-left">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Order Details
            </h2>
            <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800 capitalize">
              {order.status}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Order ID</dt>
              <dd className="font-mono text-xs text-gray-900">{order.id}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Date</dt>
              <dd className="text-gray-900">{order.created_at}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Shipping To</dt>
              <dd className="text-gray-900">{order.shipping_name}</dd>
              <dd className="text-gray-500">{order.shipping_address}</dd>
              <dd className="text-gray-500">
                {order.shipping_city}, {order.shipping_state}{" "}
                {order.shipping_postal_code}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Total</dt>
              <dd className="text-lg font-bold text-gray-900">
                ${order.total}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <Link
            href={`/account/orders/${order.id}`}
            className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            View Order
          </Link>
          <Link
            href="/products"
            className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </StoreLayout>
  );
}
