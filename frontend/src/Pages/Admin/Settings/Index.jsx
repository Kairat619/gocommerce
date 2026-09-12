import { Head, Link } from "@inertiajs/react";

import AdminLayout from "../../../Layouts/AdminLayout";
import SettingsActivity from "../../../Components/Admin/Settings/SettingsActivity";
import SettingsSearch from "../../../Components/Admin/Settings/SettingsSearch";

/**
 * The configuration centre.
 *
 * A card per section rather than one long form. The settings that matter here
 * are not peers — the tax rate changes what customers are charged, the page
 * size changes a grid — and putting them in one scrolling document makes them
 * look like peers and makes one Save button responsible for all of them.
 *
 * The index earns its place by being where search lives and where the
 * store-wide audit trail is answered: "what changed recently, and who changed
 * it" is a question about the configuration as a whole, not about any one
 * section.
 *
 * The sections come from the server, generated from the single list in
 * internal/handler/admin_settings.go, so this page cannot fall out of step with
 * what actually exists.
 *
 * @param {import('../../../types/pages').AdminSettingsIndexProps} props
 */

const icons = {
  store:
    "M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72M6.75 18h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z",
  globe:
    "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418",
  tag: "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z",
  receipt:
    "M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
  server:
    "M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.923a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008zm-3 0h.008v.008h-.008v-.008z",
};

export default function AdminSettingsIndex({ sections = [], activity = [], store }) {
  return (
    <AdminLayout title="Settings">
      <Head title="Settings" />

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Configuration for {store?.name || "the store"}
            {store?.currency ? ` · prices shown in ${store.currency}` : ""}.
          </p>
        </div>
        <div className="w-full lg:max-w-xs">
          <SettingsSearch sections={sections} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ul className="grid gap-4 sm:grid-cols-2">
            {sections.map((section) => (
              <li key={section.key}>
                <Link
                  href={`/admin/settings/${section.key}`}
                  className="flex h-full flex-col rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition hover:ring-indigo-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.7"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d={icons[section.icon] || icons.store}
                        />
                      </svg>
                    </span>

                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
                        {section.label}
                        {section.editable === false && (
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
                            Read only
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Naming what is absent, and why. An administrator arriving from
              another platform will look for these, and "not here yet" is a
              better answer than a section that stores a value nothing reads. */}
          <section className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">
              Not configurable yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              These need the underlying feature before they can have settings.
              Nothing here is hidden behind a toggle that does not work.
            </p>
            <ul className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
              <Absent name="Email &amp; notifications">no mail delivery exists</Absent>
              <Absent name="Payment providers">no payment gateway is integrated</Absent>
              <Absent name="Shipping carriers">shipping is a single flat rate</Absent>
              <Absent name="Languages">there is no translation layer</Absent>
              <Absent name="Guest checkout">every order requires an account</Absent>
              <Absent name="SEO defaults">per-page SEO is set on each product and category</Absent>
            </ul>
          </section>
        </div>

        <div className="lg:col-span-1">
          <SettingsActivity activity={activity} />
        </div>
      </div>
    </AdminLayout>
  );
}

function Absent({ name, children }) {
  return (
    <li className="flex gap-2">
      <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-300" />
      <span>
        <span className="font-medium text-gray-700">{name}</span> — {children}
      </span>
    </li>
  );
}
