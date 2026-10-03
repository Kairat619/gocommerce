import { useComponentVariant } from "../theme/ThemeProvider";
import ClassicFooter from "./Chrome/ClassicFooter";
import MarketplaceFooter from "./Chrome/MarketplaceFooter";

/**
 * The storefront footer. The active theme picks which one by name
 * (`components.Footer.variant`); each lives in ./Chrome with its own classes.
 */
const variants = {
  classic: ClassicFooter,
  marketplace: MarketplaceFooter,
};

export default function Footer() {
  const { variant } = useComponentVariant("Footer", { variant: "classic" });
  const SiteFooter = variants[variant] || variants.classic;
  return <SiteFooter />;
}
