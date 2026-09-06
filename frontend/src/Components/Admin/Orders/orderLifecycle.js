/**
 * The order lifecycle, as the admin presents it.
 *
 * The transitions here mirror `allowedTransitions` in
 * internal/handler/admin_orders.go. The server is authoritative — it refuses an
 * illegal move regardless of what this file says — but the UI uses the same map
 * so it only ever offers moves that will actually be accepted.
 *
 * The server also sends `next_statuses` on the detail page, which is what the
 * action buttons actually render. This map exists for the parts of the UI that
 * need to reason about the lifecycle without a round trip: the progress track,
 * and knowing whether a status is terminal.
 */

export const ORDER_STATUSES = [
  {
    value: "pending",
    label: "Pending",
    description: "Placed, not yet acknowledged",
  },
  {
    value: "confirmed",
    label: "Confirmed",
    description: "Acknowledged and accepted",
  },
  {
    value: "processing",
    label: "Processing",
    description: "Being picked and packed",
  },
  {
    value: "shipped",
    label: "Shipped",
    description: "Handed to the carrier",
  },
  {
    value: "delivered",
    label: "Delivered",
    description: "Received by the customer",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    description: "Called off before shipping",
  },
];

/**
 * The happy path, in order. `cancelled` is deliberately absent: it is an exit
 * from the track, not a step along it.
 */
export const FULFILMENT_TRACK = ["pending", "confirmed", "processing", "shipped", "delivered"];

/** Mirrors allowedTransitions in internal/handler/admin_orders.go. */
export const TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export function statusInfo(status) {
  return ORDER_STATUSES.find((entry) => entry.value === status) || ORDER_STATUSES[0];
}

export function statusLabel(status) {
  return statusInfo(status).label;
}

/** A terminal order has nowhere left to go and shows no lifecycle actions. */
export function isTerminal(status) {
  return (TRANSITIONS[status] || []).length === 0;
}

/**
 * Where this status sits on the fulfilment track, or -1 for cancelled — which
 * has no position because it left the track.
 */
export function trackIndex(status) {
  return FULFILMENT_TRACK.indexOf(status);
}

/**
 * What a merchant needs to be told before a move is applied. Only cancellation
 * has consequences beyond the status itself.
 *
 * Stock: the checkout engine deducts inventory when the order is placed, so
 * cancelling is the point at which it comes back. That restore happens on the
 * server, inside the same transaction as the status change.
 */
export function transitionWarning(from, to) {
  if (to !== "cancelled") return null;

  return {
    title: "Cancel this order?",
    body: [
      "The order is marked cancelled and can not be reopened — cancellation is final.",
      "Every item on it is returned to stock.",
      "No money moves: this application records no payments, so any refund has to be issued in your payment provider.",
    ],
    confirm: "Cancel order",
  };
}

const RELATIVE = [
  ["year", 31536000],
  ["month", 2592000],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

/** "3 hours ago" for timestamps, falling back to the absolute date past a year. */
export function relativeTime(iso) {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "";

  const seconds = Math.floor((Date.now() - then.getTime()) / 1000);
  if (seconds < 60) return "just now";

  for (const [unit, size] of RELATIVE) {
    const value = Math.floor(seconds / size);
    if (value >= 1) return `${value} ${unit}${value === 1 ? "" : "s"} ago`;
  }
  return "just now";
}

export function formatDateTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
