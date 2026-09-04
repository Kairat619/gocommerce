import { Head, Link } from "@inertiajs/react";
import StoreLayout from "../../Components/StoreLayout";
import OrderStatus from "../../Components/Commerce/OrderStatus";
import { formatMoney, hasAmount } from "../../lib/money";
import { shortOrderId } from "../../lib/order";
import { asList } from "../../lib/props";
import { pageTitle } from "../../lib/brand";

/** @param {import('../../types/pages').AccountOrderShowProps} props */
export default function AccountOrderShow({ order, items }) {
  const lines = asList(items);

  return (
    <StoreLayout>
      <Head title={pageTitle(`Order #${shortOrderId(order.id)}`)} />

      <div className="mx-auto max-w-4xl">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-display-md text-ink">Order Details</h1>
          <Link
            href="/account/orders"
            className="text-label-sm font-semibold uppercase tracking-[0.1em] text-outline transition-colors hover:text-accent"
          >
            &larr; Back to Orders
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="border border-ink/10 bg-white p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-label-lg font-semibold uppercase tracking-[0.1em] text-ink">
                  Order Info
                </h2>
                <OrderStatus status={order.status} size="lg" />
              </div>
              <dl className="grid gap-5 sm:grid-cols-2">
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
                  <dd className="mt-1 text-body-sm text-ink">
                    {order.created_at}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="border border-ink/10 bg-white p-6">
              <h2 className="mb-5 text-label-lg font-semibold uppercase tracking-[0.1em] text-ink">
                Items
              </h2>
              <ul className="divide-y divide-ink/10 border-y border-ink/10">
                {lines.map((item) => (
                  <li key={item.id} className="flex gap-4 py-4">
                    <Link
                      href={`/products/${item.product_slug}`}
                      className="h-16 w-16 flex-shrink-0 overflow-hidden bg-surface-container"
                    >
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-outline">
                          <svg
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
                            />
                          </svg>
                        </div>
                      )}
                    </Link>
                    <div className="flex-1">
                      <Link
                        href={`/products/${item.product_slug}`}
                        className="font-serif text-body-md text-ink transition-colors hover:text-accent"
                      >
                        {item.product_name}
                      </Link>
                      {item.variant_name && (
                        <p className="mt-0.5 text-label-sm text-outline">
                          {item.variant_name}
                        </p>
                      )}
                      <p className="mt-1 text-body-sm text-muted-foreground">
                        Qty: {item.quantity} &times;{" "}
                        {formatMoney(item.unit_price)}
                      </p>
                    </div>
                    <p className="whitespace-nowrap text-body-md font-semibold text-ink">
                      {formatMoney(item.total)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <section className="border border-ink/10 bg-white p-6">
                <h2 className="mb-5 text-label-lg font-semibold uppercase tracking-[0.1em] text-ink">
                  Summary
                </h2>
                <dl className="space-y-2.5 text-body-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="font-medium text-ink">
                      {formatMoney(order.subtotal)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Tax</dt>
                    <dd className="font-medium text-ink">
                      {formatMoney(order.tax)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Shipping</dt>
                    <dd className="font-medium text-ink">
                      {hasAmount(order.shipping_cost) ? (
                        formatMoney(order.shipping_cost)
                      ) : (
                        <span className="text-green-700">Free</span>
                      )}
                    </dd>
                  </div>
                  {hasAmount(order.discount) && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Discount</dt>
                      <dd className="font-medium text-green-700">
                        &minus;{formatMoney(order.discount)}
                      </dd>
                    </div>
                  )}
                </dl>
                <div className="mt-5 flex items-baseline justify-between border-t border-ink/10 pt-4">
                  <span className="text-label-lg font-semibold uppercase tracking-[0.1em] text-ink">
                    Total
                  </span>
                  <span className="text-headline-md font-semibold text-ink">
                    {formatMoney(order.total)}
                  </span>
                </div>
              </section>

              <section className="border border-ink/10 bg-white p-6">
                <h2 className="mb-5 text-label-lg font-semibold uppercase tracking-[0.1em] text-ink">
                  Shipping
                </h2>
                <div className="text-body-sm text-muted-foreground">
                  <p className="text-ink">{order.shipping_name}</p>
                  <p className="mt-1">{order.shipping_address}</p>
                  <p>
                    {order.shipping_city}, {order.shipping_state}{" "}
                    {order.shipping_postal_code}
                  </p>
                  <p>{order.shipping_country}</p>
                </div>
              </section>

              {order.notes && (
                <section className="border border-ink/10 bg-white p-6">
                  <h2 className="mb-3 text-label-lg font-semibold uppercase tracking-[0.1em] text-ink">
                    Notes
                  </h2>
                  <p className="text-body-sm text-muted-foreground">
                    {order.notes}
                  </p>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
