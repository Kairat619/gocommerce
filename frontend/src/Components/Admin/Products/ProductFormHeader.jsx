import { Link } from "@inertiajs/react";

export default function ProductFormHeader({ isEdit, product }) {
  return (
    <div className="mb-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-gray-500">
        <Link href="/admin" className="hover:text-gray-700">
          Admin
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/admin/products" className="hover:text-gray-700">
          Products
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate font-medium text-gray-900">{isEdit ? product?.name : "New product"}</span>
      </nav>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{isEdit ? product?.name : "Create a new product"}</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {isEdit
              ? "Update the details, media, inventory and search settings for this product."
              : "Add the details, media, inventory and search settings for this product."}
          </p>
        </div>

        {isEdit && product?.slug && (
          <a
            href={`/products/${product.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            View in store
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 3a1 1 0 100 2h1.586l-5.293 5.293a1 1 0 101.414 1.414L15 6.414V8a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
