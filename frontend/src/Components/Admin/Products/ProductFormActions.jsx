import { Link } from "@inertiajs/react";

export default function ProductFormActions({ isEdit, processing, errorCount, onSubmit, onSubmitAndContinue }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-8 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm" role={errorCount > 0 ? "alert" : undefined}>
          {errorCount > 0 ? (
            <span className="font-medium text-red-600">
              {errorCount} field{errorCount === 1 ? "" : "s"} need{errorCount === 1 ? "s" : ""} attention
            </span>
          ) : (
            <span className="text-gray-500">{isEdit ? "Editing product" : "New product"}</span>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/products"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={onSubmitAndContinue}
            disabled={processing}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Save &amp; continue editing
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={processing}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processing && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {processing ? "Saving…" : isEdit ? "Save changes" : "Create product"}
          </button>
        </div>
      </div>
    </div>
  );
}
