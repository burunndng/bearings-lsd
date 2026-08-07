# Integration Build-out Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an evidence-honest integration technique shelf (10 cards), 2 learn entries, and a `/resources` page to Bearings, with phase-2 journal-prompt hooks stored but not rendered.

**Architecture:** Pure content + one schema extension + one static page. All content lives in Astro content collections with zod-validated frontmatter; the new `resources` collection mirrors the existing `learn` pattern. No JavaScript behavior changes; no new dependencies.

**Tech Stack:** Astro 7 (content collections, glob loader), zod via `astro/zod`, bun. Lint gates: `lint:phrases`, `lint:links`, `lint:review`, `astro check`, `astro build`.

**Spec:** `docs/superpowers/specs/2026-08-02-integration-buildout-design.md`
**Source packet (verified citations):** `docs/superpowers/specs/2026-08-02-integration-sources.md`

## Global Constraints

- Voice: condition-action ("you may want to consider…"), never command. Specific over warm-vague. Uncertainty named. No promises. (VOICE_GUIDE.md)
- Every factual claim traceable to a `sources` frontmatter entry; source URLs must be absolute http(s) (schema-enforced).
- No technique framed as required, sequenced, or scored. No "next", no numbering shown to users, no completion semantics. (PRODUCT_BOUNDARY.md hard commitments)
- `horizon` metadata is advisory grouping only — never a sequence.
- Safety-adjacent card (`when-its-not-settling`, `riskLevel: elevated`) ships as `draft: true` until clinician review; the zod superRefine mechanically blocks non-draft elevated content without `reviewedBy`/`reviewedOn`.
- Local-first: no third-party scripts; outbound links are user-initiated by definition.
- Every Robinson et al. 2024 percentage is labeled self-report, N=608, and "meditation and prayer" / breathing (11%) vs yoga/tai chi (10%) are never conflated.
- Forbidden-phrase lint must pass on all new files, including aria-labels and placeholders. Escape hatch: a line ending in `voice:allow` (visible, grep-able) — do not use it in this build-out; nothing here needs to quote forbidden phrases.
- Verification after every task: `bun run lint && bun run lint:review && bun run check && bun run build` must all pass.
- Commits: one per task, message format `content: <task summary>` or `feat: <task summary>` for schema/page work.

---

### Task 1: Schema — `promptText` on cards + `resources` collection

**Files:**
- Modify: `src/content.config.ts` (cards schema ~line 126; append resources collection before the export at line 227)
- Create: `src/content/resources/` (empty dir, populated in Task 2)

**Interfaces:**
- Produces: `cards` schema gains `promptText: string | undefined` (max 400 chars). New `resources` collection entries expose `name, url?, kind, access, description, caveat?, order, lastVerified` — consumed by Task 3's page.

- [ ] **Step 1: Add `promptText` to the cards schema**

Insert directly after the `optionalPrompt` line (`optionalPrompt: z.boolean().default(false),`):

```ts
      /* phase 2 hook: the reflection prompt this card will surface
         inside Notes. Authored now, NOT rendered anywhere yet —
         CardNote ignores it until the journal-prompts build-out. */
      promptText: z.string().max(400).optional(),
```

- [ ] **Step 2: Add the resources collection**

Insert before `export const collections`, and add `resources` to the export:

```ts
/* Resources: vetted outside support and reading. lastVerified is
   required — a stale link is a content bug, and the date is shown
   to users so they can judge freshness for themselves.
   url is optional: books are cited, not linked. */
const resources = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/resources" }),
  schema: z.object({
    name: z.string(),
    url: z
      .string()
      .refine((v) => /^https?:\/\/\S+$/.test(v), {
        message: "Resource url must be an absolute http(s) URL",
      })
      .optional(),
    kind: z.enum(["peer-line", "directory", "hub", "reading"]),
    access: z.enum(["free", "paid", "mixed"]),
    description: z.string().max(280),
    caveat: z.string().max(280).optional(),
    order: z.number().default(0),
    lastVerified: z.coerce.date(),
  }),
});
```

Change the last line to:

```ts
export const collections = { cards, safety, learn, resources };
```

- [ ] **Step 3: Verify**

Run: `bun run check`
Expected: 0 errors (an empty `src/content/resources/` directory is valid for the glob loader).

- [ ] **Step 4: Commit**

```bash
git add src/content.config.ts src/content/resources
git commit -m "feat: add promptText hook to cards, resources collection"
```

---

### Task 2: Resources content entries (6 files)

**Files:**
- Create: `src/content/resources/fireside-project.md`
- Create: `src/content/resources/psychedelic-support.md`
- Create: `src/content/resources/maps-integration-station.md`
- Create: `src/content/resources/zendo-project.md`
- Create: `src/content/resources/integration-circles.md`
- Create: `src/content/resources/reading.md`

**Interfaces:**
- Consumes: `resources` schema from Task 1.
- Produces: six entries the Task 3 page renders, grouped by `kind`.

- [ ] **Step 1: Verify the two URLs not checked on 2026-08-02**

Run: `curl -sI -o /dev/null -w "%{http_code}\n" https://www.globalpsychedelicsociety.org/`
Expected: `200` (or a redirect chain ending 200). If it fails, drop the aggregator name from `integration-circles.md`'s description and keep only "community aggregators".

- [ ] **Step 2: Write the six entries**

`fireside-project.md`:

```markdown
---
name: "Fireside Project"
url: "https://firesideproject.org"
kind: peer-line
access: free
description: "Free, confidential peer support line for during and after a psychedelic experience. Call or text 623-473-7433 (US). In published data, 65.9% of callers de-escalated from psychological distress."
caveat: "US-based. Check the site for current hours."
order: 10
lastVerified: 2026-08-02
---
```

`psychedelic-support.md`:

```markdown
---
name: "Psychedelic.Support"
url: "https://psychedelic.support"
kind: directory
access: free
description: "A directory of therapists and coaches who work with psychedelic integration, free to browse."
caveat: "There is no certification standard in this field. Ask directly about licensure and specific experience before deciding."
order: 20
lastVerified: 2026-08-02
---
```

`maps-integration-station.md`:

```markdown
---
name: "MAPS Integration Station"
url: "https://maps.org/integration-station/"
kind: hub
access: free
description: "A free education hub, including the MAPS Integration Workbook and a synthesized model of integration practices."
order: 30
lastVerified: 2026-08-02
---
```

`zendo-project.md`:

```markdown
---
name: "Zendo Project"
url: "https://zendoproject.org"
kind: hub
access: mixed
description: "Harm-reduction education on supporting people through difficult experiences, including a sitting and integration training course."
caveat: "Courses are paid; educational materials are free."
order: 40
lastVerified: 2026-08-02
---
```

`integration-circles.md`:

```markdown
---
name: "Integration circles"
url: "https://www.globalpsychedelicsociety.org/"
kind: directory
access: free
description: "Free or donation-based peer groups that meet — in person and online — to talk experiences through. Community aggregators such as the Global Psychedelic Society list them."
caveat: "Groups vary widely. You can leave any group that pushes an agenda, spiritual or otherwise."
order: 50
lastVerified: 2026-08-02
---
```

`reading.md`:

```markdown
---
name: "Reading"
kind: reading
access: paid
description: "Aixalá, Psychedelic Integration (2022, Synergetic Press) — the most comprehensive clinical treatment. Fadiman, The Psychedelic Explorer's Guide (2011, Park Street Press) — the foundational practical handbook; some framing is dated, the core advice is not."
order: 60
lastVerified: 2026-08-02
---
```

- [ ] **Step 3: Verify**

Run: `bun run lint && bun run check`
Expected: phrase lint clean; astro check 0 errors (schema accepts all six entries).

- [ ] **Step 4: Commit**

```bash
git add src/content/resources
git commit -m "content: vetted resources entries with lastVerified dates"
```

---

### Task 3: `/resources` page + nav wiring

**Files:**
- Create: `src/pages/resources.astro`
- Modify: `src/layouts/BaseLayout.astro` (section union ~line 17-24; nav array ~line 33-40)
- Modify: `src/pages/integration.astro` (add resources link beside the notes link, ~line 30)

**Interfaces:**
- Consumes: `resources` collection entries (`name, url?, kind, access, description, caveat?, lastVerified`) from Task 2.
- Produces: route `/resources`; nav item id `resources` used as `section` prop.

- [ ] **Step 1: Extend the layout**

In `BaseLayout.astro`, add `"resources"` to the `section` prop union (after `"learn"`), and add to the `nav` array between Learn and Notes:

```ts
  { href: "/resources", label: "Resources", id: "resources" },
```

- [ ] **Step 2: Create the page**

`src/pages/resources.astro`:

```astro
---
/* ============================================================
   Bearings — Resources
   Vetted outside support and reading. Links are user-initiated
   by definition (local-first holds); verification dates are
   shown so visitors can judge freshness themselves.
   ============================================================ */
import BaseLayout from "../layouts/BaseLayout.astro";
import { getCollection } from "astro:content";

const entries = (await getCollection("resources")).sort(
  (a, b) => a.data.order - b.data.order,
);

const KIND_LABELS: Record<string, string> = {
  "peer-line": "Someone to talk to",
  directory: "Finding people",
  hub: "Education",
  reading: "Reading",
};
const KIND_ORDER = ["peer-line", "directory", "hub", "reading"];

const groups = KIND_ORDER.map((kind) => ({
  kind,
  label: KIND_LABELS[kind],
  items: entries.filter((e) => e.data.kind === kind),
})).filter((g) => g.items.length > 0);

const fmt = (d: Date) =>
  d.toLocaleDateString("en-CA", { year: "numeric", month: "long" });
---

<BaseLayout title="Resources — Bearings" section="resources">
  <section class="reading">
    <p class="kicker">{entries.length} links · dates checked shown</p>
    <h1>Resources</h1>
    <p class="lede">
      Outside support and further reading. Nothing here is required, and
      nothing on this page can see you — a link only does anything if you
      choose it.
    </p>
  </section>

  {
    groups.map((group) => (
      <section class="group" aria-labelledby={`k-${group.kind}`}>
        <h2 class="group-h" id={`k-${group.kind}`}>
          {group.label}
        </h2>
        <ul class="shelf">
          {group.items.map((e) => (
            <li class="card resource">
              <h3>
                {e.data.url ? (
                  <a href={e.data.url} rel="noopener noreferrer">
                    {e.data.name}
                  </a>
                ) : (
                  e.data.name
                )}
              </h3>
              <p>{e.data.description}</p>
              {e.data.caveat && <p class="caveat">{e.data.caveat}</p>}
              <p class="meta-line">
                {e.data.access} · checked {fmt(e.data.lastVerified)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    ))
  }

  <p class="section-note">
    The evidence behind the practices themselves lives in{" "}
    <a href="/learn/what-is-known-about-integration">Learn</a>.
  </p>
</BaseLayout>

<style>
  .reading {
    margin-top: var(--space-5);
  }
  .lede {
    margin-bottom: var(--space-5);
  }
  .group {
    margin-bottom: var(--space-6);
  }
  .group-h {
    font-family: var(--font-meta);
    font-size: var(--size-meta);
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--ink-faint);
    font-weight: 400;
    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--rule);
    margin-bottom: var(--space-3);
  }
  .resource {
    padding: var(--space-3) var(--space-4);
  }
  .caveat {
    color: var(--ink-soft);
    font-size: var(--size-sm);
  }
  .meta-line {
    font-family: var(--font-meta);
    font-size: var(--size-meta);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-faint);
  }
</style>
```

Note: `--size-sm`, `--radius`, and the meta tokens already exist in `src/styles/tokens.css`; `.shelf`/`.card` are global classes from `src/styles/global.css`. If `astro check` flags a missing token, use the closest existing token from `tokens.css` rather than inventing one.

- [ ] **Step 3: Link from the integration shelf**

In `src/pages/integration.astro`, change the notes-link paragraph to:

```astro
    <p class="notes-link">
      <a href="/notes">Open private notes</a> ·{" "}
      <a href="/resources">Outside support and reading</a>
    </p>
```

- [ ] **Step 4: Verify**

Run: `bun run lint && bun run check && bun run build`
Expected: all pass; `dist/resources/index.html` exists in the build output.

- [ ] **Step 5: Commit**

```bash
git add src/pages/resources.astro src/layouts/BaseLayout.astro src/pages/integration.astro
git commit -m "feat: resources page with vetted links and verification dates"
```

---

### Task 4: Solo technique cards 1–4

**Files:**
- Create: `src/content/cards/sitting-with-it.md`
- Create: `src/content/cards/writing-things-down.md`
- Create: `src/content/cards/reading-about-it.md`
- Create: `src/content/cards/moving-the-body.md`

**Interfaces:**
- Consumes: cards schema incl. `promptText` (Task 1).
- Produces: four `shelf: integration` cards; `writing-things-down` exposes the first `promptText` for phase 2.

Copy below is final unless the voice editor changes it. Every card states its own evidence; no card references "the card above".

- [ ] **Step 1: Write the four cards**

`sitting-with-it.md`:

```markdown
---
title: "Sitting with it"
shelf: integration
motivations: ["difficult", "unsure", "curious"]
tone: reflective
horizon: first-weeks
order: 10
summary: "Quiet attention is the most common thing people turn to on their own. No technique is required."
sources:
  - cite: "Robinson, O. C. et al. (2024). Coming back together: coping and support strategies after extended difficulties. Frontiers in Psychology."
    url: "https://doi.org/10.3389/fpsyg.2024.1369715"
    year: 2024
  - cite: "Gorman, I. et al. (2021). Psychedelic Harm Reduction and Integration: A transtheoretical model. Frontiers in Psychology."
    url: "https://doi.org/10.3389/fpsyg.2021.645246"
    year: 2021
---

Some people find it helps to spend a few quiet minutes with whatever an
experience left behind — not to force meaning out of it, just to let it be
present without immediately doing anything about it.

There is no required method. For some this looks like meditation; for
others it is a slow walk without headphones, or lying still for a while.
In one survey of 608 people who had extended difficulties after psychedelic
use, meditation and prayer was the individual strategy most often reported
as helpful (27%). That is self-report, not a clinical trial — it tells you
what people turned to, not what is proven to work.

If stillness makes things feel worse, that is useful information, not a
failure. Try something else on this shelf, or nothing at all.
```

`writing-things-down.md`:

```markdown
---
title: "Writing things down"
shelf: integration
motivations: ["difficult", "curious", "unsure"]
tone: reflective
horizon: first-days
order: 20
optionalPrompt: true
promptText: "If one image, feeling, or moment from the experience is still with you, describe it in a few plain sentences — what it was, and nothing about what it means."
summary: "Writing is the most widely recommended way to look at an experience on paper. The research behind it is thinner than the reputation."
sources:
  - cite: "Robinson, O. C. et al. (2024). Coming back together: coping and support strategies after extended difficulties. Frontiers in Psychology."
    url: "https://doi.org/10.3389/fpsyg.2024.1369715"
    year: 2024
  - cite: "Bathje, G. J., Majeski, E., & Kudowor, M. (2022). Psychedelic integration: An analysis of the concept and its practice. Frontiers in Psychology."
    url: "https://doi.org/10.3389/fpsyg.2022.824077"
    year: 2022
---

Writing things down is recommended by nearly every integration guide, from
clinical protocols to harm-reduction organizations. In one survey of 608
people with extended difficulties after psychedelic use, 11% named
journaling as helpful — self-report again, and there are no
psychedelic-specific trials of expressive writing.

There is no correct form. Some people write freely for ten minutes. Some
record dreams in the days after. Some write a letter they never send. If
you want a private place, your [notes](/notes) live on this device and go
nowhere else.

You may want to consider writing only what happened and how it felt, and
leaving what it means alone for now. Meaning tends to be more useful when
it arrives on its own.
```

`reading-about-it.md`:

```markdown
---
title: "Reading about it"
shelf: integration
motivations: ["curious", "unsure", "difficult"]
tone: reflective
horizon: first-weeks
order: 30
summary: "Other people's accounts can make your own feel less strange. Reading is a legitimate thing to do with an experience."
sources:
  - cite: "Robinson, O. C. et al. (2024). Coming back together: coping and support strategies after extended difficulties. Frontiers in Psychology."
    url: "https://doi.org/10.3389/fpsyg.2024.1369715"
    year: 2024
---

Reading what others have lived through — research accounts, careful
journalism, other people's plain descriptions — is one of the more common
things people do after an intense experience. In one survey of 608 people
with extended difficulties, 14% said reading helped. Much of that seems to
be simple recognition: this has happened to other people too.

Other people's accounts are not proof of anything, and yours does not need
to match them. If you want vetted starting points, the
[resources](/resources) page lists reading and research, and the
[learn](/learn) shelf covers what is actually known.

If reading starts to feel like measuring your experience against someone
else's, it is fine to stop.
```

`moving-the-body.md`:

```markdown
---
title: "Moving the body"
shelf: integration
motivations: ["difficult", "play"]
tone: practical
horizon: first-days
order: 40
summary: "Walking, stretching, breathing slowly. The body is part of how people settle — the evidence is survey-level, and that is stated."
sources:
  - cite: "Robinson, O. C. et al. (2024). Coming back together: coping and support strategies after extended difficulties. Frontiers in Psychology."
    url: "https://doi.org/10.3389/fpsyg.2024.1369715"
    year: 2024
  - cite: "Gorman, I. et al. (2021). Psychedelic Harm Reduction and Integration: A transtheoretical model. Frontiers in Psychology."
    url: "https://doi.org/10.3389/fpsyg.2021.645246"
    year: 2021
---

After an intense experience, many people find the body is the easier door.
In one survey of 608 people with extended difficulties, 12% named exercise
as helpful, 11% breathing strategies, and 10% embodied practices like yoga
or tai chi. Self-report, no controlled trials — but consistent with what
clinicians in this field recommend.

Nothing athletic is required. A walk, unhurried. Breathing slowly, longer
out than in. Stretching on the floor. Warm water. These are not treatments;
they are ways of being a bit more comfortable in yourself while things
settle.

If movement stirs things up rather than settling them, ease off. Gentler
is the point.
```

- [ ] **Step 2: Verify**

Run: `bun run lint && bun run check && bun run build`
Expected: all pass; the four cards appear in the integration shelf count.

- [ ] **Step 3: Commit**

```bash
git add src/content/cards
git commit -m "content: solo integration cards 1-4 (sitting, writing, reading, moving)"
```

---

### Task 5: Solo technique cards 5–8

**Files:**
- Create: `src/content/cards/ordinary-days.md`
- Create: `src/content/cards/time-outside.md`
- Create: `src/content/cards/making-things.md`
- Create: `src/content/cards/wait-before-big-decisions.md`

- [ ] **Step 1: Write the four cards**

`ordinary-days.md`:

```markdown
---
title: "Ordinary days"
shelf: integration
motivations: []
tone: practical
horizon: first-days
order: 50
summary: "Sleep, food, routine, ordinary days. Normalcy is not avoidance — people report it genuinely helps."
sources:
  - cite: "Robinson, O. C. et al. (2024). Coming back together: coping and support strategies after extended difficulties. Frontiers in Psychology."
    url: "https://doi.org/10.3389/fpsyg.2024.1369715"
    year: 2024
---

Not everything after an experience is about the experience. Sleep, regular
food, work, dishes, seeing the people you usually see — in one survey of
608 people with extended difficulties, this kind of ordinary routine was
among the things people said helped. The researchers called it task-based
coping; most people would call it getting on with the week.

Returning to normal life is not avoiding the experience. For many people
it is exactly how the experience finds its proper size — one thing that
happened, among everything else that is happening.

Rest, warmth, and simple food can help in the days after. You do not have
to work on anything.
```

`time-outside.md`:

```markdown
---
title: "Time outside"
shelf: integration
motivations: ["awe", "play", "unsure"]
tone: reflective
horizon: first-weeks
order: 60
summary: "Time outdoors is commonly recommended and lightly researched. A park counts."
sources:
  - cite: "Gandy, S. et al. (2020). The potential synergistic effects between psychedelic administration and nature contact. Health Psychology Open."
    url: "https://doi.org/10.1177/2055102920978123"
    year: 2020
  - cite: "Robinson, O. C. et al. (2024). Coming back together: coping and support strategies after extended difficulties. Frontiers in Psychology."
    url: "https://doi.org/10.3389/fpsyg.2024.1369715"
    year: 2024
---

Spending time outside — a park, water, trees, whatever is near — is
recommended across the integration literature, and 10% of people in one
survey of 608 with extended difficulties named it as helpful. Researchers
have proposed that nature contact and psychedelic experiences may
reinforce each other for mental health, but that is early theory, not
established finding.

No wilderness is required. Sitting outside with a hot drink counts. The
point, if there is one, is scale: things that are bigger than you and ask
nothing of you.
```

`making-things.md`:

```markdown
---
title: "Making things"
shelf: integration
motivations: ["awe", "play", "curious"]
tone: reflective
horizon: first-weeks
order: 70
summary: "Drawing, music, making things — widely endorsed, basically unresearched. Skill is irrelevant."
sources:
  - cite: "Bathje, G. J., Majeski, E., & Kudowor, M. (2022). Psychedelic integration: An analysis of the concept and its practice. Frontiers in Psychology."
    url: "https://doi.org/10.3389/fpsyg.2022.824077"
    year: 2022
---

Integration guides often suggest making something — drawing, painting,
music, collage — as a way of staying with an experience without putting it
into words. It is one of the most commonly endorsed practices in the
literature, and one of the least studied. Nobody has shown that it works;
many people find it worthwhile anyway.

Skill is irrelevant here — the drawing is not for anyone. If the
experience had images, colors, or a texture to it, some people find those
easier to move onto paper than into sentences.

If making things is not how you process anything, skip this one. It is a
shelf, not a curriculum.
```

`wait-before-big-decisions.md`:

```markdown
---
title: "Wait before big decisions"
shelf: integration
motivations: ["difficult", "unsure"]
tone: practical
horizon: first-weeks
order: 80
summary: "An intense experience can make big changes feel urgent. The research consensus is plain: let them wait."
sources:
  - cite: "Bathje, G. J., Majeski, E., & Kudowor, M. (2022). Psychedelic integration: An analysis of the concept and its practice. Frontiers in Psychology."
    url: "https://doi.org/10.3389/fpsyg.2022.824077"
    year: 2022
---

After a significant experience, people sometimes feel a strong pull to act
immediately — end a relationship, quit a job, move somewhere new, or tell
everyone they know that they have to try this too.

The integration literature is unusually consistent here: it advises
against major life decisions in the days and weeks right after an
experience. The feeling of certainty is part of the experience's weather,
and weather passes. If a change still looks right in a month, it will
still be available in a month.

You may want to consider writing down what you want to change and why,
with the date. If it still holds later, you will have a head start on
doing it well.
```

- [ ] **Step 2: Verify**

Run: `bun run lint && bun run check && bun run build`
Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add src/content/cards
git commit -m "content: solo integration cards 5-8 (routine, nature, making, waiting)"
```

---

### Task 6: Social card + safety-adjacent card (draft)

**Files:**
- Create: `src/content/cards/talking-it-through.md`
- Create: `src/content/cards/when-its-not-settling.md`
- Modify: `src/content/cards/still-unresolved.md` (add `related`)

**Interfaces:**
- Produces: `when-its-not-settling` carries `safetyRoute: clinician` → renders the inline safety embed via the existing mechanism in `card/[slug].astro`, and `riskLevel: elevated` + `draft: true` → passes the zod superRefine but does not render until reviewed.

- [ ] **Step 1: Write the two cards**

`talking-it-through.md`:

```markdown
---
title: "Talking it through"
shelf: integration
motivations: ["close", "difficult", "support"]
tone: reflective
horizon: first-weeks
order: 90
summary: "If you want company in it: a trusted person, a peer group, or a professional. What helps is being heard, not advised."
sources:
  - cite: "Robinson, O. C. et al. (2024). Coming back together: coping and support strategies after extended difficulties. Frontiers in Psychology."
    url: "https://doi.org/10.3389/fpsyg.2024.1369715"
    year: 2024
---

Not everything on this shelf is solitary, and for some people the most
useful thing is another person. In one survey of 608 people with extended
difficulties after psychedelic use, talking with peers or community was
the support most often reported as helpful (34%); professional therapy or
coaching was named by 18%. What people valued was being heard without
judgment — not being interpreted, and not being advised.

A trusted friend who can simply listen is a real option. Integration
circles — free or donation-based groups that exist for exactly this — are
another; the [resources](/resources) page explains what they are and how
people find them.

If you look for a professional, know that many clinicians have little
experience with psychedelics. Directories exist, but there is no
certification standard — it is reasonable to ask directly about someone's
experience before deciding.
```

`when-its-not-settling.md`:

```markdown
---
title: "When it's not settling"
shelf: integration
motivations: ["difficult", "unsure"]
tone: risk
horizon: months-after
order: 95
safetyRoute: clinician
riskLevel: elevated
draft: true
related: ["still-unresolved"]
summary: "Most experiences settle on their own. When one does not — weeks of anxiety, unreality, or disrupted sleep — that is worth real support."
sources:
  - cite: "Evans, J. et al. (2023). Extended difficulties following the use of psychedelic drugs: A mixed methods study. PLOS ONE."
    url: "https://doi.org/10.1371/journal.pone.0293349"
    year: 2023
  - cite: "Robinson, O. C. et al. (2024). Coming back together: coping and support strategies after extended difficulties. Frontiers in Psychology."
    url: "https://doi.org/10.3389/fpsyg.2024.1369715"
    year: 2024
---

Most difficult feelings after an experience fade over days or weeks.
Sometimes they do not. In one study of 608 people with extended
difficulties, about a third were still affected after a year.

Signs that it is worth talking with a qualified professional:

- anxiety, fear, or a sense of unreality that is not fading after a few
  weeks
- sleep, work, or relationships being affected
- visual disturbances that persist
- using alcohol or other drugs to manage how you feel — this tends to help
  in the short term and make things harder over time

None of this means something is permanently wrong. It means the experience
has not finished settling, and that is something professionals can
genuinely help with. If things feel urgent, or you might be at risk of
harm, the [safety](/safety) page has direct routes.

Seeking support is not a failure to integrate. It is one of the ways
people integrate.
```

- [ ] **Step 2: Cross-link the existing card**

In `src/content/cards/still-unresolved.md`, add to frontmatter (after `order: 20`):

```yaml
related: ["when-its-not-settling"]
```

Note: `card/[slug].astro` resolves `related` against all cards but filters drafts, so this renders no link until the draft ships — never a dead link, and `lint:links` accepts it.

- [ ] **Step 3: Verify**

Run: `bun run lint && bun run lint:review && bun run check && bun run build`
Expected: all pass; `when-its-not-settling` does NOT appear in `dist/card/` (draft); the build does not fail the elevated-content superRefine (draft is the escape valve).

- [ ] **Step 4: Commit**

```bash
git add src/content/cards
git commit -m "content: talking-it-through card; when-its-not-settling staged as draft pending clinician review"
```

---

### Task 7: Learn entries (2)

**Files:**
- Create: `src/content/learn/what-integration-is-and-isnt.md`
- Create: `src/content/learn/what-is-known-about-integration.md`

- [ ] **Step 1: Write the two entries**

`what-integration-is-and-isnt.md`:

```markdown
---
title: "What integration is and isn't"
summary: "Looking back at an experience, making what sense of it you can, and carrying whatever matters into ordinary life. Nothing is owed."
order: 20
lastReviewed: 2026-08-02
sources:
  - cite: "Bathje, G. J., Majeski, E., & Kudowor, M. (2022). Psychedelic integration: An analysis of the concept and its practice. Frontiers in Psychology."
    url: "https://doi.org/10.3389/fpsyg.2022.824077"
    year: 2022
  - cite: "Aixalá, M. (2022). Psychedelic Integration: Psychotherapy for Non-Ordinary States of Consciousness. Synergetic Press."
    year: 2022
---

Integration is the word this field uses for what happens after: revisiting
an experience, making what sense of it you can, and incorporating anything
that matters into your life. That is a synthesis of 24 published
definitions (Bathje and colleagues, 2022) — and even the researchers note
the term has no single agreed meaning.

Two things are true at once. Some people genuinely want change or
understanding from an experience, and integration practices are how many
pursue that. And nobody owes an experience anything — no insight, no
narrative, no better self. An experience you simply had is complete.

What integration is not: a task with a deadline, a sign that something
went wrong, or a requirement for having been there at all. The
[integration shelf](/integration) holds the practices people commonly use,
with the evidence for each stated plainly. Take what helps; leave the
rest.
```

`what-is-known-about-integration.md`:

```markdown
---
title: "What is actually known about integration practices"
summary: "Every major model recommends integration practices. Almost none have been tested in controlled trials. Here is the honest landscape."
order: 30
lastReviewed: 2026-08-02
sources:
  - cite: "Bathje, G. J., Majeski, E., & Kudowor, M. (2022). Psychedelic integration: An analysis of the concept and its practice. Frontiers in Psychology."
    url: "https://doi.org/10.3389/fpsyg.2022.824077"
    year: 2022
  - cite: "Evans, J. et al. (2023). Extended difficulties following the use of psychedelic drugs: A mixed methods study. PLOS ONE."
    url: "https://doi.org/10.1371/journal.pone.0293349"
    year: 2023
  - cite: "Robinson, O. C. et al. (2024). Coming back together: coping and support strategies after extended difficulties. Frontiers in Psychology."
    url: "https://doi.org/10.3389/fpsyg.2024.1369715"
    year: 2024
  - cite: "Gorman, I. et al. (2021). Psychedelic Harm Reduction and Integration: A transtheoretical model. Frontiers in Psychology."
    url: "https://doi.org/10.3389/fpsyg.2021.645246"
    year: 2021
---

Integration is universally recommended — built into clinical trial
protocols, every harm-reduction organization, and every major model — and
almost none of it has been tested in controlled research. As of recent
reviews, there is no controlled comparative research on any integration
approach. That is the honest starting point.

What exists instead:

- Clinical practice models (Gorman and colleagues, 2021) describing how
  therapists support integration — based on practice, not trials.
- Survey research. The largest relevant dataset followed 608 people who
  had extended difficulties after psychedelic use (Evans and colleagues,
  2023) and documented what they said helped (Robinson and colleagues,
  2024): peer and community support (34%), meditation and prayer (27%),
  reading (14%), exercise (12%), breathing strategies (11%), journaling
  (11%), embodied practices like yoga (10%), and time in nature (10%).
  Self-report from people who struggled — useful signal, not proof.
- Long-standing practice consensus, catalogued by Bathje and colleagues
  (2022).

We state this because you deserve to know what "recommended" rests on.
These practices are low-risk and commonly valued. They are not treatments
with a demonstrated effect, and no one should promise you otherwise.
```

- [ ] **Step 2: Verify**

Run: `bun run lint && bun run check && bun run build`
Expected: all pass; both entries appear on `/learn` with review dates.

- [ ] **Step 3: Commit**

```bash
git add src/content/learn
git commit -m "content: learn entries on integration definition and evidence landscape"
```

---

### Task 8: Final verification and boundary read

**Files:**
- Read-only pass over all files created in Tasks 2–7.

- [ ] **Step 1: Full gate**

Run: `bun run lint && bun run lint:review && bun run check && bun run build`
Expected: all pass; build reports the new pages (`/resources`, 9 new live cards, 2 learn entries).

- [ ] **Step 2: Boundary read**

Open `PRODUCT_BOUNDARY.md` and read every new card against the hard commitments, checking specifically:
- No technique framed as required or sequenced (spot-check `order` is not user-visible: ShelfList renders no numbers — confirm by reading built HTML for the integration page).
- "That is enough" card unchanged and still first-class.
- Equal-weight chooser untouched (`MotivationChooser.svelte` unmodified in this build-out).

- [ ] **Step 3: Visual check**

Run `bun run dev`, visit `/integration`, `/learn`, `/resources`, `/card/writing-things-down`, `/card/when-its-not-settling` (expect 404 — draft) in both themes.
Expected: new cards grouped under advisory horizon labels; resources page shows groups and "checked August 2026"; no layout regressions.

- [ ] **Step 4: Commit**

```bash
git commit --allow-empty -m "content: integration build-out verified against product boundary"
```

---

## Phase 2 (named direction, NOT in this plan)

Notes surfaces a card's `promptText` as an optional, skippable starting point — extending `CardNote.svelte`/`Journal.svelte`, fully local via the existing idb-keyval store. `promptText` is authored and stored in phase 1 (Task 4) so no content is re-authored. Phase 2 gets its own brainstorm → spec → plan cycle.
