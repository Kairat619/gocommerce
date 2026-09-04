import { Head } from "@inertiajs/react";
import StoreLayout from "../../Components/StoreLayout";
import Button from "../../Components/UI/Button";
import OrderStatus from "../../Components/Commerce/OrderStatus";
import { formatMoney } from "../../lib/money";
import { pageTitle } from "../../lib/brand";

/** @param {import('../../types/pages').CheckoutConfirmationProps} props */
export default function CheckoutConfirmation({ order }) {
  return (
    <StoreLayout>
      <Head title={pageTitle("Order Confirmed")} />

      <div className="mx-auto max-w-2xl py-12 text-center">
        <div className="mb-8 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft">
            <svg
              className="h-8 w-8 text-ink"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
        </div>

        <p className="text-label-lg font-semibold uppercase tracking-[0.2em] text-accent">
          Order Confirmed
        </p>
        <h1 className="mt-4 text-display-md text-ink">
          Thank you for your order
        </h1>
        <p className="mt-4 text-body-md text-muted-foreground">
          Your order has been placed and is being processed. A confirmation is
          on its way to you.
        </p>

        <div className="mt-10 border border-ink/10 bg-white p-6 text-left">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-4">
            <h2 className="text-label-lg font-semibold uppercase tracking-[0.1em] text-ink">
              Order Details
            </h2>
            <OrderStatus status={order.status} size="lg" />
          </div>

          <dl className="grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-label-sm uppercase tracking-[0.12em] text-outline">
                Order ID
              </dt>
              <dd className="mt-1 break-all font-mono text-body-sm text-ink">
                {order.id}
              </dd>
            </div>
            <div>
              <dt className="text-label-sm uppercase tracking-[0.12em] text-outline">
                Date
              </dt>
              <dd className="mt-1 text-body-sm text-ink">{order.created_at}</dd>
            </div>
            <div>
              <dt className="text-label-sm uppercase tracking-[0.12em] text-outline">
                Shipping To
              </dt>
              <dd className="mt-1 text-body-sm text-ink">
                {order.shipping_name}
              </dd>
              <dd className="text-body-sm text-muted-foreground">
                {order.shipping_address}
              </dd>
              <dd className="text-body-sm text-muted-foreground">
                {order.shipping_city}, {order.shipping_state}{" "}
                {order.shipping_postal_code}
              </dd>
            </div>
            <div>
              <dt className="text-label-sm uppercase tracking-[0.12em] text-outline">
                Total
              </dt>
              <dd className="mt-1 text-headline-md font-semibold text-ink">
                {formatMoney(order.total)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <Button
            href={`/account/orders/${order.id}`}
            variant="primary"
            size="lg"
          >
            View Order
          </Button>
          <Button href="/products" variant="outline" size="lg">
            Continue Shopping
          </Button>
        </div>
      </div>
    </StoreLayout>
  );
}
