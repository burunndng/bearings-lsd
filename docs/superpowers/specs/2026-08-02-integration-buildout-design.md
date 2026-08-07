# Integration build-out — design spec

Date: 2026-08-02
Status: approved direction (approach B, phased), pending final user review of this document
Scope: research + spec + implementation plan only. No code in this phase.

## Decisions locked with the user

- Shape: **both, phased** — content build-out first, interactive tools later.
- Phase 2 first tool: **journal prompts** surfaced inside the existing Notes journal.
- Approach: **B** — technique cards + learn entries + a dedicated `/resources` page.
- Focus: **evidence-based techniques one can do independently**; social support
  included for honesty but not centered.
- Deliverable of this cycle: spec + in-depth implementation plan + verified
  source packet. Implementation begins only on explicit go-ahead.

## 1. Framing device (the honest core)

A 2024 review found no controlled comparative research for any integration
model. The build-out's spine: *"People commonly report these helpful. Formal
evidence is thin. Here is what is actually known."* Every technique card
carries a one-line evidence note; the second learn entry makes the
evidentiary landscape explicit. This is both the scientifically correct
position and the existing voice guide's "name uncertainty" principle.

## 2. Card set — independent techniques first, evidence-tiered

Ten new cards on the `integration` shelf. Display order follows reported
helpfulness in Robinson et al. 2024 (self-report, N=608, stated as such).
No technique framed as required; existing cards (`that-is-enough`,
`still-unresolved`) remain equal citizens. `horizon` stays advisory-only.

| # | Slug | Working title | Technique | Evidence note |
|---|------|---------------|-----------|---------------|
| 1 | sitting-with-it | "Sitting with it" | Meditation / contemplative practice | Most common individual strategy (27% — "meditation and prayer", self-report) |
| 2 | writing-things-down | "Writing things down" | Journaling / expressive writing; folds in dreamwork | Ubiquitously recommended, 11% report; no trials — says so. Links to Notes |
| 3 | reading-about-it | "Reading about it" | Self-education, others' accounts | 14%; normalizing effect documented |
| 4 | moving-the-body | "Moving the body" | Exercise, breathwork, yoga | Exercise 12%, breathing 11%, yoga/tai chi 10% (kept separate), survey-supported |
| 5 | ordinary-days | "Ordinary days" | Rest, sleep, routine, structure | "Task-based coping" genuinely helped; matches existing voice |
| 6 | time-outside | "Time outside" | Nature | 10%; proposed in literature, minimal research |
| 7 | making-things | "Making things" | Art, music, creative expression | Widely endorsed, unresearched — says so |
| 8 | wait-before-big-decisions | "Wait before big decisions" | Not acting on post-experience impulses | Explicit caution in Bathje 2022 (impulsive changes, premature evangelizing) |
| 9 | talking-it-through | "Talking it through" | Peer support, circles, therapy | Strongest real-world support (34%) — included for honesty, **not centered**; framed as "if you want company in it" |
| 10 | when-its-not-settling | "When it's not settling" | Recognizing when professional support is warranted; folds in alcohol-as-coping caution | Evans 2023, Robinson 2024. **Safety-adjacent: requires `riskLevel` + `reviewedBy`/`reviewedOn` — ships last, blocked on clinician sign-off per launch gates** |

Cross-linking: card 10 and the existing `still-unresolved` card link to each
other rather than overlapping.

## 3. Learn entries (2)

1. `what-integration-is-and-isnt` — Bathje 2022's synthesized definition
   (revisiting, making sense of, working through, incorporating) in plain
   language; both truths held (some people want change / nobody owes a
   breakthrough).
2. `what-is-known-about-integration` — the evidentiary landscape: universal
   endorsement, absence of controlled trials, where the self-report numbers
   come from. Sources: Bathje 2022, Robinson 2024, Evans 2023, Gorman 2021.

## 4. Resources page (`/resources`)

New static route plus a `resources` content collection.

Entry schema: `name, url, kind (peer-line | directory | reading | research),
access (free | paid | mixed), description (one factual line), caveat,
lastVerified (required — stale links are a content bug)`.

Initial set:

- **Fireside Project** — free US peer support line (call/text 623-473-7433);
  published outcome data (Pleet et al. 2023: 65.9% de-escalated).
  Caveats: US-only; current hours unverified — confirm at publish time.
- **Psychedelic.Support** — free-to-browse therapist directory.
  Caveat: no certification standard; verify licensure. (No circles directory
  on the site — circles route via community aggregators such as Global
  Psychedelic Society / Fireside's resource database.)
- **MAPS Integration Station** — free resource hub, incl. the MAPS
  Integration Workbook and the Bathje Synthesized Model.
- **Integration circles** — what they are, typically free/donation, found via
  the aggregators above.
- **Reading** — Aixalá, *Psychedelic Integration* (2022, Synergetic Press);
  Fadiman, *The Psychedelic Explorer's Guide* (2011, Park Street Press);
  key papers (see source packet) for those who want primary sources.

Local-first preserved: outbound links are user-initiated by definition. No
third-party scripts.

## 5. Schema changes (minimal)

- `cards`: add optional `promptText: string` — the phase 2 hook. Where a card
  naturally carries a reflective prompt, it is authored and stored in phase 1,
  invisible until phase 2.
- New `resources` collection per section 4.

## 6. Phase 2 direction (named, not built)

Journal prompts: Notes surfaces a card's `promptText` as an optional,
skippable starting point. Fully local (IndexedDB, as now). `promptText` lands
in phase 1 so no content is re-authored later.

## 7. Boundary & voice compliance gate (per card)

- No technique framed as required, sequenced, or scored; no progress
  metaphors of any kind.
- Condition-action voice ("you may want to consider"), never command.
- Uncertainty named in every evidence note; no promises.
- Forbidden-phrase lint passes, including aria-labels and placeholders.
- Card 10 does not ship without clinician review metadata per launch gates.

## 8. Verification

`bun run lint:phrases`, `bunx astro check`, `bun run build` clean; manual
read of each card against PRODUCT_BOUNDARY.md; every factual claim traceable
to a `sources` entry; `lastVerified` dates fresh at ship time.
