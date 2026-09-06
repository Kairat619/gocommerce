import { Link } from "@inertiajs/react";
import { typeInfo } from "./attributeFormState";

export default function AttributeFormHeader({ isEdit, attribute }) {
  const productCount = attribute?.product_count ?? 0;

  return (
    <div className="mb-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-gray-500">
        <Link href="/admin" className="hover:text-gray-700">
          Admin
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/admin/attributes" className="hover:text-gray-700">
          Attributes
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate font-medium text-gray-900">
          {isEdit ? attribute?.name : "New attribute"}
        </span>
      </nav>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? attribute?.name : "Create a new attribute"}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {isEdit ? (
              <>
                <span className="font-mono text-xs">{attribute?.code}</span> ·{" "}
                {typeInfo(attribute?.type).label}
                {productCount > 0 && (
                  <>
                    {" "}
                    · on {productCount} product{productCount === 1 ? "" : "s"}
                  </>
                )}
              </>
            ) : (
              "Describe a property products share — its type, and the values it can take."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
