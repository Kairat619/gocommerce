import { Head } from "@inertiajs/react";

import AdminLayout from "../../../Layouts/AdminLayout";
import OrderFilters from "../../../Components/Admin/Orders/OrderFilters";
import OrdersTable from "../../../Components/Admin/Orders/OrdersTable";
import Pagination from "../../../Components/Pagination";

export default function AdminOrdersIndex({
  orders = [],
  filters = {},
  status_counts = {},
  page_sizes = [],
  filters_active = false,
  pagination = {},
  currency = "USD",
}) {
  const paginationParams = {};
  if (filters.q) paginationParams.q = filters.q;
  if (filters.status) paginationParams.status = filters.status;
  if (filters.range) paginationParams.range = filters.range;
  if (filters.sort && filters.sort !== "newest") paginationParams.sort = filters.sort;
  if (filters.limit && filters.limit !== 20) paginationParams.limit = String(filters.limit);

  return (
    <AdminLayout title="Orders">
      <Head title="Orders" />

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Orders</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Every order placed in the store, newest first.
        </p>
      </div>

      <OrderFilters
        filters={filters}
        statusCounts={status_counts}
        pageSizes={page_sizes}
        active={filters_active}
        total={pagination.count ?? 0}
      />

      {orders.length === 0 ? (
        <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-200">
          <p className="text-sm font-medium text-gray-700">
            {filters_active ? "No orders match these filters" : "No orders yet"}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            {filters_active
              ? "Try a broader date range, a different status, or clear the filters."
              : "Orders placed in the storefront will appear here."}
          </p>
        </div>
      ) : (
        <>
          <OrdersTable orders={orders} currency={currency} />
          {/* Pagination rebuilds the query string from scratch, so the active
              filters have to be handed to it or page 2 of a filtered list
              silently shows page 2 of everything. */}
          <Pagination pagination={pagination} searchParams={paginationParams} />
        </>
      )}
    </AdminLayout>
  );
}
