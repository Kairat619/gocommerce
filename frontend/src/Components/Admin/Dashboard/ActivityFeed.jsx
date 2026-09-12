import { Link } from "@inertiajs/react";

import OrderStatus from "../../Commerce/OrderStatus";
import { shortOrderId } from "../../../lib/order";
import { relativeTime, formatDateTime } from "../Orders/orderLifecycle";
import DashboardCard from "./DashboardCard";

/**
 * What has been happening.
 *
 * Every entry is a row from `order_activity`, the application's only audit
 * trail — a real event, written at the moment it happened, with the actor's
 * name captured at write time.
 *
 * Nothing is synthesised to pad this list. There are no "product created" or
 * "customer registered" entries, tempting as they are, because those would be
 * manufactured from a `created_at` column rather than read from a recorded
 * event, and a fabricated audit trail is worse than a short one.
 *
 * The message is the one the server composed when the event occurred; it is
 * never recomposed here from the current state of the order, which would
 * rewrite history every time the order moved on.
 */

const kindIcons = {
  created: {
    tone: "bg-sky-50 text-sky-600",
    path: "M12 4.5v15m7.5-7.5h-15",
  },
  status_changed: {
    tone: "bg-indigo-50 text-indigo-600",
    path: "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5",
  },
  note: {
    tone: "bg-gray-100 text-gray-600",
    path: "M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z",
  },
  stock_restored: {
    tone: "bg-amber-50 text-amber-600",
    path: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z",
  },
};

export default function ActivityFeed({ activity = [] }) {
  return (
    <DashboardCard
      title="Recent activity"
      description="Order events from the audit trail, newest first"
      href="/admin/orders"
      actionLabel="View orders"
    >
      {activity.length === 0 ? (
        <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          Nothing has happened yet. Order events appear here as they are
          recorded.
        </p>
      ) : (
        <ol className="space-y-3">
          {activity.map((event) => {
            const icon = kindIcons[event.kind] || kindIcons.note;

            return (
              <li key={event.id} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${icon.tone}`}
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon.path} />
                  </svg>
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900">{event.message}</p>

                  <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-gray-500">
                    <Link
                      href={`/admin/orders/${event.order_id}`}
                      className="font-mono text-indigo-600 hover:text-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      #{shortOrderId(event.order_id)}
                    </Link>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{event.customer_name}</span>
                    <span aria-hidden="true">·</span>
                    {/* The exact timestamp lives in the title so "3 hours ago"
                        stays hoverable rather than merely vague. */}
                    <time
                      dateTime={event.created_at}
                      title={formatDateTime(event.created_at)}
                    >
                      {relativeTime(event.created_at)}
                    </time>
                    {/* actor_name is empty for events the customer or the
                        system caused, such as checkout. Attributing those to
                        a member of staff would be a lie in an audit trail. */}
                    {event.actor_name && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">by {event.actor_name}</span>
                      </>
                    )}
                  </p>

                  {event.to_status && (
                    <p className="mt-1 flex items-center gap-1.5">
                      {event.from_status && (
                        <>
                          <OrderStatus status={event.from_status} />
                          <span aria-hidden="true" className="text-gray-400">
                            →
                          </span>
                        </>
                      )}
                      <OrderStatus status={event.to_status} />
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </DashboardCard>
  );
}
