import { router } from "@inertiajs/react";
import { useState } from "react";

import FormCard from "../Form/FormCard";
import OrderStatus from "../../Commerce/OrderStatus";
import { FULFILMENT_TRACK, statusLabel, trackIndex, transitionWarning } from "./orderLifecycle";

/**
 * Where the order is, and where it can go next.
 *
 * `next_statuses` comes from the server's own state machine, so the buttons here
 * are exactly the moves that will be accepted — the page never offers an action
 * that would bounce. A terminal order shows no buttons at all rather than a row
 * of disabled ones.
 */
export default function OrderStatusActions({ order, nextStatuses = [] }) {
  const [pending, setPending] = useState(null);
  const [processing, setProcessing] = useState(false);

  const current = trackIndex(order.status);
  const cancelled = order.status === "cancelled";

  function move(status) {
    const warning = transitionWarning(order.status, status);
    if (warning) {
      setPending({ status, warning });
      return;
    }
    commit(status);
  }

  function commit(status) {
    setProcessing(true);
    router.post(
      `/admin/orders/${order.id}/status`,
      { status },
      {
        preserveScroll: true,
        onFinish: () => {
          setProcessing(false);
          setPending(null);
        },
      },
    );
  }

  return (
    <FormCard title="Status">
      <div className="space-y-4">
        <div>
          <OrderStatus status={order.status} size="lg" />
        </div>

        {/* Progress along the fulfilment track. Cancelled orders left the track,
            so they get a plain statement instead of a misleading progress bar. */}
        {cancelled ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-800">
            This order was cancelled. Cancellation is final — it cannot be reopened.
          </p>
        ) : (
          <ol className="space-y-1.5">
            {FULFILMENT_TRACK.map((status, index) => {
              const done = index <= current;
              const active = index === current;

              return (
                <li key={status} className="flex items-center gap-2.5 text-sm">
                  <span
                    aria-hidden="true"
                    className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[10px] ${
                      done ? "bg-indigo-600 text-white" : "bg-gray-200 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span className={active ? "font-medium text-gray-900" : done ? "text-gray-600" : "text-gray-400"}>
                    {statusLabel(status)}
                  </span>
                  {active && <span className="text-xs text-indigo-600">current</span>}
                </li>
              );
            })}
          </ol>
        )}

        {nextStatuses.length > 0 && (
          <div className="space-y-2 border-t border-gray-200 pt-4">
            {nextStatuses.map((status) => {
              const destructive = status === "cancelled";
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => move(status)}
                  disabled={processing}
                  className={`block w-full rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 ${
                    destructive
                      ? "border border-red-300 text-red-700 hover:bg-red-50"
                      : "bg-indigo-600 text-white hover:bg-indigo-500"
                  }`}
                >
                  {destructive ? "Cancel order" : `Mark as ${statusLabel(status).toLowerCase()}`}
                </button>
              );
            })}
          </div>
        )}

        {nextStatuses.length === 0 && !cancelled && (
          <p className="border-t border-gray-200 pt-4 text-xs text-gray-500">
            This order is complete. There are no further status changes.
          </p>
        )}
      </div>

      {/* Confirmation. Cancellation restores stock and cannot be undone, so the
          consequences are spelled out rather than hidden behind a generic
          "are you sure?". */}
      {pending && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 id="cancel-title" className="text-base font-semibold text-gray-900">
              {pending.warning.title}
            </h3>

            <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
              {pending.warning.body.map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden="true" className="text-gray-400">
                    •
                  </span>
                  {line}
                </li>
              ))}
            </ul>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPending(null)}
                disabled={processing}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Keep order
              </button>
              <button
                type="button"
                onClick={() => commit(pending.status)}
                disabled={processing}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {processing ? "Cancelling…" : pending.warning.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </FormCard>
  );
}
