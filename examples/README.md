# Examples — a visual knowledge base

Design references for future AI agents and human developers building themes on
the GoCommerce storefront engine.

Each directory describes a recognisable storefront archetype in words: what its
hierarchy is doing, how it spends space, how it behaves on a phone. They exist
so an agent asked for "a modern electronics storefront" or "a minimal furniture
storefront" has something concrete to reason from rather than inventing a look
from nothing.

## These are descriptions, not source

**Never copy proprietary code, markup, CSS, fonts, photography, logos, or
trademarked names into the storefront.** These notes describe publicly
observable design *patterns* — grid density, type scale relationships,
interaction timing — which are ideas, not assets. A theme inspired by them must
be built from this project's own components and tokens.

A theme named "amazon-style" would be wrong for the same reason: name a theme
for what it *is* (`dense-catalog`, `editorial-minimal`), not for whose store it
resembles.

## How to use a directory

1. Read `UI_NOTES.md`.
2. Translate it into `frontend/src/theme/themes/<name>/index.js` — colours,
   typography, component variant names, homepage composition.
3. If a section variant you need does not exist, add it to the section
   component as a named variant with literal Tailwind classes. Themes never
   contain class strings.
4. Verify with `npm run build`, then confirm the new classes survived the purge
   (see AI_RULES.md).

## The archetypes

| Directory | Archetype | Shorthand |
|---|---|---|
| `amazon-style/` | Dense marketplace | maximum information per screen |
| `apple-style/` | Product-as-hero | one thing at a time, enormous imagery |
| `nike-style/` | Athletic editorial | motion, energy, bold type |
| `minimal-style/` | Quiet utility | whitespace, restraint, no ornament |
| `luxury-style/` | Considered retail | slowness, serif, generous margins |

`luxury-style/` is implemented — see `frontend/src/theme/themes/luxury/` for a
worked example of these notes turned into a theme.
