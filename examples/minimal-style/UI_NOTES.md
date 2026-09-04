# Minimal-style — Quiet Utility

Design reference only. Describes publicly observable patterns, not proprietary
assets. See [../README.md](../README.md).

**One sentence:** remove everything that is not the product or the next
decision; what remains is spacing, type, and one accent.

---

## Visual hierarchy

Flat by design. Product name and price share weight. Nothing shouts, so
hierarchy comes from position and whitespace rather than size or colour.

The shopper is trusted to look. There are no badges competing for attention, no
urgency devices, no interstitial promotion.

## Layout

- Comfortable but not extravagant gutters — content feels aired, not staged.
- 3 or 4 column grids with wide gaps.
- Long vertical rhythm; sections separated by whitespace alone, no rules.
- Text columns capped near 60–70 characters.

## Typography

- One neutral sans, occasionally a single serif for headings only.
- Narrow type scale — headline is perhaps 2.5× body, no more.
- Regular and medium weights only; bold is reserved for price.
- Letter-spacing used on small uppercase labels to create texture without
  adding colour.

## Spacing

The primary design tool. An 8px base unit used generously — 48px, 64px, 96px
between sections. Whitespace does the work that borders and shadows do
elsewhere.

## Navigation

- Slim header: wordmark left, three or four links, cart right.
- No mega-menu. Categories are a page, not a dropdown.
- Filters as a plain vertical list, no accordions, no counts badges.

## Product cards

Image, name, price. That is all. No border, no shadow, no hover state beyond a
slow image scale. Portrait imagery on a very light neutral ground.

## Product grids

Uniform, generously gapped. Empty states are a line of text and a link, not an
illustration.

## Hero

Optional and quiet. Often just a heading and a line of text over a light ground
— no image at all. When an image is used it is soft and low-contrast.

## Promotional areas

Rare. Discounts shown as a struck-through price, never as a badge or a banner.
Newsletter signup is a single line in the footer.

## Imagery

Consistent, evenly lit, generous negative space within the frame itself. The
photography does the minimalism as much as the layout does.

## Interactions

Slow and soft. Image scale on hover over ~700ms. No hover reveals — a quick-add
button that appears on hover would be too eager for this register. Everything is
reachable in one click from where it is visible.

## Animation philosophy

Almost none, and always subtle. Fades, never slides. Nothing draws attention to
itself. Respect `prefers-reduced-motion` absolutely.

## Mobile behaviour

- 2-column grid, same generous gaps proportionally reduced.
- Navigation collapses to a simple stacked list, not a styled overlay.
- Filters become a plain full-page list.
- Spacing shrinks by roughly a third; the proportions survive.

---

## Translating this into a theme

- Tokens: warm off-white surface, soft near-black ink, a muted accent used only
  for links and focus rings.
- Typography: compress the display sizes; `display-xl` becomes closer to
  `headline-lg`.
- `HeroBanner`: `variant: "centered"`, `height: "short"`.
- `ProductCard`: `aspect: "portrait"`; would want a variant that omits the
  quick-add button and the badges entirely.
- Homepage: `Hero`, `FeaturedProducts` (`surface`, limit 6, `columns: "three"`),
  `CategoryShowcase` (`portrait`), and nothing else. Drop `ValueProps` and
  `EditorialBand` — restraint is the theme.

This is the archetype closest to a "do less" brief. When in doubt, remove a
section rather than restyle it.
