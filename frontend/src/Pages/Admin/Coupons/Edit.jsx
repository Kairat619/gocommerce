import { Head } from "@inertiajs/react";
import AdminLayout from "../../../Layouts/AdminLayout";
import CouponForm from "../../../Components/Admin/Coupons/CouponForm";

export default function AdminCouponsEdit({ coupon }) {
  return (
    <AdminLayout title="Edit Coupon">
      <Head title={`Edit ${coupon.code}`} />

      <CouponForm action={`/admin/coupons/${coupon.id}`} isEdit coupon={coupon} />
    </AdminLayout>
  );
}
