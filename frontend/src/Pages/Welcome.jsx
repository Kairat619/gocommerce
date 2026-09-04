import { Head } from "@inertiajs/react";
import StoreLayout from "../Components/StoreLayout";
import SectionList from "../sections/SectionList";
import { useTheme } from "../theme/ThemeProvider";
import { asList } from "../lib/props";
import { BRAND_NAME } from "../lib/brand";

/**
 * The homepage is composition, not markup.
 *
 * What appears here, in what order, with what copy, is `theme.homepage` — so a
 * new storefront identity is a new file under theme/themes/, not an edit to
 * this page. All this component does is hand the section renderer its
 * commerce data.
 *
 * @param {import('../types/pages').WelcomeProps} props
 */
export default function Welcome({ featured_products, categories }) {
  const theme = useTheme();

  return (
    <StoreLayout full>
      <Head title={`${BRAND_NAME} — Curated Home & Lifestyle`} />

      <SectionList
        composition={theme.homepage}
        data={{
          featured_products: asList(featured_products),
          categories: asList(categories),
        }}
      />
    </StoreLayout>
  );
}
