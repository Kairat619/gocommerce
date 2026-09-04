/**
 * Luxury — a second theme, and the proof that the engine works.
 *
 * Nothing in this file touches commerce logic. It changes the palette, the
 * card proportions, the hero treatment and the order of the homepage, and that
 * is the whole difference between this storefront and the default one.
 *
 * Note what is NOT here: no Go, no SQL, no page props, no component imports,
 * no Tailwind classes. Switch it on in ../index.js.
 */
export default {
  name: "luxury",
  label: "Luxury",

  // Near-black ground with a champagne accent.
  colors: {
    surface: "245 243 240",
    "surface-container": "232 228 222",
    ink: "26 24 22",
    "ink-container": "10 9 8",
    accent: "176 141 87",
    "accent-soft": "226 213 190",
    muted: "238 235 230",
    "muted-foreground": "122 116 108",
    outline: "138 131 122",
  },

  typography: {
    display: '"Noto Serif", Georgia, serif',
    body: 'Inter, system-ui, -apple-system, sans-serif',
  },

  components: {
    ProductCard: { aspect: "square" },
  },

  // A quieter homepage: the editorial statement comes first, categories are
  // wide and few, and the product wall is the finale rather than the middle.
  homepage: [
    {
      section: "Hero",
      props: {
        variant: "centered",
        eyebrow: "Maison",
        title: "Objects of Lasting Character",
        description:
          "A considered selection for the home, made to be kept rather than replaced.",
        actions: [{ label: "View the Collection", href: "/products" }],
        imageSeed: "luxury-hero-atelier",
        imageAlt: "An atelier interior",
        height: "tall",
      },
    },
    {
      section: "EditorialBand",
      props: {
        eyebrow: "Our Standard",
        title: "Made slowly, by people who sign their work",
        description:
          "Every piece is chosen for the hand that made it and the years it will last.",
        imageSeed: "luxury-editorial-craft",
      },
    },
    {
      section: "CategoryShowcase",
      props: {
        variant: "landscape",
        limit: 2,
        eyebrow: "The Collections",
        title: "Explore by Room",
        actionLabel: "All Collections",
        actionHref: "/categories",
      },
    },
    {
      section: "ValueProps",
      props: {
        items: [
          {
            title: "Complimentary Delivery",
            body: "White-glove delivery on every order, worldwide.",
          },
          {
            title: "Lifetime Care",
            body: "Repair and restoration for as long as you own it.",
          },
          {
            title: "Private Appointments",
            body: "Speak with a specialist before you commit.",
          },
        ],
      },
    },
    {
      section: "FeaturedProducts",
      props: {
        variant: "surface",
        limit: 6,
        columns: "three",
        eyebrow: "Currently Featured",
        title: "This Season's Selection",
        actionLabel: "See Everything",
        actionHref: "/products",
      },
    },
  ],
};
