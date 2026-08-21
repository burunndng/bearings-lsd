# Psychedelic Sessions — Interaction Design

> Local-first companion for psychedelic preparation and integration.
> Two interactive features, [REDACTED]-triggered, evidence-based, no network.

## Goal

A privacy-first web app that helps a person prepare for and integrate a
psychedelic experience through two interactive, on-device features:

1. **Preparation** — an Intention-Setting Journal plus a Guided Visualization
   Selector.
2. **Integration** — a Real-Time Emotion & Insight Tracker with a Decision
   Ledger.

## Why these features (evidence-based)

- **Preparation matters most.** Research on psychedelic outcomes consistently
  shows that preparation and the "set and setting" around the experience
  account for more of the variance in outcome than the drug itself. Intentions
  set beforehand and brief guided practices (breath, body scan, grounding)
  are among the most replicated, low-risk preparatory tools.
- **Integration is where benefit consolidates.** People who actively process
  emotion and record reflections/decisions in the days after an experience
  show better, more durable outcomes than those who do nothing. A lightweight
  "decision ledger" counters the common failure where someone feels certain
  about a big choice in the days after and later cannot recall why.

## Hard constraints

- **Local-first.** Nothing leaves the device. No analytics, no third-party
  scripts, no network calls. `connect-src 'none'` by posture.
- **Calm, adult, non-directive voice.** Condition-action, never command.
  All prompts optional and skippable. No progress bars, streaks, or scores.
- **Single source of truth for storage.** One registry module owns every
  persisted key; "delete everything on this device" clears all of them.
- **Accessible.** Keyboard operable, screen-reader friendly, motion-respecting.
- **No build step required** to keep the surface minimal and auditable (vanilla
  ES modules + a small static server). Logic is split into pure, testable
  modules.

## Feature 1 — Preparation

**Intention-Setting Journal**
- Write 1–3 intentions (free text). Optionally start from a small deck of
  evidence-informed prompt cards (e.g. "What do I most want to feel?",
  "What am I carrying that I'd like to set down?", "Who or what do I want
  to be kinder to?").
- Saved locally; shown back verbatim before the experience if the person
  returns.

**Guided Visualization Selector**
- A curated set of short, text-led practices: Breath Anchor (4-7-8 paced
  breathing), Body Scan, Letting Go, Grounding. Each is a timed,
  on-screen pacer with written guidance — no audio assets required.
- Selecting one starts an in-app, dismissible session. No tracking.

## Feature 2 — Integration

**Emotion & Insight Tracker**
- On-demand (and optionally daily) check-in: a 0–10 self-defined mood/state
  marker plus a free-text insight note. Explicitly NOT a score; the meaning
  is the person's own.
- Listed chronologically; exportable as plain text.

**Decision Ledger**
- Record a decision made during/after the experience, a 1–10 self-defined
  certainty, and a self-chosen review date. Pull-only: nothing schedules a
  notification. Open the page later and any entry past its review date is
  surfaced with a gentle question ("What surprised you?", "What feels
  different now?"). Mark `holds` / `dropped` / `refined`.

## Data model

- `ps-intentions`: { id, text, createdAt }[]
- `ps-visualizations`: static (no persistence needed)
- `ps-checkins`: { id, mood, note, createdAt }[]
- `ps-ledger`: { id, decision, certainty, decidedAt, reviewAt, outcome?, reviewedAt?, refinement? }[]

## Architecture

- `index.html` — app shell, two views (Prep / Integrate), nav.
- `src/storage.js` — single registry + load/save/clear/wipe over localStorage.
- `src/prep.js` — intention journal + visualization selector logic/UI.
- `src/integration.js` — check-in tracker + decision ledger logic/UI.
- `src/ledger.js` — pure functions: `dueForReview`, `recurringThemes`.
- `src/app.js` — view switching.
- `tests/*.test.js` — bun:test for pure logic (storage wipe, ledger due,
  session helpers).
- No framework, no dependencies, no network.

## Testing

- Pure modules (`storage`, `ledger`) covered by bun:test unit tests.
- Manual smoke: open the app, set intentions, run a visualization, add a
  check-in, add a ledger entry, wipe all.
