import { router } from "@inertiajs/react";

/**
 * What one section shows when its query failed.
 *
 * The server runs the dashboard's sections concurrently and lets each fail on
 * its own; a section that errored sends no prop and names itself in
 * `section_errors`. So a broken analytics query costs the merchant that one
 * card, not the page.
 *
 * This deliberately does not show a number. The alternative — rendering zero
 * when the truth is "the query failed" — is the worse bug, because it looks
 * like an answer.
 */
export default function SectionError({ label = "This data" }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg bg-amber-50 p-4 ring-1 ring-inset ring-amber-200">
      <div className="flex items-start gap-2">
        <svg
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.8"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
        <p className="text-sm text-amber-900">
          {label} is temporarily unavailable. The rest of the dashboard is
          unaffected.
        </p>
      </div>

      <button
        type="button"
        onClick={() => router.reload({ preserveScroll: true })}
        className="rounded px-1 text-sm font-medium text-amber-900 underline underline-offset-2 hover:text-amber-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
      >
        Try again
      </button>
    </div>
  );
}
