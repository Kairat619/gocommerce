# Luxury-style — Considered Retail

Design reference only. Describes publicly observable patterns, not proprietary
assets. See [../README.md](../README.md).

**Implemented.** See `frontend/src/theme/themes/luxury/index.js` for these notes
turned into a working theme — it is the reference for how a UI_NOTES file
becomes a theme file.

**One sentence:** slowness as a signal of value — serif type, generous margins,
few products shown at once, and a voice that describes rather than sells.

---

## Visual hierarchy

Story first, product second, price last and quietly. The shopper is being
persuaded of worth before being asked for a decision, so the editorial band
comes before the product wall.

Price never appears in a larger size than the product name. No struck-through
comparison prices; markdown is communicated in words if at all.

## Layout

- Wide outer margins. Content deliberately does not fill the screen.
- Two or three columns maximum in product grids — density reads as cheap.
- Long vertical rhythm with large section padding.
- Asymmetry used sparingly and precisely, never playfully.

## Typography

- Serif for display and product names; sans for interface text and price.
- Moderate display sizes — restraint, not spectacle.
- Small uppercase labels with wide tracking (0.12–0.2em) for eyebrows and
  section headings. This is the signature detail of the register.
- Generous line-height in body copy.

## Spacing

Large and consistent. The gap between sections is bigger than most storefronts'
hero padding. Cards have no internal padding because they have no borders.

## Navigation

- Minimal header, wordmark centred or left, very few links.
- No search field by default — an icon at most.
- Category navigation reads as "collections" or "rooms", not "shop by".
- Announcement bar used for service messages, not discounts.

## Product cards

Square or portrait imagery on a warm neutral ground. Serif name, small sans
price beneath. No badges, no ratings, no quick-add. Hover does almost nothing —
a very slow scale at most.

## Product grids

Three across at most on desktop, two on tablet. Wide gutters. Fewer products per
page than is commercially optimal, on purpose.

## Hero

Full-viewport, centred, single call to action. Often an interior or atelier
photograph rather than the product itself. One line of copy.

## Promotional areas

Effectively none. Where other storefronts promote, this one explains: provenance,
materials, the maker, the care programme. The `EditorialBand` carries this and
appears high on the page.

## Imagery

Warm, low-contrast, natural light. Objects in context — a room, a hand, a
workshop — rather than isolated on white. Consistent colour grading across the
whole site matters more than any single image.

## Interactions

- Everything slow: 500–700ms, strongly eased.
- No hover reveals, no quick-add, no urgency devices.
- Size and variant selection is a calm list, not a chip grid.

## Animation philosophy

Motion should feel like weight. Fade and rise on section entry, long durations,
`cubic-bezier(0.16, 1, 0.3, 1)`. Nothing repeats, nothing bounces, nothing
demands attention.

## Mobile behaviour

- Hero stays full-viewport with centred type.
- Grid drops to two columns but keeps its wide gutters proportionally.
- Category tiles become landscape, one or two per screen.
- Editorial copy stays full-width with the same generous line-height.

---

## How this became `theme/themes/luxury/index.js`

| Note above | Theme value |
|---|---|
| Warm neutral ground | `surface: "245 243 240"` |
| Champagne accent | `accent: "176 141 87"` |
| Square product imagery | `components.ProductCard.aspect: "square"` |
| Full-viewport centred hero | `Hero` `variant: "centered"`, `height: "tall"` |
| Story before product | `EditorialBand` placed second, before any grid |
| Few products, few columns | `FeaturedProducts` `limit: 6`, `columns: "three"` |
| Collections, not departments | `CategoryShowcase` `variant: "landscape"`, `limit: 2` |

Note what did **not** change: no Go, no SQL, no page props, no component
imports, no Tailwind classes. That is the test of whether a theme is a theme.
