# AGENTS.md — Bearings

Internal working context for agents working in this repository. This file
holds the problem and mission framing that is deliberately NOT user-facing.
Governance lives in `PRODUCT_BOUNDARY.md` (hard commitments), `VOICE_GUIDE.md`
(voice rules), `CONTEXT.md` (domain language). Those three are load-bearing;
this file is orientation.

## Problem & mission (internal)

Bearings exists because of a real, documented gap: people have profound
experiences — psychedelic or otherwise intense — and then face the ordinary
week after with no grounding and no pressure-free place to reflect.

The landscape, in four quadrants:

- **Individual, interior.** Insights from non-ordinary states often do not
  survive contact with Monday. People feel alienated or ungrounded when a
  peak experience does not translate into their daily life, and can end up
  chasing the next peak instead. Some people also use these experiences to
  bypass unresolved pain, which can look like growth from the outside.
  Bearings takes no position on what the experience meant, and offers no
  "better self" to become.
- **Individual, exterior.** Repeated exposure without time to settle can
  destabilize the nervous system and shrink the window of tolerance for
  ordinary stress. Deep experiences can also bring ontological shock — a
  fragmented sense of self — and without a place to reconcile the
  extraordinary with the physical, that gap widens. Bearings never claims
  to heal or stabilize anyone; it offers specific, practical material and
  honest limits.
- **Collective, interior.** Society still stigmatizes altered states, which
  limits open dialogue and shared learning. People often find their
  experiences invalidated by the people around them. Bearings cannot fix a
  culture; it can offer language that does not sound like a claim.
- **Collective, exterior.** Legal and regulatory barriers make safe access
  inconsistent, and professional integration support is often financially
  out of reach. Bearings is free, local-first, and non-clinical — it sits
  in the gap between "no support" and "expensive support".

The mission, in one sentence: **a non-directive companion for informed
choice and personal reflection around psychedelic preparation and
integration — and around other experiences that are intense in their own
way. Nothing is required and nothing is owed.**

## Working rules for agents

- Measure progress against the product's own gates, not against a hunch:
  `bun run lint:coverage` reports motivation/shelf spread and is a signal,
  not a gate. `bun run lint:release` is the full gate.
- Prefer strengthening the thinnest motivations (`close`, `support`,
  `play`) and the thinnest shelf (`before`, 5 non-draft cards) over
  padding already-dense ones (`difficult` 17, `unsure` 14).
- Every card needs: title, shelf, motivations (multi-select allowed),
  tone, optional horizon, summary, order (unique within its shelf+horizon
  group). Elevated risk requires reviewedBy + reviewedOn. Never invent
  sources; a card with no factual claim needs no sources at all.
- Voice is condition-action, never command. No forbidden phrases
  (`VOICE_GUIDE.md`); `bun run lint:phrases` enforces this mechanically.
- `between` shelf is capped at zero cards by a locked decision in
  PRODUCT_BOUNDARY.md — do not add cards there.
- Verify after any content change: `bun run lint && bun run check &&
  bun test`, plus `bun run build` if routes could change.