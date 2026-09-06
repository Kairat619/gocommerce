import { Head } from "@inertiajs/react";
import AdminLayout from "../../../Layouts/AdminLayout";
import CouponForm from "../../../Components/Admin/Coupons/CouponForm";

export default function AdminCouponsCreate() {
  return (
    <AdminLayout title="Create Coupon">
      <Head title="Create Coupon" />

      <CouponForm action="/admin/coupons" />
    </AdminLayout>
  );
}
