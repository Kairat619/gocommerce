import FormCard from "../Form/FormCard";
import TextInput from "../Form/TextInput";
import Toggle from "../Form/Toggle";
import SettingsSaveBar from "./SettingsSaveBar";
import SettingsWarning from "./SettingsWarning";
import { useSettingsForm } from "./useSettingsForm";

/**
 * How the catalogue behaves.
 *
 * Two different kinds of setting share this page, and the distinction is the
 * most important thing on it:
 *
 *   Products per page changes the storefront NOW, for everyone.
 *   The product defaults change only what the NEXT product starts as.
 *
 * Nothing here rewrites an existing product. Every product carries its own
 * track_inventory, allow_backorders, low_stock_threshold and status in its own
 * columns, and a settings save that silently re-flagged the whole catalogue as
 * untracked would be a data-loss event wearing a checkbox. The page says so
 * where the defaults are, not in a footnote.
 *
 * The defaults previously lived in two places at once — column defaults in the
 * schema and hardcoded values in productFormState.js — so the form and the
 * database each had an opinion about what a new product looked like. The form
 * now asks.
 *
 * The dependency between tracking and the fields it governs is expressed by
 * disabling them rather than hiding them: an administrator who has turned
 * tracking off should still be able to see what the thresholds are set to,
 * and a control that vanishes reads as a bug.
 */
export default function CatalogSection({ settings, errors = {} }) {
  const form = useSettingsForm(
    {
      products_per_page: String(settings.products_per_page ?? 12),
      default_product_active: Boolean(settings.default_product_active),
      default_track_inventory: Boolean(settings.default_track_inventory),
      default_allow_backorders: Boolean(settings.default_allow_backorders),
      default_low_stock_threshold: String(settings.default_low_stock_threshold ?? 0),
    },
    "/admin/settings/catalog"
  );

  const tracking = form.values.default_track_inventory;

  return (
    <form onSubmit={form.submit}>
      <FormCard
        title="Storefront catalogue"
        description="How the public product listings are paginated."
      >
        <TextInput
          label="Products per page"
          name="products_per_page"
          type="number"
          min="1"
          max="60"
          required
          value={form.values.products_per_page}
          onChange={(value) => form.set("products_per_page", value)}
          error={errors.products_per_page}
          hint="Applies to the shop listing, category pages and collection pages. Between 1 and 60."
          className="sm:max-w-xs"
        />

        {form.dirtyFields.includes("products_per_page") && (
          <div className="mt-5">
            <SettingsWarning tone="caution" title="This changes the storefront immediately">
              Shoppers see the new page size on their next page load, and any
              bookmarked page-2 link will land on a different set of products.
            </SettingsWarning>
          </div>
        )}
      </FormCard>

      <div className="mt-4">
        <FormCard
          title="New product defaults"
          description="What the create-product form starts with. Existing products are never changed."
        >
          <div className="space-y-5">
            <Toggle
              name="default_product_active"
              label="New products are active"
              description="A new product is visible in the storefront as soon as it is saved. Turn this off to have products start hidden until you publish them."
              checked={form.values.default_product_active}
              onChange={(value) => form.set("default_product_active", value)}
            />

            <div className="border-t border-gray-100 pt-5">
              <Toggle
                name="default_track_inventory"
                label="Track inventory by default"
                description="New products count stock down as they sell. Products with tracking off can always be bought, and never appear in the dashboard's stock alerts."
                checked={form.values.default_track_inventory}
                onChange={(value) => form.set("default_track_inventory", value)}
              />
            </div>

            {/* Disabled rather than hidden: both settings still apply to a
                product whose tracking is later switched on, so their values
                remain worth seeing. */}
            <div
              className={`space-y-5 border-t border-gray-100 pt-5 ${
                tracking ? "" : "opacity-60"
              }`}
            >
              <Toggle
                name="default_allow_backorders"
                label="Allow backorders by default"
                description="New products can be ordered past zero stock."
                checked={form.values.default_allow_backorders}
                onChange={(value) => form.set("default_allow_backorders", value)}
                disabled={!tracking}
              />

              <TextInput
                label="Default low stock threshold"
                name="default_low_stock_threshold"
                type="number"
                min="0"
                required
                value={form.values.default_low_stock_threshold}
                onChange={(value) => form.set("default_low_stock_threshold", value)}
                error={errors.default_low_stock_threshold}
                hint="A new product raises a dashboard stock alert at or below this quantity. Zero means it only alerts once it is out of stock."
                className="sm:max-w-xs"
                disabled={!tracking}
              />

              {!tracking && (
                <p className="text-xs text-gray-500">
                  These apply once a product has inventory tracking switched on.
                  They are saved either way.
                </p>
              )}
            </div>

            <SettingsWarning title="Defaults only">
              Changing these affects products created from now on. Products
              already in your catalogue keep the values they were saved with —
              edit a product to change its own stock behaviour.
            </SettingsWarning>

            <SettingsSaveBar
              isDirty={form.isDirty}
              dirtyCount={form.dirtyFields.length}
              processing={form.processing}
              onReset={form.reset}
            />
          </div>
        </FormCard>
      </div>
    </form>
  );
}
