import Container from "../../Components/UI/Container";
import PromoTile from "./PromoTile";

/**
 * The marketplace hero: a wide feature tile beside a narrow spotlight tile.
 * Entirely theme copy and artwork — it takes no commerce data.
 *
 * @param {Object} props
 * @param {Object} props.feature    PromoTile props for the wide tile
 * @param {Object} [props.spotlight] PromoTile props for the narrow tile
 */
export default function PromoHero({ feature, spotlight }) {
  if (!feature) return null;

  return (
    <Container as="section" className="pt-4 md:pt-6">
      <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-12">
        <PromoTile
          {...feature}
          size="feature"
          headingLevel="h1"
          className={spotlight ? "lg:col-span-8" : "lg:col-span-12"}
        />
        {spotlight && (
          <PromoTile
            {...spotlight}
            size="spotlight"
            headingLevel="h2"
            className="lg:col-span-4"
          />
        )}
      </div>
    </Container>
  );
}
