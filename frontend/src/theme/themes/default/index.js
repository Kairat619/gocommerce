import { BRAND_NAME } from "../../../lib/brand";

/**
 * The default storefront theme.
 *
 * This is the visual identity the storefront already had; the homepage below
 * reproduces it section for section. Treat it as the reference when writing a
 * new theme.
 *
 * A theme owns four things and nothing else:
 *   colors      RGB channels, applied as CSS custom properties at runtime
 *   typography  font stacks
 *   components  per-component variant NAMES (never Tailwind classes)
 *   homepage    an ordered composition of sections
 *
 * A theme never imports a component and never writes a class string. It picks
 * things by name; the component owns the classes. That is what keeps every
 * Tailwind class literal enough for the production purge to find it.
 */
export default {
  name: "default",
  label: "Default",

  colors: {
    surface: "248 249 250",
    "surface-container": "237 238 239",
    ink: "33 37 41",
    "ink-container": "12 16 20",
    accent: "197 160 89",
    "accent-soft": "231 216 182",
    muted: "243 244 245",
    "muted-foreground": "117 119 123",
    outline: "117 119 123",
  },

  typography: {
    display: '"Noto Serif", Georgia, serif',
    body: 'Inter, system-ui, -apple-system, sans-serif',
  },

  components: {
    ProductCard: { aspect: "portrait" },
  },

  homepage: [
    {
      section: "Hero",
      props: {
        variant: "split",
        eyebrow: "New Collection 2025",
        title: "Elevate Your Everyday Style",
        description:
          "Premium products curated for modern living. Quality craftsmanship meets contemporary design.",
        actions: [
          { label: "Shop Now", href: "/products", variant: "inverse" },
          {
            label: "Explore Collections",
            href: "/categories",
            variant: "inverse-outline",
          },
        ],
        imageSeed: "shopnest-hero-lifestyle",
        imageAlt: "Curated home and lifestyle collection",
      },
    },
    {
      section: "ValueProps",
      props: {
        items: [
          {
            title: "Complimentary Shipping",
            body: "On all orders above $200, always tracked.",
          },
          {
            title: "30-Day Returns",
            body: "Hassle-free returns within 30 days of delivery.",
          },
          {
            title: "Secure Checkout",
            body: "Encrypted, 100% secure payment processing.",
          },
        ],
      },
    },
    {
      section: "CategoryShowcase",
      props: {
        variant: "portrait",
        limit: 4,
        eyebrow: "Curated Categories",
        title: "Shop by Collection",
        actionLabel: "View All",
        actionHref: "/categories",
      },
    },
    {
      section: "FeaturedProducts",
      props: {
        variant: "light",
        limit: 8,
        columns: "four",
        eyebrow: "Editor's Choice",
        title: "Featured This Season",
        description: "Hand-picked selections for the discerning eye.",
        actionLabel: "Shop All",
        actionHref: "/products",
      },
    },
    {
      section: "EditorialBand",
      props: {
        eyebrow: `The ${BRAND_NAME} Promise`,
        title: "Ready to upgrade your lifestyle?",
        description:
          "Join thousands of satisfied customers and discover products that make a difference.",
        action: { label: "Start Shopping", href: "/products" },
        imageSeed: "shopnest-editorial-band",
      },
    },
  ],
};
