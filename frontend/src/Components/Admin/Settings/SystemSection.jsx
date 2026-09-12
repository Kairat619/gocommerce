import FormCard from "../Form/FormCard";
import SettingsWarning from "./SettingsWarning";

/**
 * Deployment status. Read only, deliberately and permanently.
 *
 * Everything on this page comes from environment variables read by
 * internal/config: the session key, the object-storage credentials, the
 * database URL. None of it is editable here, and none of it should ever become
 * editable here.
 *
 * STATUS, NEVER VALUES.
 *
 * The rule this page exists to demonstrate is that a secret is not a setting.
 * An access key rendered as •••••••• is still an access key that was sent to a
 * browser, put in a response body and written to any log that captured it. So
 * nothing masked is shown either — the server sends only whether a thing is
 * configured, plus the handful of details that are genuinely harmless: a bucket
 * name, a public CDN URL, a database hostname with its credentials stripped.
 *
 * What that buys the administrator is the thing they actually needed: "are
 * uploads going to work, and if not, which variable is missing". Changing the
 * answer is a deployment action, and the page says which variable to set.
 */

const stateStyles = {
  configured: {
    label: "Connected",
    tone: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  warning: {
    label: "Needs attention",
    tone: "bg-amber-50 text-amber-800 ring-amber-200",
    dot: "bg-amber-500",
  },
  not_configured: {
    label: "Not configured",
    tone: "bg-gray-100 text-gray-700 ring-gray-200",
    dot: "bg-gray-400",
  },
};

export default function SystemSection({ system }) {
  if (!system) return null;

  const production = system.environment === "production";

  return (
    <>
      <FormCard
        title="Deployment"
        description="How this instance is running. Set by the environment, not by this page."
      >
        <dl className="grid gap-5 sm:grid-cols-2">
          <Detail
            label="Environment"
            value={system.environment || "unknown"}
            hint={
              production
                ? "Running in production mode."
                : "Development mode. Error detail is more verbose and the Vite dev server is expected."
            }
          />
          <Detail
            label="Application URL"
            value={system.app_url || "—"}
            hint="The base URL this deployment serves from."
          />
          <Detail
            label="Database host"
            value={system.database_host || "—"}
            hint="Host only. Credentials are never sent to the browser."
          />
          <Detail
            label="Maximum upload size"
            value={`${system.max_upload_mb} MB`}
            hint="Per file, for product imagery."
          />
        </dl>
      </FormCard>

      <div className="mt-4">
        <FormCard
          title="Services"
          description="Whether the things the admin depends on are set up."
        >
          <div className="space-y-4">
            <ServiceRow
              name="Image storage"
              state={system.storage_state}
              detail={system.storage_detail}
              extra={system.storage_public ? `Public URL: ${system.storage_public}` : null}
            />
            <ServiceRow
              name="Session security"
              state={system.session_state}
              detail={system.session_detail}
              extra={`Login attempts are rate limited to ${system.login_rate_limit} per window.`}
            />
          </div>

          <div className="mt-5">
            <SettingsWarning title="Credentials live in the environment, not in the database">
              Session keys, storage credentials and the database URL are read
              from environment variables and are never editable from the admin,
              never stored as settings, and never written to the settings audit
              trail. To change one, update the deployment’s environment and
              restart.
            </SettingsWarning>
          </div>
        </FormCard>
      </div>
    </>
  );
}

function Detail({ label, value, hint }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-medium text-gray-900">{value}</dd>
      {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function ServiceRow({ name, state, detail, extra }) {
  const style = stateStyles[state] || stateStyles.not_configured;

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg bg-gray-50 p-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900">{name}</p>
        <p className="mt-0.5 text-sm text-gray-600">{detail}</p>
        {extra && <p className="mt-1 break-words text-xs text-gray-500">{extra}</p>}
      </div>

      {/* The word carries the status; the dot and tint only reinforce it. */}
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${style.tone}`}
      >
        <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
        {style.label}
      </span>
    </div>
  );
}
