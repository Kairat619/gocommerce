import { Head } from "@inertiajs/react";

import AdminLayout from "../../../Layouts/AdminLayout";
import OrderAddresses from "../../../Components/Admin/Orders/OrderAddresses";
import OrderCustomerCard from "../../../Components/Admin/Orders/OrderCustomerCard";
import OrderHeader from "../../../Components/Admin/Orders/OrderHeader";
import OrderItems from "../../../Components/Admin/Orders/OrderItems";
import OrderStatusActions from "../../../Components/Admin/Orders/OrderStatusActions";
import OrderTimeline from "../../../Components/Admin/Orders/OrderTimeline";
import OrderTotals from "../../../Components/Admin/Orders/OrderTotals";
import { shortOrderId } from "../../../lib/order";

export default function AdminOrdersShow({
  order,
  items = [],
  activity = [],
  customer,
  next_statuses = [],
  currency = "USD",
}) {
  return (
    <AdminLayout title="Order">
      <Head title={`Order #${shortOrderId(order.id)}`} />

      <OrderHeader order={order} itemCount={items.length} currency={currency} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <OrderItems items={items} currency={currency} />
          <OrderTotals order={order} currency={currency} />
          <OrderTimeline activity={activity} orderId={order.id} />
        </div>

        <div className="space-y-6">
          <div className="space-y-6 lg:sticky lg:top-20">
            <OrderStatusActions order={order} nextStatuses={next_statuses} />
            <OrderCustomerCard customer={customer} currency={currency} />
            <OrderAddresses order={order} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
