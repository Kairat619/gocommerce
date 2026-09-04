# Apple-style — Product as Hero

Design reference only. Describes publicly observable patterns, not proprietary
assets. See [../README.md](../README.md).

**One sentence:** one product, one idea, one screen at a time — the page is a
sequence of full-bleed statements rather than a grid.

---

## Visual hierarchy

The product image is the hierarchy. Type is secondary and deliberately sparse:
a short headline, a shorter subhead, one or two links. Price appears late and
quietly — never competing with the object.

Nothing is above the fold except the thing itself.

## Layout

- Full-viewport sections stacked vertically, each self-contained.
- Content centred within a narrow measure even on huge screens.
- Enormous vertical padding between sections — space signals confidence.
- Grids, when used, are 2–3 columns maximum with large cells.

## Typography

- One geometric/neo-grotesque sans across the whole site.
- Very large display sizes with tight negative tracking; body stays modest.
- Extreme size contrast between headline and body — the scale spans 6–8×.
- Centred alignment for hero copy, left-aligned for specification detail.

## Spacing

Generous and rhythmic. Section padding is measured in viewport units rather
than pixels, so the composition holds its proportions on every screen.

## Navigation

- Slim persistent header, translucent with backdrop blur.
- Few top-level items, each opening a full-width panel.
- Secondary sub-navigation appears per product family, pinned below the header.
- Search is an icon, not a field.

## Product cards

Barely cards. Product on a plain ground, name, one-line description, price, and
a coloured buy link. No borders, no shadows, no badges. Colour swatches shown as
small circles beneath.

## Product grids

Wide gutters, few columns. Cards feel like posters, not database rows.

## Hero

The whole point. Full-bleed image or video, centred headline, two text links
("Learn more" / "Buy"). Often a dark section immediately following a light one
for rhythm.

## Promotional areas

Never called promotions. Announcements are integrated as another full-bleed
section in the same voice as everything else.

## Imagery

Studio photography on seamless backgrounds, or dramatic full-bleed lifestyle
shots. Consistent lighting discipline. Product frequently escapes its container
or bleeds off the edge.

## Interactions

Restrained but polished. Scroll-triggered reveals as sections enter the
viewport. Colour and configuration options update the hero image in place.

## Animation philosophy

Motion is used for arrival, not decoration: fade-and-rise on enter, 400–700ms,
strongly eased. Never bouncy. Nothing loops.

## Mobile behaviour

- Sections stack unchanged — the design was already narrow and centred.
- Hero type shrinks with clamp() but keeps its proportions.
- Navigation collapses to a full-screen overlay.
- Sticky buy bar appears once the hero scrolls away.

---

## Translating this into a theme

- Tokens: pure white and near-black surfaces alternating; accent used only for
  links, never for backgrounds.
- Typography: push `display-xl` larger and tighten tracking; leave body alone.
- `HeroBanner`: `variant: "centered"`, `height: "tall"`.
- Homepage: alternate `EditorialBand` and `FeaturedProducts` with small limits
  (3–4) so each band reads as a statement.
- `ProductCard`: `aspect: "square"`, and a future `variant: "bare"` that drops
  badges and the quick-add button.
