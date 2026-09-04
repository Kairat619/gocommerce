import { usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";

/**
 * The single flash renderer. Mounted by StoreLayout, AdminLayout and
 * AuthLayout — never by a page, or the message appears twice.
 *
 * Successes auto-dismiss; ERRORS DO NOT. An error you did not read is an error
 * you cannot act on, and several of them are the only feedback a form gives:
 * checkout validation, for instance, comes back as a flash rather than as field
 * errors (see API_CONTRACT.md, POST /checkout). Those must stay on screen until
 * the shopper dismisses them.
 */
const SUCCESS_TIMEOUT_MS = 5000;

export default function FlashMessage() {
  const { flash } = usePage().props;
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!flash?.success && !flash?.error) return undefined;

    setMessage(flash);

    if (flash.error) return undefined;

    const timer = setTimeout(() => setMessage(null), SUCCESS_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [flash]);

  useEffect(() => {
    if (!message) return undefined;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setMessage(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [message]);

  if (!message) return null;

  const isSuccess = Boolean(message.success);
  const text = message.success || message.error;

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      aria-live={isSuccess ? "polite" : "assertive"}
      className={`fixed bottom-4 right-4 z-50 max-w-sm animate-slide-up border-l-4 bg-white p-4 shadow-lg ${
        isSuccess ? "border-green-600" : "border-red-600"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {isSuccess ? (
            <svg
              className="h-5 w-5 text-green-600"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5 text-red-600"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <p
          className={`flex-1 text-body-sm font-medium ${
            isSuccess ? "text-green-800" : "text-red-800"
          }`}
        >
          {text}
        </p>
        <button
          type="button"
          onClick={() => setMessage(null)}
          aria-label="Dismiss message"
          className="flex-shrink-0 text-outline transition-colors hover:text-ink"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
