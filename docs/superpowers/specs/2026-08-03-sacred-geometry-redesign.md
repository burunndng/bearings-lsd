# Bearings UI Redesign: Sacred Geometry / Astrolabe

## Problem

Every surface in the app is a rectangle. Cards in grids lead to pages with
more cards in grids. The current design is competent editorial — clean,
restrained, and forgettable. The user wants geometry, personality, and
atmosphere.

## Direction: "The Astrolabe"

A medieval navigation instrument: concentric circles, radial lines, six-fold
symmetry, overlapping forms. Not "sacred" in the religious sense (secular
product boundary), but the mathematical geometry that cultures across history
have used to map the sky and find their position. The app is called *Bearings*
— the visual language should be the instrument that takes them.

### Palette: Antique Instrument

Replacing teal with something richer and more museum-like:

| Token | Day | Night | Role |
|-------|-----|-------|------|
| ground | warm ivory `#f2ede3` | obsidian `#0d0b08` | base surface |
| raised | paper-white `#faf7f0` | dark walnut `#1a1612` | cards/panels |
| ink | espresso `#211e19` | aged bone `#e8dcc8` | text |
| brass | `#9a7b2a` | `#c89b3c` | primary accent (true north) |
| verdigris | `#4a7a70` | `#5c9a8e` | secondary (aged copper green) |
| oxblood | `#a64b3a` | `#c75a47` | safety only |

The brass + verdigris pairing is the colour of a real antique astrolabe —
polished brass edges, verdigris patina on aged copper. Warm, not blue.

### Typography: Organic Serif × Geometric Grotesque

- **Display: Fraunces Variable** — keep. Organic SOFT/WONK axes, real character.
- **Body/UI: Bricolage Grotesque Variable** — replaces Spectral. A geometric
  grotesque designed by Mathieu Triay with real personality — not Inter, not
  system-ui. The serif↔grotesque tension mirrors the organic-experience ×
  geometric-instrument tension at the app's core.
- **Meta: IBM Plex Mono** — keep.

### Layout Primitives: The Geometry Toolkit

1. **Hexagonal cards** — `clip-path: polygon()` for pointy-top hexagons.
   Nature's most efficient tile. Replaces every rectangular `.card`.

2. **Flower of Life overlay** — SVG of 19 overlapping circles as a fixed
   background texture on the night ground. Very faint (opacity ~0.02).
   The classic sacred-geometry form, rendered as cartographic texture.

3. **Seed of Life dividers** — 7-circle SVG figure replacing `border-top`
   rules between sections. Each divider is a small geometric ornament.

4. **Radial home page** — the four entry points (Before / Between /
   Integration / Learn) arranged on a circle around a central compass mark,
   connected by faint radial lines. On mobile, collapses to a vertical stack
   with hexagonal nodes.

5. **Constellation shelves** — instead of a card grid, shelf pages render
   cards as circular/hexagonal nodes connected by hairline lines, like a
   star chart. Filter still works (nodes fade, connections dim).

6. **Vesica Piscis containers** — the lens shape from two overlapping
   circles, used as the silhouette for safety embeds and special panels.

7. **Golden-ratio spacing** — `--space` scale shifts to Fibonacci ratios
   (0.382 / 0.618 / 1 / 1.618 / 2.618 / 4.236 / 6.854rem).

### Motion (unchanged contract)

All existing photosafety rules stay: 7–40s cycles, no strobing, full
reduced-motion support. The new geometric layers (Flower of Life, radial
lines) are static — only the existing auras and mote field animate.

### What does NOT change

- Content (cards, learn, safety, resources — all content stays)
- Data model (storage, types, session inference)
- Product boundaries (secular, non-directive, no scoring)
- Voice (condition-action, no promises)
- Accessibility (visible focus, tap targets, keyboard, screen reader)
- The compass wordmark and its SVG
- The SafetyFooter's permanent presence

### Files to change (ordered by visual impact)

1. `tokens.css` — palette + font vars + golden-ratio spacing + shape tokens
2. `fonts.css` — add Bricolage Grotesque, remove Spectral
3. `global.css` — Flower of Life bg, hexagonal `.card`, seed-of-life dividers
4. `index.astro` — radial mandala home layout
5. `ShelfList.astro` — hexagonal/constellation shelf
6. `NightField.astro` — mote palette → brass/verdigris
7. Component scoped styles — geometric containers in SessionTracker,
   CoolingLedger, Journal, Settings, card detail
8. `safety.astro` — vesica piscis route containers
9. `BaseLayout.astro` — Flower of Life layer in the ground

### Risks

- **Clip-path support**: universal in modern browsers but `border` doesn't
  follow clip-path. Hexagonal cards need `filter: drop-shadow()` for borders
  instead of `border`. Performance is fine for a static site.
- **Grid layout with hexagons**: hexagons tile in a honeycomb pattern
  (offset rows), not a standard CSS grid. Will use CSS grid with `clip-path`
  on the visual layer and a standard grid for layout/spacing. On odd-row
  items, a `margin-left` offset creates the honeycomb stagger.
- **Accessibility**: clip-path doesn't affect DOM order or keyboard nav. The
  hexagon is purely visual — the link/button semantics are unchanged.
- **Secular boundary**: Flower of Life and Seed of Life have spiritual
  meanings in some traditions. The app uses them as **geometric navigation
  forms** (the same circles used to draw an astrolabe), explicitly not as
  spiritual symbols. No spiritual language accompanies them.
