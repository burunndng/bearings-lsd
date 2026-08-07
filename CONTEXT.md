# Context — Bearings domain language

This file is the home for the words the product and codebase use to mean
specific things. Architecture work should name modules after these terms
and reach for one that already lives here before inventing a new one.
Keep it tight — a glossary, not a handbook. Product posture lives in
`PRODUCT_BOUNDARY.md`; voice in `VOICE_GUIDE.md`.

## The shape of the thing

Bearings is a non-directive companion for informed choice and personal
reflection around an intense experience. People prepare, reflect, or get
their bearings — before, in between, or after. Nothing is required and
nothing is owed to the experience. Local-first by default: nothing leaves
the device without an explicit, user-initiated action.

## Content

- **Shelf** — one of `before`, `between`, `integration`, `learn`. An open
  shelf of standalone cards, not a program with a start and an end. There
  is no "next" card and no completion state.
- **Card** — a standalone piece of content on a shelf. Carries a horizon,
  motivations, a tone, and optional sourcing. Belongs to a shelf because
  of when it tends to be relevant, never because of a sequence.
- **Horizon** — optional timing metadata on a card: when its content tends
  to be relevant (e.g. `weeks-before`, `first-days`, `months-after`).
  Advisory grouping only. Never a step, never numbered, never "next".
- **Motivation** — one of seven equal-weight reasons a person might be
  here (`curious`, `play`, `close`, `awe`, `difficult`, `support`,
  `unsure`). No path is default, elevated, or visually privileged.
- **Tone** — a subtle presentation quality on a card (`practical`,
  `reflective`, `risk`, `ambiguity`). Never a value ranking; `ambiguity`
  is first-class content.
- **Reflection prompt** — an optional, always-skippable prompt a card may
  surface. Authored ahead, rendered only where it belongs.

## The session track

- **Session** — INFERRED from note timestamps, never declared. Nobody
  clicks "start" or "end". Notes that land close together in time are one
  session.
- **Held question** — a question a person sharpens and saves before an
  experience. Lives as a Session record. May be **pending** — saved but
  not yet written against.
- **Sharpener** — the deterministic, ungraded set of checks run on a draft
  held question before a session. It sharpens; it never gates. Every step
  offers "keep it anyway."
- **Stage** — a phase of a session's capture flow: `raw` (first ~18h),
  `interview` (days 1–4, four fixed questions), `integration` (terminal).
  Always overridable by hand.
- **Note** — a user-authored text entry. May link to a card it was written
  from and/or to the session, stage, and prompt it answered.

## Other private things a person keeps

- **Anchor** — a private, self-authored question with a 0–10 scale the
  person defines for themselves, logged as a plain dated list. Explicitly
  not a score, not an instrument, never a trend line.
- **Reading** — one dated 0–10 value on the anchor.
- **Ledger entry** — a decision written down at a stated certainty, held
  until a self-chosen review date, then marked against what actually
  happened (`holds` / `dropped` / `refined`). The cooling-off ledger.
  Pull-only: nothing schedules a reminder; it surfaces when the page opens.

## Posture

- **Local-first** — data stays on the device. No default analytics, no
  third-party scripts. "Delete everything on this device" must clear every
  key the app writes, or the privacy promise is a lie.
- **Voice** — calm, adult, specific, condition-action not command. Some
  cliché phrases are mechanically forbidden (see `VOICE_GUIDE.md` and
  `scripts/lint-phrases.js`); a few are human-review-only by design.

## Architectural module names

Added here lazily as deepened modules are named, so a name means one thing
across the codebase. (Vocabulary for talking *about* modules — module,
interface, depth, seam, adapter, leverage, locality — is the shared design
vocabulary, not domain language, and is not duplicated here.)

- **storage** (`src/lib/storage.ts`) — the deep module behind every
  persisted thing. Owns the key registries, the per-key shapes, and the
  only access path: `load` / `save` / `clear` / `wipe`. A backing-store
  seam lets tests swap in an in-memory adapter. `wipe()` is what makes
  "delete everything on this device" structural rather than conventional.
