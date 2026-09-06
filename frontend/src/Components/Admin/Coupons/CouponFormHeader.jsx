import { Link } from "@inertiajs/react";

export default function CouponFormHeader({ isEdit, coupon }) {
  const usedCount = coupon?.used_count ?? 0;

  return (
    <div className="mb-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-gray-500">
        <Link href="/admin" className="hover:text-gray-700">
          Admin
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/admin/coupons" className="hover:text-gray-700">
          Coupons
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate font-medium text-gray-900">{isEdit ? coupon?.code : "New coupon"}</span>
      </nav>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold text-gray-900">
            {isEdit ? (
              <span className="font-mono tracking-[0.08em]">{coupon?.code}</span>
            ) : (
              "Create a new coupon"
            )}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {isEdit ? (
              <>
                Redeemed {usedCount} time{usedCount === 1 ? "" : "s"}
                {coupon?.description ? ` · ${coupon.description}` : ""}
              </>
            ) : (
              "Set the code, what it discounts, and when it can be used."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
