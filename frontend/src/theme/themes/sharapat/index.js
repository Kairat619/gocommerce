import { BRAND } from "../../../lib/brand";
import heroPhone from "./assets/hero-phone.jpg";
import heroSneaker from "./assets/hero-sneaker.jpg";
import promoHarvest from "./assets/promo-harvest.jpg";
import promoFlagship from "./assets/promo-flagship.jpg";
import promoSpices from "./assets/promo-spices.jpg";

/**
 * Sharapat — a bright, dense marketplace identity (Stitch: "SHARAPAT
 * Marketplace UI Design System").
 *
 * Where the luxury theme is quiet and editorial, this one scans like a busy
 * marketplace: gradient promo tiles, a circular category rail, and tight
 * five-up product shelves.
 *
 * The banner artwork under ./assets is marketing imagery owned by the theme,
 * not product data. Every product, price and category on the page still comes
 * from the page props — the shelves split `featured_products` into what is
 * genuinely marked down and what is not, so nothing is shown twice and no
 * discount is invented.
 */
export default {
  name: "sharapat",
  label: "Sharapat",

  colors: {
    surface: "249 249 255",
    "surface-container": "233 237 255",
    ink: "20 27 43",
    "ink-container": "41 48 64",
    accent: "0 74 198",
    "accent-soft": "219 225 255",
    muted: "241 243 255",
    "muted-foreground": "67 70 85",
    outline: "115 118 134",
  },

  typography: {
    display: 'Inter, system-ui, -apple-system, sans-serif',
    body: 'Inter, system-ui, -apple-system, sans-serif',
  },

  components: {
    ProductCard: { aspect: "square", look: "tile" },
    Navbar: { variant: "marketplace" },
    Footer: { variant: "marketplace" },
  },

  homepage: [
    {
      section: "PromoHero",
      props: {
        feature: {
          tone: "midnight",
          eyebrow: "Flagship Release",
          title: "Enjoy New Tech",
          highlight: "Built to Lead",
          description:
            "Ultra-slim frames, next-generation processors and pro-grade cameras.",
          action: { label: "Shop Now", href: "/products" },
          image: heroPhone,
          imageAlt: "A flagship smartphone",
        },
        spotlight: {
          tone: "ocean",
          eyebrow: "Flash Clearance",
          title: "Deals on Active Gear",
          description: "High-performance road shoes and everyday active wear.",
          action: { label: "Explore Deals", href: "/products" },
          image: heroSneaker,
          imageAlt: "A running sneaker",
        },
      },
    },
    {
      section: "CategoryRail",
      props: {
        title: "Explore Popular Categories",
        actionLabel: "View All",
        actionHref: "/categories",
        limit: 12,
      },
    },
    {
      section: "ProductShelf",
      props: {
        source: "sale",
        icon: "flame",
        title: "Today's Best Deals For You!",
        actionLabel: "View All",
        actionHref: "/products",
      },
    },
    {
      section: "PromoTrio",
      props: {
        items: [
          {
            tone: "forest",
            eyebrow: "Farm to Table",
            title: "100% Organic Fresh Harvest",
            description: "Picked at peak season, delivered fast.",
            action: { label: "Shop Fresh", href: "/categories" },
            image: promoHarvest,
          },
          {
            tone: "royal",
            eyebrow: "Premium Spec",
            title: "Next-Gen Flagship Series",
            description: "The latest devices, ready to ship.",
            action: { label: "Learn More", href: "/products" },
            image: promoFlagship,
          },
          {
            tone: "ember",
            eyebrow: "Gourmet Selection",
            title: "Artisanal Spices & Pantry Gold",
            description: "Direct from master spice gardens.",
            action: { label: "Explore Flavors", href: "/categories" },
            image: promoSpices,
          },
        ],
      },
    },
    {
      section: "ProductShelf",
      props: {
        source: "regular",
        icon: "sparkle",
        title: "Trending Picks",
        actionLabel: "View All",
        actionHref: "/products",
      },
    },
    {
      section: "ServiceHighlights",
      props: {
        items: [
          {
            icon: "truck",
            title: "Fast Delivery",
            body: "Tracked shipping on every order.",
          },
          {
            icon: "shield",
            title: "Secure Payments",
            body: "Encrypted, protected checkout.",
          },
          {
            icon: "return",
            title: "Easy Returns",
            body: "Hassle-free returns after delivery.",
          },
          {
            icon: "support",
            title: "Dedicated Help",
            body: "Real people, ready when you need them.",
          },
        ],
      },
    },
    {
      section: "SignupBanner",
      props: {
        eyebrow: "Stay Connected",
        get title() {
          return `Join ${BRAND.name} Today`;
        },
        description:
          "Create an account to check out faster, track your orders and keep your addresses in one place.",
        guestAction: { label: "Create Account", href: "/register" },
        memberAction: { label: "Keep Shopping", href: "/products" },
      },
    },
  ],
};
