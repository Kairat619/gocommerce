import HeroBanner from "./hero/HeroBanner";
import ValueProps from "./marketing/ValueProps";
import CategoryShowcase from "./categories/CategoryShowcase";
import FeaturedProducts from "./products/FeaturedProducts";
import EditorialBand from "./editorial/EditorialBand";
import PromoHero from "./marketplace/PromoHero";
import CategoryRail from "./marketplace/CategoryRail";
import ProductShelf from "./marketplace/ProductShelf";
import PromoTrio from "./marketplace/PromoTrio";
import ServiceHighlights from "./marketplace/ServiceHighlights";
import SignupBanner from "./marketplace/SignupBanner";

/**
 * The sections a theme may compose a page from.
 *
 * A theme's `homepage` is a list of entries naming a section and its content.
 * It never imports a component and never supplies Tailwind classes — it picks
 * a section by name and a variant by name, and the component owns the class
 * strings. That is what keeps every class literal enough for Tailwind's purge
 * to find it.
 *
 * `select` is how a section receives commerce data. It is an explicit
 * function rather than a naming convention so you can read, at a glance, which
 * page props each section consumes.
 */
export const sectionRegistry = {
  Hero: {
    component: HeroBanner,
  },
  ValueProps: {
    component: ValueProps,
  },
  CategoryShowcase: {
    component: CategoryShowcase,
    select: (data) => ({ categories: data.categories }),
  },
  FeaturedProducts: {
    component: FeaturedProducts,
    select: (data) => ({ products: data.featured_products }),
  },
  EditorialBand: {
    component: EditorialBand,
  },
  PromoHero: {
    component: PromoHero,
  },
  CategoryRail: {
    component: CategoryRail,
    select: (data) => ({ categories: data.categories }),
  },
  ProductShelf: {
    component: ProductShelf,
    select: (data) => ({ products: data.featured_products }),
  },
  PromoTrio: {
    component: PromoTrio,
  },
  ServiceHighlights: {
    component: ServiceHighlights,
  },
  SignupBanner: {
    component: SignupBanner,
  },
};

export default sectionRegistry;
