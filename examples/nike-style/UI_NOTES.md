# Nike-style — Athletic Editorial

Design reference only. Describes publicly observable patterns, not proprietary
assets. See [../README.md](../README.md).

**One sentence:** energy and motion — bold type, cropped action photography, and
a browse experience that feels like a magazine with a checkout.

---

## Visual hierarchy

Imagery first, then a short imperative headline ("Just In", "Shop Now"), then
product. Type is loud enough to compete with photography rather than sit beneath
it. Price is deliberately understated — this is aspiration-led, not
comparison-led.

## Layout

- Full-bleed edge-to-edge sections with no outer gutter on hero and editorial.
- Asymmetric compositions: a 2/3 image beside a 1/3 text column, alternating
  sides down the page.
- Product grids are 3–4 wide with narrow gutters so imagery dominates.
- Frequent horizontal scroll rails for collections.

## Typography

- Heavy condensed or extended sans for display, regular sans for body.
- Uppercase headlines with tight tracking.
- Very high weight contrast: 900 display against 400 body.
- Text sometimes overlaps imagery.

## Spacing

Moderate. Denser than Apple, far looser than a marketplace. Sections are
separated by imagery changes rather than whitespace.

## Navigation

- Header with a handful of gendered/category entries and a wide mega-panel.
- Secondary chip row for filtering within a collection.
- Sticky filter and sort controls on listing pages.

## Product cards

Image on a light grey ground, cropped close. Colour-way count beneath the name
("4 Colours"). Name, category line, price stacked with minimal spacing. Hover
swaps to an alternate angle.

## Product grids

Dense but not cramped. Filter rail collapses on scroll so the grid widens.

## Hero

Full-viewport action photography, headline overlaid bottom-left or centred, one
or two strong buttons. Often video.

## Promotional areas

Editorial bands between grids: a story, an athlete, a launch. These read as
content, not advertising, and use the same type treatment as the hero.

## Imagery

Motion-frozen action shots, cropped aggressively. High contrast, saturated. On
product cards, clean studio shots for comparability. The two registers alternate
deliberately.

## Interactions

- Hover swaps product imagery to a second angle.
- Colour-way selection updates the card image in place.
- Size selection is a grid of chips, with unavailable sizes struck through
  rather than hidden.

## Animation philosophy

Confident and quick. 200–300ms transitions, ease-out. Parallax on hero imagery.
Scroll-triggered reveals with slight upward translation. Motion supports energy
without getting in the way of shopping.

## Mobile behaviour

- Hero stays full-viewport; headline drops a size.
- 2-column grid with edge-to-edge imagery.
- Filters in a bottom sheet; sort as a separate quick control.
- Horizontal rails become the dominant browse pattern.

---

## Translating this into a theme

- Tokens: white surface, near-black ink, one high-energy accent (volt, orange)
  used sparingly on calls to action.
- Typography: increase display weight to 800–900, add uppercase to headings.
- `HeroBanner`: `variant: "split"`, `height: "tall"`.
- Homepage: `Hero`, `CategoryShowcase` (`landscape`, limit 2 or 3),
  `FeaturedProducts` (`surface`), `EditorialBand`, `FeaturedProducts` again with
  a different heading.
- Would benefit from a `ProductCard` hover-swap variant once products carry more
  than one image on listing props.
