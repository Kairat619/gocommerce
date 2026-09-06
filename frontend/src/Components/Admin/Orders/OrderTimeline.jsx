import { router } from "@inertiajs/react";
import { useState } from "react";

import FormCard from "../Form/FormCard";
import { formatDateTime, relativeTime, statusLabel } from "./orderLifecycle";

const KINDS = {
  created: {
    tone: "bg-gray-100 text-gray-600",
    icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  status_changed: {
    tone: "bg-indigo-100 text-indigo-600",
    icon: "M3 8.688c0-.864.933-1.406 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688z",
  },
  stock_restored: {
    tone: "bg-green-100 text-green-700",
    icon: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m16.5 0H3.75",
  },
  note: {
    tone: "bg-amber-100 text-amber-700",
    icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z",
  },
};

/**
 * The order's history, and where staff notes are written.
 *
 * Every entry is a recorded event from the activity log — nothing here is
 * inferred. Orders placed before the log existed show their creation and then
 * nothing until their next real change, which is stated rather than papered over
 * with invented events.
 *
 * Notes live in this same chronology on purpose: a note about a delayed
 * shipment is only useful next to the shipment it concerns.
 */
export default function OrderTimeline({ activity = [], orderId }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  function submit(event) {
    event.preventDefault();
    if (!note.trim() || saving) return;

    setSaving(true);
    router.post(
      `/admin/orders/${orderId}/notes`,
      { note },
      {
        preserveScroll: true,
        onSuccess: () => setNote(""),
        onFinish: () => setSaving(false),
      },
    );
  }

  // Newest first: support staff want the latest development, not the oldest.
  const entries = [...activity].reverse();

  return (
    <FormCard
      title="History"
      description="Everything recorded against this order, newest first."
    >
      <form onSubmit={submit} className="mb-5 print:hidden">
        <label htmlFor="order-note" className="mb-1.5 block text-sm font-medium text-gray-700">
          Add an internal note
        </label>
        <textarea
          id="order-note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={2000}
          placeholder="e.g. Customer asked for delivery after 6pm."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            Visible to staff only — never shown to the customer.
          </p>
          <button
            type="submit"
            disabled={!note.trim() || saving}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add note"}
          </button>
        </div>
      </form>

      {entries.length === 0 ? (
        <p className="text-sm text-gray-500">Nothing recorded yet.</p>
      ) : (
        <ol className="space-y-4">
          {entries.map((event) => {
            const kind = KINDS[event.kind] || KINDS.created;

            return (
              <li key={event.id} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${kind.tone}`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={kind.icon} />
                  </svg>
                </span>

                <div className="min-w-0 flex-1">
                  {event.kind === "note" ? (
                    <p className="whitespace-pre-line text-sm text-gray-900">{event.message}</p>
                  ) : (
                    <p className="text-sm text-gray-900">
                      {event.kind === "status_changed" && event.from_status && event.to_status ? (
                        <>
                          Status changed from{" "}
                          <span className="font-medium">{statusLabel(event.from_status)}</span> to{" "}
                          <span className="font-medium">{statusLabel(event.to_status)}</span>.
                        </>
                      ) : (
                        event.message
                      )}
                    </p>
                  )}

                  <p className="mt-0.5 text-xs text-gray-500">
                    <time dateTime={event.created_at} title={formatDateTime(event.created_at)}>
                      {relativeTime(event.created_at)}
                    </time>
                    {" · "}
                    {event.actor_name ? event.actor_name : "System"}
                    {event.kind === "note" && " · internal note"}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </FormCard>
  );
}
