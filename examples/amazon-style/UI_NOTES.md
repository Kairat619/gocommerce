# Amazon-style — Dense Marketplace

Design reference only. Describes publicly observable patterns, not proprietary
assets. See [../README.md](../README.md).

**One sentence:** maximise decision-making information per screen; the shopper
is comparing, not browsing.

---

## Visual hierarchy

Price is the loudest element on a card, above the product name. Then rating,
then availability, then name. Almost the inverse of an editorial storefront —
here the shopper already knows what they want and is choosing between near
identical options, so the differentiators lead.

Trust signals are hierarchy, not decoration: stock status, delivery date, and
review count sit at the same visual weight as the product title.

## Layout

- Very wide content area, minimal outer gutter — screen real estate is inventory.
- Persistent left filter rail on desktop, not a drawer.
- 4–6 products per row on desktop, 2 on mobile.
- Compact vertical rhythm. Cards sit close together; no generous section padding.
- Horizontal carousels of related products stacked several deep below the fold.

## Typography

- System sans throughout. No display face, no serif.
- Small base size (13–14px) so more fits.
- Weight, not size, carries hierarchy — the type scale spans a narrow range.
- Prices often use a larger figure for dollars and a superscript for cents.

## Spacing

Tight and uniform. A 4px base unit used at 1–3× almost everywhere. Sections are
separated by thin rules rather than whitespace.

## Navigation

- Dense mega-menu with many top-level departments.
- Search is the primary navigation, given prominent width in the header.
- Breadcrumbs on every listing and detail page.
- The header persists on scroll and stays functional at all breakpoints.

## Product cards

Image, then price, then title (truncated to 2 lines), rating, delivery promise.
Square or 4:3 imagery on a white ground, no crop drama. Hover reveals nothing —
everything relevant is already visible. Badges are informational
("Best Seller", "20% off"), not aspirational.

## Product grids

Uniform row heights so the eye scans horizontally across prices. Sponsored and
organic results interleaved. Infinite-feeling pagination.

## Hero

Small or absent. When present it is a rotating promotional banner, not a
lifestyle statement — it sells a deal, not a mood.

## Promotional areas

Everywhere. Interstitial banner rows between product grids, "customers also
bought" rails, deal countdown strips. Promotion is woven into the browse
experience rather than confined to a marketing band.

## Imagery

Catalogue photography on white. Consistent framing matters more than beauty —
comparability is the point. Multiple thumbnails on the detail page, with zoom.

## Interactions

Immediate and utilitarian. Add-to-cart from the grid without leaving the page.
Filters apply instantly. Quantity is a select, not a stepper.

## Animation philosophy

Nearly none. Transitions are instant or under 100ms. Motion is treated as
latency, not delight.

## Mobile behaviour

- Filters become a full-screen sheet with an explicit Apply.
- 2-column grid, cards shorten by dropping the delivery line.
- Sticky bottom add-to-cart bar on the detail page.
- Search collapses to an icon that expands to full width.

---

## Translating this into a theme

- Tokens: near-white surface, high-contrast ink, a single saturated accent used
  only for calls to action and savings.
- `ProductCard`: `aspect: "square"`, price above name, badges informational.
- Homepage: short hero, then `FeaturedProducts` repeated with different limits
  and headings, `CategoryShowcase` in `landscape` with a high limit.
- Needs a new section: a horizontally scrolling product rail. Add it as a
  variant of `FeaturedProducts` rather than a new section type.
