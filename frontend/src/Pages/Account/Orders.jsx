import { Head, Link } from "@inertiajs/react";
import StoreLayout from "../../Components/StoreLayout";
import Pagination from "../../Components/Pagination";
import Button from "../../Components/UI/Button";
import EmptyState from "../../Components/UI/EmptyState";
import OrderStatus from "../../Components/Commerce/OrderStatus";
import { formatMoney } from "../../lib/money";
import { shortOrderId } from "../../lib/order";
import { asList, asPagination } from "../../lib/props";
import { pageTitle } from "../../lib/brand";

/** @param {import('../../types/pages').AccountOrdersProps} props */
export default function AccountOrders({ orders, pagination }) {
  const rows = asList(orders);
  const pages = asPagination(pagination);

  return (
    <StoreLayout>
      <Head title={pageTitle("Order History")} />

      <div className="mx-auto max-w-4xl">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-display-md text-ink">Order History</h1>
          <Link
            href="/account"
            className="text-label-sm font-semibold uppercase tracking-[0.1em] text-outline transition-colors hover:text-accent"
          >
            &larr; Back to Account
          </Link>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="When you place an order it will appear here."
          >
            <Button href="/products" variant="primary" size="md">
              Start Shopping
            </Button>
          </EmptyState>
        ) : (
          <ul className="divide-y divide-ink/10 border-y border-ink/10">
            {rows.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="group flex flex-col gap-4 py-6 transition-colors sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-mono text-body-sm text-outline">
                        #{shortOrderId(order.id)}
                      </p>
                      <OrderStatus status={order.status} size="md" />
                    </div>
                    <p className="mt-1.5 text-body-sm text-muted-foreground">
                      {order.created_at}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-headline-md font-semibold text-ink">
                      {formatMoney(order.total)}
                    </p>
                    <span className="text-outline transition-transform duration-200 group-hover:translate-x-1">
                      &rarr;
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Pagination pagination={pages} />
      </div>
    </StoreLayout>
  );
}
