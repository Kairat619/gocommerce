import { Head, Link, usePage } from "@inertiajs/react";

import AdminLayout from "../../../Layouts/AdminLayout";
import CatalogSection from "../../../Components/Admin/Settings/CatalogSection";
import CheckoutSection from "../../../Components/Admin/Settings/CheckoutSection";
import GeneralSection from "../../../Components/Admin/Settings/GeneralSection";
import LocalizationSection from "../../../Components/Admin/Settings/LocalizationSection";
import SettingsActivity from "../../../Components/Admin/Settings/SettingsActivity";
import SettingsNav from "../../../Components/Admin/Settings/SettingsNav";
import SystemSection from "../../../Components/Admin/Settings/SystemSection";

/**
 * One section of the configuration centre.
 *
 * Every section shares this frame — navigation, heading, the section's own
 * form, and the audit trail for the fields on this page — and differs only in
 * the form itself. That is what keeps five pages consistent instead of five
 * pages that drifted.
 *
 * The layout is nav-beside-content from lg and stacked below it, with the nav
 * collapsing to a scrolling strip rather than hiding behind a button: five
 * items fit on a phone, and a tap is better than two.
 *
 * @param {import('../../../types/pages').AdminSettingsSectionProps} props
 */
export default function AdminSettingsSection({
  sections = [],
  section,
  settings = {},
  activity = [],
  system,
  currencies = [],
  timezone,
}) {
  const { errors = {} } = usePage().props;

  return (
    <AdminLayout title="Settings">
      <Head title={`${section?.label || "Settings"} settings`} />

      <div className="mb-6">
        <nav aria-label="Breadcrumb" className="mb-2">
          <Link
            href="/admin/settings"
            className="text-sm text-gray-500 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            ← All settings
          </Link>
        </nav>
        <h2 className="text-xl font-semibold text-gray-900">{section?.label}</h2>
        <p className="mt-0.5 text-sm text-gray-500">{section?.description}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <SettingsNav sections={sections} current={section?.key} />
        </div>

        <div className="space-y-4 lg:col-span-3">
          <SectionForm
            section={section}
            settings={settings}
            errors={errors}
            system={system}
            currencies={currencies}
            timezone={timezone}
          />

          {/* The System section has no editable fields, so it has no history to
              show — its values do not pass through this application at all. */}
          {section?.editable !== false && (
            <SettingsActivity
              activity={activity}
              title={`${section?.label} history`}
              scoped
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function SectionForm({ section, settings, errors, system, currencies, timezone }) {
  switch (section?.key) {
    case "general":
      return <GeneralSection settings={settings} errors={errors} />;
    case "localization":
      return (
        <LocalizationSection
          settings={settings}
          currencies={currencies}
          timezone={timezone}
          errors={errors}
        />
      );
    case "catalog":
      return <CatalogSection settings={settings} errors={errors} />;
    case "checkout":
      return (
        <CheckoutSection
          settings={settings}
          currency={settings.currency}
          errors={errors}
        />
      );
    case "system":
      return <SystemSection system={system} />;
    default:
      // The server rejects an unknown section before rendering, so this is
      // unreachable in practice — it exists so a future section added to the Go
      // list but not here fails visibly rather than as a blank panel.
      return (
        <div className="rounded-xl bg-white px-6 py-12 text-center shadow-sm ring-1 ring-gray-200">
          <p className="text-sm font-medium text-gray-700">
            This settings section has no form yet.
          </p>
        </div>
      );
  }
}
