import { usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";

export default function FlashMessage() {
  const { flash } = usePage().props;
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (flash?.success || flash?.error) {
      setMessage(flash);
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [flash]);

  if (!visible || !message) return null;

  const isSuccess = !!message.success;
  const text = message.success || message.error;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-sm animate-slide-up border-l-4 p-4 shadow-lg ${
        isSuccess
          ? "border-green-500 bg-white text-green-800"
          : "border-red-500 bg-white text-red-800"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {isSuccess ? (
            <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <p className="flex-1 text-sm font-medium">{text}</p>
        <button
          onClick={() => setVisible(false)}
          className="flex-shrink-0 text-outline transition-colors hover:text-ink"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
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
