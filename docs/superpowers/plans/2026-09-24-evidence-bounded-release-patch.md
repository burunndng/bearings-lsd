# Evidence-Bounded Release Patch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore trustworthy private persistence and offline access while making Learn, Worksheets, Resources, and Deep Work first-class parts of the product again.

**Architecture:** Keep `src/lib/storage.ts` as the only persistence boundary, normalize proxy-backed values before IndexedDB writes, commit component state only after persistence succeeds, and broadcast wipes to reload other tabs. Register the generated PWA assets explicitly, keep safety referrals server-rendered with a network-first enhancement, and restructure navigation around six content pillars while moving private tools into a secondary menu.

**Tech Stack:** Astro 7, Svelte 5, TypeScript, Bun, idb-keyval, @vite-pwa/astro, Playwright, CSS custom properties.

## Global Constraints

- Preserve the product boundaries and condition-action voice in `PRODUCT_BOUNDARY.md` and `VOICE_GUIDE.md`.
- Do not rewrite clinical, crisis, legal, or product-policy meaning without qualified human review.
- Keep `between` at zero authored cards.
- Keep all data local by default; do not add analytics, third-party scripts, or remote requests outside the existing same-origin referral endpoint.
- Add regression evidence for every reproduced P0/P1 failure.
- Do not commit unless explicitly requested.

---

### Task 1: Make private persistence trustworthy

**Files:**
- Modify: `src/lib/storage.ts`
- Modify: `src/lib/storage.test.ts`
- Modify: `src/components/Journal.svelte`
- Modify: `src/components/Anchor.svelte`
- Modify: `src/components/SessionTracker.svelte`
- Modify: `src/components/CoolingLedger.svelte`
- Modify: `src/components/StrategyReflection.svelte`

**Interfaces:**
- Produces: a JSON-safe normalization boundary inside storage writes.
- Produces: component persist helpers returning `Promise<boolean>`.
- Produces: same-tab wipe broadcasts that reload other Bearings tabs.

- [ ] Add a failing storage test that saves a recursively proxied notes value and expects a detached persisted value.
- [ ] Normalize structured values before `idb-keyval.set` and before memory-backed writes.
- [ ] Change component persist helpers to save first, update state second, clear stale errors on success, and return success.
- [ ] Keep user drafts visible and suppress success announcements when persistence fails.
- [ ] Broadcast a wipe event after every registered key is cleared; reload other tabs when received.
- [ ] Run `bun test src/lib/storage.test.ts` and `bun test`.

### Task 2: Register the PWA and make referral freshness real

**Files:**
- Create: `src/pwa.ts`
- Create: `src/components/ReferralList.svelte`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/pages/safety.astro`
- Modify: `src/components/StrategyReflection.svelte`

**Interfaces:**
- `src/pwa.ts` calls `registerSW({ immediate: true })` from `virtual:pwa-register`.
- `BaseLayout.astro` injects `pwaInfo.webManifest.linkTag` and registers `/src/pwa.ts`.
- `ReferralList` accepts server-rendered referral data and refreshes it from `/referrals.json` without removing the fallback.

- [ ] Register the service worker and inject the generated manifest link.
- [ ] Add explicit favicon and Apple touch icon links.
- [ ] Build and assert every page contains the manifest and registration module.
- [ ] Move the existing referral list directly below the urgent handoff.
- [ ] Add a same-origin fetch enhancement with timeout and embedded fallback.
- [ ] Show all referral regions in the Strategy crisis panel.
- [ ] Run `bun run build && bun run lint:csp`.

### Task 3: Restore navigation and foreground the core pillars

**Files:**
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/learn.astro`
- Modify: `src/pages/sheet.astro`
- Modify: `src/pages/sheet/preparation.astro`
- Modify: `src/pages/sheet/session-focus.astro`
- Modify: `src/pages/sheet/integration.astro`
- Modify: `src/content/learn/four-lenses-snapshot.md`
- Modify: `src/content/learn/settlement-ledger.md`

**Interfaces:**
- Primary navigation: Before, In between, Integration, Learn, Worksheets, Resources.
- Secondary Tools menu: Combinations, Notes, Sessions, Strategy, Settings.
- `/learn#deep-work` is the stable deep-work destination.

- [ ] Replace the closed-details desktop workaround with independent desktop and mobile navigation structures.
- [ ] Add the `sheet` section identifier and mark every sheet route as the current Worksheets section.
- [ ] Add a homepage “Go deeper” group linking Worksheets, Deep Work, and Resources.
- [ ] Group Learn entries into evidence-first entries and a dedicated Deep Work section.
- [ ] Mark the four-lenses and settlement-ledger entries with `tone: deep`.
- [ ] Keep every printable route and its print/save-as-PDF control visible from `/sheet`.
- [ ] Verify keyboard order, current-page state, 390px navigation, and 1440px navigation in Chromium.

### Task 4: Repair safety access, reflow, and accessibility

**Files:**
- Modify: `src/pages/safety.astro`
- Modify: `src/pages/combinations.astro`
- Modify: `src/components/Sheet.svelte`
- Modify: `src/components/SafetyFooter.astro`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/global.css`
- Modify: `src/components/SessionTracker.svelte`
- Modify: `src/components/Anchor.svelte`
- Modify: `src/components/CoolingLedger.svelte`
- Modify: `src/pages/learn/[slug].astro`
- Modify: `src/components/ShelfFilter.svelte`

**Interfaces:**
- All critical pages fit a 320px viewport without horizontal document overflow.
- Reduced-motion mode removes decorative loops while preserving short state feedback.

- [ ] Add `min-width: 0` and intrinsic-width containment to safety, combination, and sheet grids.
- [ ] Collapse two-column sheet controls below 30rem.
- [ ] Keep a compact single-line SafetyFooter on small screens and reserve enough main padding for it.
- [ ] Add the explicit garnet and no-glow values to the system-light token block.
- [ ] Restore visible keyboard focus outlines on text, date, range, and textarea controls.
- [ ] Replace global 0.01ms transition annihilation with targeted reduced-motion overrides.
- [ ] Preserve table headers semantically while visually reflowing narrow tables.
- [ ] Hide empty horizon groups after filtering.
- [ ] Run contrast checks and 320px browser reflow tests.

### Task 5: Reduce payload and dependency risk

**Files:**
- Modify: `src/layouts/BaseLayout.astro`
- Create: `public/img/s3rke-logo.webp`
- Delete: `public/img/hex-mesh.png`
- Delete: `public/img/scarab.jpg`
- Modify: `package.json`
- Modify: `bun.lock`

**Interfaces:**
- Header contributor mark remains visually present at 28px with a payload under 10KB.
- Astro remains on major version 7.

- [ ] Resize and compress the contributor mark to a 56px WebP source.
- [ ] Remove unreferenced shipped assets from the PWA precache.
- [ ] Update Astro and compatible transitive dependencies.
- [ ] Run `bun audit`, `bun run build`, and Lighthouse on `/` and `/safety`.

### Task 6: Add release-level browser regression coverage

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/browser/release.spec.ts`
- Modify: `package.json`
- Modify: `bun.lock`

**Interfaces:**
- `bun run test:browser` builds and serves the production output, then runs Chromium release scenarios.

- [ ] Assert desktop primary navigation and the Worksheets route are visible.
- [ ] Assert Learn, Deep Work, Worksheets, and Resources are reachable from the homepage within one interaction.
- [ ] Assert two Journal notes, two ledger decisions, and two Strategy readings survive reloads.
- [ ] Assert wiping from Settings removes data and reloads another open tab.
- [ ] Assert manifest registration, service-worker readiness, and offline `/safety` access.
- [ ] Assert no horizontal overflow at 320px on safety, combinations, and sheets.
- [ ] Run `bun run test:browser` and retain failure artifacts outside the repository.

### Task 7: Full verification

**Files:**
- No source changes expected.

- [ ] Run `bun run lint`.
- [ ] Run `bun run check`.
- [ ] Run `bun test`.
- [ ] Run `bun run build`.
- [ ] Run `bun run lint:csp`.
- [ ] Run `bun run test:browser`.
- [ ] Run `bun audit` and record any remaining upstream advisories.
- [ ] Capture desktop, 390px mobile, dark, and light screenshots for home, Learn, Worksheets, Safety, Notes, and Strategy.
- [ ] Re-run the Impeccable detector once on changed targets and verify every finding in context.
- [ ] Report remaining human review blockers without silently changing them.
