# Plan — Deep Integration Ideation (777 / Transcend / Integral / Jungian)

**Date:** 2026-08-20
**Status:** Ideation finalized (GoT rounds 1–2 complete) — revised 2026-08-20 after repo verification
**Owner:** Product / content
**Scope:** Content artifacts only. No route, component, or collection changes. The companion card lands on the existing `integration` shelf — a placement decision, not a code change.

## Goal

Develop a "pro‑level" but **non-directive, secular, safety-first** set of reflection
artifacts for psychedelic (and other intense) experience integration, drawing on four
lenses:

- **Jung** — image, transcendent function, shadow, active imagination.
- **Integral (AQAL)** — quadrants, states→traits, pre/trans fallacy.
- **Transpersonal / Grof / Maslow** — cartography, emergence vs. emergency, plateau.
- **777 / Hermetic Qabalah** — symbolic correspondence *as mnemonic only*.

Method used: **Graph‑of‑Thoughts** — wide root sweep → expansion → scoring against
guardrails → prune → merge → single chosen artifact.

## Hard constraints (verified against the repo, 2026-08-20)

- `between` shelf stays at **zero cards** — never place integration cards there.
- **Nothing ships that no shelf renders.** `/learn` renders only the `learn`
  collection (`learn.astro` filters `getCollection("learn")`); shelf pages render
  cards filtered by their own shelf. A card with `shelf: learn` is invisible
  everywhere and must not be authored. → `doorway.md` lives on the `integration`
  shelf.
- **Safety copy is a singleton.** The three safety routes already exist and are
  clinician-reviewed: `src/content/safety/{pause,clinician,urgent}`. Crisis copy is
  never re-derived: cards use the `safetyRoute` embed (renders the reviewed copy),
  learn entries link to the safety pages. A duplicated verbatim line would need its
  own review and would drift.
- Elevated‑risk content carries `reviewedBy` + `reviewedOn`, or `draft: true`.
  These artifacts default to `standard` risk — their safety surface is the reviewed
  embed/links, not new clinical claims. `draft: true` on the card until editor
  sign-off anyway (conservative).
- Voice is **condition‑action, never command**. No "must," no "you should," no
  "please." No emoji in safety-adjacent copy.
- 777/Qabalah is **symbolic language only** — always footnoted as Western‑esoteric,
  not a religious or factual claim.
- No dosing, sourcing, set/setting operational guidance.

## Finalized artifacts

### Artifact 1 — Four‑lens snapshot
**File:** `src/content/learn/four-lenses-snapshot.md` (descriptive slug per house
style: `what-integration-is-and-isnt.md`, not `scaffold.md`)
**Shape:** One‑page table — Jung (image) · Integral (shape) · Transpersonal (state) ·
777 (symbol, optional) → plain question: *"What, if anything, does this point toward
in an ordinary week — and what can be left alone?"*
**Safety wiring:** one calm link line to the safety pages (pointer, not restated copy).
**Risk:** `standard`. No factual claims → `sources: []` (add citations only if claims
are introduced at review).

### Artifact 1b — Doorway card (companion)
**File:** `src/content/cards/doorway.md`
**Frontmatter:** `shelf: integration` (renders on `/integration` — verified),
`horizon: first-weeks`, `motivations: [awe, difficult, unsure]`, `tone: reflective`,
`optionalPrompt: true` + `promptText` (captures the returning image at a single
moment), `safetyRoute: "clinician"` (renders the reviewed embed — zero duplication),
`related: []`, `draft: true`.
**Reachability:** renders on the integration shelf; `four-lenses-snapshot.md` links to
`/card/doorway` from its body.

### Artifact 2 — Settlement ledger
**File:** `src/content/learn/settlement-ledger.md`
**Shape:** Dated 3‑column log (felt‑true → still‑hums → ordinary‑life‑says) +
weekly function check (sleep/eat/show‑up; capacity vs. specialness).
**Safety wiring:** same single link line to the safety pages.
**Risk:** `standard`. Watches the insight *land* over time (state→trait trajectory).

The three compose: R1 is the palette, the card is a single capture moment,
R2 tracks whether the insight sticks — none of them a sequence.

## Rejected in GoT pruning (keep out)

- **Modular toggle lattice** — UI‑heavy, over‑engineered for v1.
- **Choose‑your‑own‑adventure** — gamifies integration; risks trivializing.
- **22‑card correspondence deck** — bloat; duplicates R1 card intent.
- **Coach‑profile report** — drifts toward directive coaching; scope risk.
- **Horizon planner** — too close to R1; not distinct enough to ship now.

## Implementation checklist

| # | Action | Owner | Gate |
|---|--------|-------|------|
| 1 | Write `four-lenses-snapshot.md` to `src/content/learn/` | content | lint green; renders at `/learn/four-lenses-snapshot` |
| 2 | Write `doorway.md` to `src/content/cards/` (`shelf: integration`, `draft: true`) | content | `astro check`; renders on `/integration` once published |
| 3 | Write `settlement-ledger.md` to `src/content/learn/` | content | lint green |
| 4 | Editor review of all three: voice, 777 provenance footnote, links, safety wiring | editor | before any `draft: false` |
| 5 | Clinician sign-off on `doorway.md` (`reviewedBy` + `reviewedOn`) before publish — conservative elevated-style gate even though `standard` | reviewer | before publish; the release gate stays red until sign-off exists, by design |
| 6 | `bun run lint && bun run check && bun test` after files land; `bun run lint:coverage` for the motivation-spread signal (report, not gate) | dev | must pass |
| 7 | Reflection entry point / nav link (separate approval — then `bun run build`, routes change) | dev | later |

## Open questions (not blocking)

- Fuse R1 + R2 into a single "integration workbook" page? (possible Round 3)
- Opt‑in "generate new question" affordance later — note: no third-party scripts, so
  any generator must run locally from an authored pool or it does not ship.
- PDF/image export of the ledger for offline use — local-first answer: a
  print-optimized view (print stylesheet already exists in `src/styles/`); no PDF
  generator without a server.

## Safety wiring (the red‑flag line, replaced by mechanism)

The earlier "verbatim, reuse everywhere" line was removed: it duplicated
clinician-reviewed copy, mixed its list grammar, and used "please" + an emoji.
Instead:

- **Cards:** `safetyRoute: "clinician"` (or `pause` / `urgent` where apt) — the
  embed renders the reviewed safety entry. No copy to maintain.
- **Learn entries:** one calm pointer line, e.g. *"If sleep, eating, work, or
  ordinary days start to feel unmanageable, the [safety pages](/safety) are a
  place to start."* — a pointer with links, never restated guidance.
- **Rule:** crisis copy exists once, in `src/content/safety/*`. New artifacts link
  or embed; they never restate.