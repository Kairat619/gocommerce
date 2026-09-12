import { formatDateTime, relativeTime } from "../Orders/orderLifecycle";
import { SETTINGS_FIELDS } from "./settingsFields";

/**
 * Who changed what, and what it was before.
 *
 * Configuration changes used to leave no trace at all: a tax rate could move
 * between two orders with nothing recording who moved it. Every change to a
 * database-backed setting now writes a settings_activity row, and this reads it
 * back.
 *
 * NO SECRET CAN APPEAR HERE. The audit trail only ever covers the settings that
 * live in store_settings. Session keys, storage credentials and the database URL
 * are environment values, are not editable from the admin at all, and so have no
 * code path that could produce a row — see the note on settings_activity in
 * migration 010.
 *
 * Values are rendered as "was → now" because the previous value is the half
 * that makes an audit line actionable: knowing the tax rate is 8% is the
 * current state, knowing it was 5% yesterday is the incident.
 */
const fieldLabels = new Map(SETTINGS_FIELDS.map((field) => [field.key, field.label]));

export default function SettingsActivity({ activity = [], title = "Recent changes", scoped = false }) {
  return (
    <section className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      <header className="border-b border-gray-200 px-5 py-4 sm:px-6">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="mt-0.5 text-xs text-gray-500">
          {scoped
            ? "Changes made on this page."
            : "The most recent configuration changes across every section."}
        </p>
      </header>

      <div className="px-5 py-4 sm:px-6">
        {activity.length === 0 ? (
          <p className="text-sm text-gray-500">
            {scoped
              ? "Nothing on this page has been changed yet."
              : "No settings have been changed yet. Changes are recorded here from now on."}
          </p>
        ) : (
          <ol className="divide-y divide-gray-100">
            {activity.map((entry) => (
              <li key={entry.id} className="py-2.5 first:pt-0 last:pb-0">
                <p className="text-sm text-gray-900">
                  {fieldLabels.get(entry.setting_key) || entry.setting_key}
                </p>

                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                  <Value>{entry.previous_value}</Value>
                  <span aria-hidden="true" className="text-gray-400">
                    →
                  </span>
                  <span className="sr-only">changed to</span>
                  <Value emphasis>{entry.new_value}</Value>
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {/* actor_name is empty when the change could not be attributed
                      to a signed-in account. Saying so is better than naming
                      somebody who was not responsible. */}
                  {entry.actor_name ? `${entry.actor_name} · ` : "Unattributed · "}
                  <time dateTime={entry.created_at} title={formatDateTime(entry.created_at)}>
                    {relativeTime(entry.created_at)}
                  </time>
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

/** An empty string means the value was blank, which is worth showing as such. */
function Value({ children, emphasis = false }) {
  const empty = !children;
  return (
    <span
      className={`rounded px-1.5 py-0.5 font-mono ${
        empty
          ? "bg-gray-50 italic text-gray-400"
          : emphasis
          ? "bg-indigo-50 text-indigo-800"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      {empty ? "empty" : children}
    </span>
  );
}
