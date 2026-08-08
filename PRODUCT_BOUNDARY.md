# Product Boundary

This document is load-bearing, not decorative. Point to it in any meeting
that pressures the product toward drift.

## What Bearings is

A non-directive companion for informed choice and personal reflection
around psychedelic preparation and integration. Many people come here
for a session they are treating as something closer to therapeutic
work; some come from a place that is intense in its own way. People take
what helps and leave what does not.

## What Bearings is NOT

- **Not a therapist.** No clinical assessment, no diagnosis, no treatment.
- **Not a spiritual leader.** No prescribed meaning, no cosmology, no ceremony.
- **Not a safety gatekeeper.** It cannot screen, cannot approve, cannot clear
  anyone for anything. It provides direct, specific, actionable safety
  information and honest limits.
- **Not a self-optimization program.** No required intention, no breakthrough
  owed, no trauma narrative required, no "better self" to become. Nobody owes
  the experience anything.
- **Not an authority on Indigenous ceremonial traditions.** Secular,
  evidence-grounded defaults. Any cultural content must be community-led,
  contextualized, compensated, approved, and governed by the people from whom
  that knowledge comes — otherwise it does not ship.

## Core message

There is no required reason to be here. You can be preparing for or
integrating a psychedelic experience — or something else that is intense
in its own way — and you can simply get your bearings. Take what helps;
leave what does not.

## The reframe we hold

A psychedelic experience — or anything else intense in its own way —
can be enjoyable, confusing, connecting, hard, meaningful, ordinary, or
mixed. Preparation and reflection help a person make choices, care for
themselves and others, and decide if any part of it matters later. Two
ideas held together:

1. Some people do want therapeutic insight or change.
2. Nobody owes the experience a breakthrough, a trauma narrative, a spiritual
   interpretation, or a better self.

## Hard commitments (do not erode)

- No progress bars, streaks, badges, or "% integrated" scores.
- Equal-weight motivation chooser: no path is default, elevated, or visually
  privileged. "Healing" is not centered.
- Every introspective prompt is optional and skippable.
- No required disclosure of trauma, diagnosis, or relationship history to
  access basic guidance.
- Local-first data by default. Nothing leaves the device without an explicit,
  user-initiated action. No default analytics. No third-party scripts.
- Safety information is direct, specific, contextual — never buried, never
  moralizing, never promising an easy or safe experience.
- Voice: "You may want to consider…" never "You need to…" or "The right way is…"

## Scope: before / in between / integration

Before and integration are open shelves of standalone cards, not a program
with a start and an end. A card belongs to a shelf because of when its
content tends to be relevant (see `horizon` metadata), never because of a
sequence a person is expected to move through. There is no "next" card, no
completion state, and no visual weighting between horizon groups.

`between` covers the acute phase itself. It is deliberately capped at zero
authored cards: writing advice for someone to read while a psychedelic
experience is actively underway is a different, higher-risk kind of content
than anything else in the app, and this product does not yet have a basis
for authoring it safely. The page exists — it carries the urgent safety
handoff and gives that route a home that is not only the footer — but no
card content should ever be added to it without revisiting this decision
explicitly, not by incremental addition.

## Content review checklist addition

At each content review, check card counts per motivation across the
authored shelves. A motivation with very few or zero cards is not a launch
blocker on its own, but it is a signal that the equal-weight promise made by
the motivation chooser is drifting out of alignment with what actually
exists — and that gap should be visible to whoever is reviewing, not
discovered by a user.

Run `bun run lint:coverage` to get those numbers. It always exits 0 — the
paragraph above says this is a signal and not a launch blocker, so the
script is a report and not a gate. Making it fail a build is a change to
this document first and to `scripts/check-coverage.js` second, in that
order. It prints unconditionally, including when nothing looks wrong,
because a report that only speaks up when it judges something to be a
problem trains people to skim it and hides the trend between reviews.

## Launch gates (non-negotiable)

- Qualified clinician sign-off on all safety content.
- Legal review of the disclaimer and jurisdiction stance.

`bun run lint:review` enforces the first gate mechanically: every safety
entry, and every card or learn entry marked `riskLevel: elevated`, must
either be `draft: true` or carry both `reviewedBy` and `reviewedOn`.

It is deliberately NOT part of `bun run lint`. The inner-loop lint
(phrases, links, order) is meant to be green on every commit. This gate
is meant to stay red until a clinician has actually signed off, and a
gate that fails every commit trains people to route around it — the
route around this one is marking safety content `draft: true`, which
takes it off the site. Run `bun run lint:release` before shipping;
expect it to fail until sign-off exists.
