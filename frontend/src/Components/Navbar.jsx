import { useComponentVariant } from "../theme/ThemeProvider";
import ClassicNavbar from "./Chrome/ClassicNavbar";
import MarketplaceNavbar from "./Chrome/MarketplaceNavbar";

/**
 * The storefront header. The active theme picks which one by name
 * (`components.Navbar.variant`); each lives in ./Chrome with its own classes.
 */
const variants = {
  classic: ClassicNavbar,
  marketplace: MarketplaceNavbar,
};

export default function Navbar() {
  const { variant } = useComponentVariant("Navbar", { variant: "classic" });
  const Header = variants[variant] || variants.classic;
  return <Header />;
}
