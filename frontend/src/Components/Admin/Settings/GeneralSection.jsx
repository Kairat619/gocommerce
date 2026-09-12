import FormCard from "../Form/FormCard";
import TextInput from "../Form/TextInput";
import Textarea from "../Form/Textarea";
import SettingsSaveBar from "./SettingsSaveBar";
import SettingsWarning from "./SettingsWarning";
import { useSettingsForm } from "./useSettingsForm";

/**
 * Who the store is.
 *
 * The store name is the highest-impact field on this page and does not look it:
 * it is the storefront header, the footer, every page title and the copy in the
 * theme. It used to be a constant in the bundle (BRAND_NAME), which is why the
 * shop displayed "ShopNest" while the server's own appName said "GoCommerce".
 * This field is now the one place that decides.
 *
 * The contact details are DISPLAY ONLY, and the helper text says so rather than
 * implying a notification system that does not exist. There is no mail
 * transport anywhere in this application — no sender address, no templates, no
 * queue — so a contact email here is an address shown to shoppers, never one
 * the store sends from.
 */
export default function GeneralSection({ settings, errors = {} }) {
  const form = useSettingsForm(
    {
      store_name: settings.store_name ?? "",
      store_description: settings.store_description ?? "",
      store_email: settings.store_email ?? "",
      store_phone: settings.store_phone ?? "",
    },
    "/admin/settings/general"
  );

  return (
    <form onSubmit={form.submit}>
      <FormCard
        title="Store identity"
        description="The name and description shoppers see across the storefront."
      >
        <div className="space-y-5">
          <TextInput
            label="Store name"
            name="store_name"
            required
            value={form.values.store_name}
            onChange={(value) => form.set("store_name", value)}
            error={errors.store_name}
            hint="Shown in the storefront header and footer, and in every browser tab title."
            maxLength={255}
          />

          <Textarea
            label="Store description"
            name="store_description"
            value={form.values.store_description}
            onChange={(value) => form.set("store_description", value)}
            error={errors.store_description}
            hint="A short line about the store. Optional."
            rows={3}
            maxLength={1000}
          />

          {form.dirtyFields.includes("store_name") && (
            <SettingsWarning tone="caution" title="This renames the storefront">
              The store name appears in the header, the footer, every page title
              and the theme’s own copy. Shoppers with the site already open keep
              the old name until their next page load.
            </SettingsWarning>
          )}
        </div>
      </FormCard>

      <div className="mt-4">
        <FormCard
          title="Contact details"
          description="Published to shoppers. Both are optional."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <TextInput
              label="Contact email"
              name="store_email"
              type="email"
              value={form.values.store_email}
              onChange={(value) => form.set("store_email", value)}
              error={errors.store_email}
              hint="Displayed as the store’s contact address. Nothing is sent from it — this application has no email delivery."
            />

            <TextInput
              label="Contact phone"
              name="store_phone"
              type="tel"
              value={form.values.store_phone}
              onChange={(value) => form.set("store_phone", value)}
              error={errors.store_phone}
              hint="Displayed as the store’s contact number."
              maxLength={50}
            />
          </div>

          <SettingsSaveBar
            isDirty={form.isDirty}
            dirtyCount={form.dirtyFields.length}
            processing={form.processing}
            onReset={form.reset}
          />
        </FormCard>
      </div>
    </form>
  );
}
