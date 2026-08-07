# Content Audit Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the ten findings from the 2026-08-04 content audit: two shipped 404s, three unenforced-in-practice lint gates, and seven content/sourcing defects.

**Architecture:** Two new pure-function lint gates (inline body links, order collisions) with unit tests, one `package.json` script rewiring, and targeted content edits. No new dependencies, no runtime behavior change, no schema change except one optional `sources` field on `resources`. Scripts gain an `import.meta.main` guard so their logic is importable and testable — the same seam idea as `storage.ts`.

**Tech Stack:** Astro 7 (content collections, glob loader), zod via `astro/zod`, bun + `bun test`. Gates: `lint:phrases`, `lint:links`, `lint:order`, `lint:review`, `astro check`, `astro build`.

**Audit source:** conversation of 2026-08-04. Governing docs: `PRODUCT_BOUNDARY.md`, `VOICE_GUIDE.md`, `CONTEXT.md`.

## Execution record — 2026-08-04

Tasks 1–9 executed and verified. Task 10 not executed: it requires a clinician.

**No commits were made.** The working directory is not a git repository (`git rev-parse` fails), so every task's `git add`/`git commit` step was skipped. All file changes are on disk, uncommitted and untracked.

Final state: `bun run lint` green (phrases 79 files, links 28 cards + 8 learn + 3 safety, order 45 entries), `bun run check` 0 errors / 0 warnings, `bun test` 30 pass / 0 fail, `bun run build` 40 pages. `bun run lint:release` fails on exactly three entries — the three unreviewed safety files — which is the launch gate reporting an unmet launch condition.

Three corrections made to this plan against the real repository during execution:

1. The safety files are `clinician.md`, `pause.md`, `urgent.md`. Task 10's queue originally named `before-you-go-further.md` and `when-to-get-help.md`, which do not exist.
2. There are 6 pre-existing `draft: true` cards awaiting review, not 4, and they span both the `before` and `integration` shelves.
3. `how-often-things-go-badly` and `using-alone-what-is-known` do not declare `riskLevel` at all — they inherit `"standard"` from the schema default, so Task 10 Step 4 adds a line rather than editing one.

Task 2's test file holds 12 tests, not the 11 stated in Step 4 — a miscount when the plan was written, not a missing case.

One pre-existing diagnostic is left untouched as out of scope: `src/lib/storage.test.ts:91` raises `ts(80007)` (`'await' has no effect on the type of this expression`). It predates this work.

## Global Constraints

- Voice: condition-action ("you may want to consider…"), never command. Specific over warm-vague. Uncertainty named as uncertainty. No promises. (`VOICE_GUIDE.md`)
- Every factual claim traceable to a `sources` entry; source URLs absolute http(s) (schema-enforced). A claim that cannot be sourced gets removed or reworded, never softened into vagueness while keeping its authority.
- No sequence semantics anywhere: no "next", no numbering shown to users, no completion state. `horizon` and `order` are advisory only. (`PRODUCT_BOUNDARY.md` hard commitments)
- Draft content is authored but never rendered. `draft: true` is the correct home for anything awaiting review — it is not a workaround.
- Renaming a content file changes a public URL. **Do not rename any `.md` file in this plan.** Titles change; slugs do not.
- Forbidden-phrase lint must pass on every edited file, including `aria-label` and `placeholder` attributes. Do not use the `voice:allow` escape hatch in this plan; nothing here needs to quote a forbidden phrase.
- Verification after every task: `bun run lint && bun run check && bun test` must pass. `bun run build` after any task touching content or schema.
- Commits: one per task. `fix:` for the two 404s, `feat:` for new gates, `content:` for content edits, `chore:` for script wiring.
- Tasks 1–9 are independent of clinician availability and can all land. Task 10 is blocked on a human reviewer and is the only task that cannot be completed by an engineer.

---

### Task 1: Inline body-link gate, and the two 404s it catches

`lint:links` prints `✓ All related links resolve across 27 cards` while two links 404 in production, because it only parses the `related:` frontmatter array. `card/[slug].astro:46` guards `related` links against draft targets; markdown body links have no equivalent guard. Build the gate first so it fails, then fix the content — the gate failing is the test.

**Files:**
- Modify: `scripts/lint-links.js` (add exports + `import.meta.main` guard + inline-link pass)
- Create: `scripts/lint-links.test.ts`
- Modify: `src/content/learn/using-alone-what-is-known.md:43-44`
- Modify: `src/content/learn/how-often-things-go-badly.md:35-38`

**Interfaces:**
- Produces: `scripts/lint-links.js` exports `stripFrontmatter(text): string`, `isDraft(text): boolean`, `bodyLinkTargets(text): string[]`, `resolveBodyLink(href, {cardIds, learnIds, staticRoutes}): string | null` (returns a problem description, or `null` when the link resolves). Task 2's `lint-order.js` reuses the same `walk`/frontmatter style but shares no code.

- [ ] **Step 1: Write the failing test**

Create `scripts/lint-links.test.ts`:

```ts
import { expect, test, describe } from "bun:test";
import {
  stripFrontmatter,
  isDraft,
  bodyLinkTargets,
  resolveBodyLink,
} from "./lint-links.js";

const CTX = {
  cardIds: new Set(["that-is-enough", "doing-this-alone"]),
  draftCardIds: new Set(["doing-this-alone"]),
  learnIds: new Set(["the-weeks-after"]),
  draftLearnIds: new Set<string>(),
  staticRoutes: new Set(["/safety", "/notes", "/before"]),
};

describe("stripFrontmatter", () => {
  test("removes the frontmatter block so frontmatter urls are not scanned", () => {
    const text = `---\nurl: "https://example.com/x"\n---\n\nBody [a](/safety).\n`;
    expect(stripFrontmatter(text)).not.toContain("example.com");
    expect(stripFrontmatter(text)).toContain("/safety");
  });

  test("returns text unchanged when there is no frontmatter", () => {
    expect(stripFrontmatter("plain body")).toBe("plain body");
  });
});

describe("isDraft", () => {
  test("true only when draft: true is in the frontmatter", () => {
    expect(isDraft(`---\ndraft: true\n---\nbody`)).toBe(true);
    expect(isDraft(`---\ndraft: false\n---\nbody`)).toBe(false);
    expect(isDraft(`---\ntitle: "x"\n---\nbody`)).toBe(false);
  });

  test("ignores the word draft in the body", () => {
    expect(isDraft(`---\ntitle: "x"\n---\nI wrote a draft: true story.`)).toBe(
      false,
    );
  });
});

describe("bodyLinkTargets", () => {
  test("finds root-relative markdown links, ignoring external ones", () => {
    const text = `---\ntitle: "t"\n---\nSee [a](/card/that-is-enough) and [b](https://x.com) and [c](/safety).`;
    expect(bodyLinkTargets(text)).toEqual(["/card/that-is-enough", "/safety"]);
  });

  test("finds a link split across a wrapped line", () => {
    const text = `---\ntitle: "t"\n---\nSee [Doing this\nalone](/card/doing-this-alone) for more.`;
    expect(bodyLinkTargets(text)).toEqual(["/card/doing-this-alone"]);
  });
});

describe("resolveBodyLink", () => {
  test("resolves a published card", () => {
    expect(resolveBodyLink("/card/that-is-enough", CTX)).toBeNull();
  });

  test("rejects a card that exists but is draft — this is the shipped 404", () => {
    expect(resolveBodyLink("/card/doing-this-alone", CTX)).toBe(
      'links to "/card/doing-this-alone" — that card is draft: true, so no page is built for it',
    );
  });

  test("rejects a card id that does not exist at all", () => {
    expect(resolveBodyLink("/card/nope", CTX)).toBe(
      'links to "/card/nope" — no card with that id',
    );
  });

  test("resolves a known static route", () => {
    expect(resolveBodyLink("/safety", CTX)).toBeNull();
  });

  test("rejects an unknown static route", () => {
    expect(resolveBodyLink("/sfaety", CTX)).toBe(
      'links to "/sfaety" — no such page',
    );
  });

  test("resolves a published learn entry", () => {
    expect(resolveBodyLink("/learn/the-weeks-after", CTX)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test scripts/lint-links.test.ts`
Expected: FAIL — `SyntaxError: export 'stripFrontmatter' not found in './lint-links.js'` (the script currently exports nothing).

- [ ] **Step 3: Add the pure functions and the main guard to `scripts/lint-links.js`**

Update the header comment block — the old one describes only the `related` pass:

```js
/* ============================================================
   Bearings — Link linter
   Two passes, because there are two ways a dead link ships.

   1. `related` (content.config.ts) is z.array(z.string()) — a bare
      string id with no referential integrity from Zod. A typo is a
      silent dead link a reader hits mid-shelf.

   2. Root-relative markdown links in card/learn/safety BODIES.
      These have no schema behind them at all, and unlike `related`
      (which card/[slug].astro filters against drafts before
      rendering) nothing filters a body link. A body link to a
      draft card is a 404 in production: getStaticPaths skips
      drafts, so the page is never built.

   Pass 2 is why this file exports its internals — see
   scripts/lint-links.test.ts.

   Run: bun run lint:links    Exit 1 on any violation.
   ============================================================ */
```

Add these exports after the existing `readRelated` function (keep `walk` and `readRelated` as they are):

```js
/* Everything below the frontmatter block. Frontmatter carries source
   URLs and is validated by Zod; scanning it here would flag citations
   as if they were page links. */
export function stripFrontmatter(text) {
  const m = text.match(/^---\r?\n[\s\S]*?\r?\n---/);
  return m ? text.slice(m[0].length) : text;
}

export function isDraft(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? /^draft:\s*true\s*$/m.test(m[1]) : false;
}

/* Root-relative markdown link targets in the body. [\s\S] in the label
   so a link whose text wraps across a newline is still matched — the
   content is hard-wrapped at ~76 chars, so this is the common case,
   not an edge case. */
export function bodyLinkTargets(text) {
  const body = stripFrontmatter(text);
  const out = [];
  for (const m of body.matchAll(/\[[\s\S]*?\]\((\/[^)\s]*)\)/g)) {
    out.push(m[1]);
  }
  return out;
}

/* Returns a problem description, or null when the link resolves. */
export function resolveBodyLink(href, ctx) {
  const { cardIds, draftCardIds, learnIds, draftLearnIds, staticRoutes } = ctx;
  const path = href.replace(/#.*$/, "").replace(/\/$/, "") || "/";

  const card = path.match(/^\/card\/(.+)$/);
  if (card) {
    const id = card[1];
    if (!cardIds.has(id)) return `links to "${href}" — no card with that id`;
    if (draftCardIds.has(id)) {
      return `links to "${href}" — that card is draft: true, so no page is built for it`;
    }
    return null;
  }

  const learn = path.match(/^\/learn\/(.+)$/);
  if (learn) {
    const id = learn[1];
    if (!learnIds.has(id)) return `links to "${href}" — no learn entry with that id`;
    if (draftLearnIds.has(id)) {
      return `links to "${href}" — that learn entry is draft: true, so no page is built for it`;
    }
    return null;
  }

  if (staticRoutes.has(path)) return null;
  return `links to "${href}" — no such page`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun test scripts/lint-links.test.ts`
Expected: PASS, 12 tests.

- [ ] **Step 5: Wire the second pass into the script body**

Replace everything from `const files = walk(CARDS_DIR);` to the end of the file with:

```js
const LEARN_DIR = join(ROOT, "src/content/learn");
const SAFETY_DIR = join(ROOT, "src/content/safety");
const PAGES_DIR = join(ROOT, "src/pages");

/* Static routes are derived from src/pages rather than hardcoded, so
   adding or removing a page cannot leave this list quietly wrong.
   Dynamic segments ([slug]) are excluded — those are resolved by id
   against the collections instead. */
function staticRoutesFromPages(dir, prefix = "") {
  const out = new Set();
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      for (const r of staticRoutesFromPages(full, `${prefix}/${name}`)) out.add(r);
      continue;
    }
    if (extname(full) !== ".astro" || name.includes("[")) continue;
    const stem = basename(name, ".astro");
    out.add(stem === "index" ? prefix || "/" : `${prefix}/${stem}`);
  }
  return out;
}

const cardFiles = walk(CARDS_DIR);
const learnFiles = walk(LEARN_DIR);
const safetyFiles = walk(SAFETY_DIR);

const read = (f) => readFileSync(f, "utf8");
const idOf = (f) => basename(f, ".md");

const cardIds = new Set(cardFiles.map(idOf));
const draftCardIds = new Set(cardFiles.filter((f) => isDraft(read(f))).map(idOf));
const learnIds = new Set(learnFiles.map(idOf));
const draftLearnIds = new Set(learnFiles.filter((f) => isDraft(read(f))).map(idOf));
const staticRoutes = staticRoutesFromPages(PAGES_DIR);
const ctx = { cardIds, draftCardIds, learnIds, draftLearnIds, staticRoutes };

const problems = [];

/* Pass 1: related ids (cards only — only cards have `related`). */
for (const file of cardFiles) {
  const rel = file.replace(ROOT, "");
  const id = idOf(file);
  for (const target of readRelated(read(file))) {
    if (target === id) {
      problems.push(`${rel}  related links to itself: "${target}"`);
      continue;
    }
    if (!cardIds.has(target)) {
      problems.push(`${rel}  related id not found: "${target}"`);
    }
  }
}

/* Pass 2: root-relative body links across all three rendered
   collections. A draft file's own body is still checked: it will be
   published eventually, and a dead link found now is cheaper than one
   found after review. */
const bodyFiles = [...cardFiles, ...learnFiles, ...safetyFiles];
for (const file of bodyFiles) {
  const rel = file.replace(ROOT, "");
  const text = read(file);
  for (const href of bodyLinkTargets(text)) {
    const problem = resolveBodyLink(href, ctx);
    if (problem) problems.push(`${rel}  ${problem}`);
  }
}

if (import.meta.main) {
  if (problems.length > 0) {
    console.error("Link check failed:\n");
    for (const p of problems) console.error(`  ✗ ${p}`);
    console.error(`\n${problems.length} broken link(s).`);
    process.exit(1);
  }
  console.log(
    `✓ Links resolve: ${cardFiles.length} cards (related + body), ` +
      `${learnFiles.length} learn, ${safetyFiles.length} safety.`,
  );
}
```

- [ ] **Step 6: Run the gate and watch it catch the two shipped 404s**

Run: `bun run lint:links`
Expected: FAIL, exit 1, exactly these two problems:

```
  ✗ src/content/learn/using-alone-what-is-known.md  links to "/card/doing-this-alone" — that card is draft: true, so no page is built for it
  ✗ src/content/learn/how-often-things-go-badly.md  links to "/card/recognizing-a-hard-experience" — that card is draft: true, so no page is built for it
```

If any *other* problem appears, stop and investigate — it means a link this audit did not find is also broken, which is a finding, not a bug in the gate.

- [ ] **Step 7: Fix the first 404 by inlining what the link promised**

The linked card is draft and cannot be published in this task (it needs clinician review — Task 10). Removing the link while keeping the sentence would leave a dangling promise, so replace the cross-reference with the substance it was pointing at.

In `src/content/learn/using-alone-what-is-known.md`, replace the closing paragraph (lines 43-44):

```markdown
If you are using alone, see [Doing this alone](/card/doing-this-alone) for
what that specifically removes and what you can do about it.
```

with:

```markdown
If you are using alone, the specific things a present person would
otherwise catch — noticing a physical problem, calling for help if you
cannot, telling you afterward what actually happened — become yours to
plan around instead. Telling one person when to expect to hear from you,
keeping a phone charged and reachable, and choosing a space you will not
need to leave are the plainest versions of that.
```

- [ ] **Step 8: Fix the second 404 the same way**

In `src/content/learn/how-often-things-go-badly.md`, replace lines 35-38:

```markdown
by it. See [Recognizing a hard experience](/card/recognizing-a-hard-experience)
for a plain list of what that can look like, and [Consider pausing or
reconsidering](/safety) for what to do if something about your situation
raises the odds of one.
```

with:

```markdown
by it. What that research names, plainly: fear out of proportion to any
present danger, a feeling of losing control, grief, isolation, physical
distress, paranoia, insight that overwhelmed rather than clarified, and a
sense that your own self had changed or gone missing. If something about
your situation raises the odds of a hard experience, [Consider pausing or
reconsidering](/safety) covers what is worth weighing.
```

- [ ] **Step 9: Verify the gate now passes**

Run: `bun run lint:links && bun run lint:phrases && bun test && bun run build`
Expected: all pass. Build output should still contain `dist/learn/using-alone-what-is-known/index.html` and `dist/learn/how-often-things-go-badly/index.html`.

- [ ] **Step 10: Commit**

```bash
git add scripts/lint-links.js scripts/lint-links.test.ts \
  src/content/learn/using-alone-what-is-known.md \
  src/content/learn/how-often-things-go-badly.md
git commit -m "fix: two body links to draft cards 404'd in production

lint:links only parsed the related: array, so it reported success on a
class of link it never inspected. Adds a body-link pass over cards,
learn, and safety, resolving /card/ and /learn/ ids against non-draft
entries and everything else against src/pages. Replaces the two dead
cross-references with the content they promised."
```

---

### Task 2: Order-collision gate, and unique `learn` order values

Every `learn` order value is duplicated — 10, 10, 20, 20, 30, 30, 40, 50 — and `learn.astro:12` sorts on `order` alone, so each pair lands in arbitrary collection order. This is exactly the bug the cards schema fixed deliberately by defaulting `order: 999` (`content.config.ts:149-157`); learn never got the same treatment. Cards, safety, and resources have **no** collisions today (verified), so the gate will pass on them immediately and hold that line.

**Files:**
- Create: `scripts/lint-order.js`
- Create: `scripts/lint-order.test.ts`
- Modify: all 8 files in `src/content/learn/` (frontmatter `order:` only)
- Modify: `package.json` (add `lint:order`)

**Interfaces:**
- Consumes: nothing from Task 1 (deliberately no shared module — these two scripts stay independent so either can be read alone).
- Produces: `scripts/lint-order.js` exports `readOrder(text): number`, `readKey(text, key): string | null`, `groupKeyFor(collection, fm): string`, `findCollisions(entries): string[]` where `entries` is `Array<{rel, group, order}>`.

- [ ] **Step 1: Write the failing test**

Create `scripts/lint-order.test.ts`:

```ts
import { expect, test, describe } from "bun:test";
import {
  readOrder,
  readKey,
  groupKeyFor,
  findCollisions,
} from "./lint-order.js";

describe("readOrder", () => {
  test("reads an explicit order", () => {
    expect(readOrder(`---\ntitle: "t"\norder: 25\n---\nbody`)).toBe(25);
  });

  test("defaults to 999 when absent, matching the cards schema default", () => {
    expect(readOrder(`---\ntitle: "t"\n---\nbody`)).toBe(999);
  });

  test("ignores an order-looking line in the body", () => {
    expect(readOrder(`---\ntitle: "t"\n---\norder: 3 in the body`)).toBe(999);
  });
});

describe("readKey", () => {
  test("reads and unquotes a scalar", () => {
    expect(readKey(`---\nshelf: before\n---\nb`, "shelf")).toBe("before");
    expect(readKey(`---\nroute: "pause"\n---\nb`, "route")).toBe("pause");
  });

  test("returns null when the key is absent", () => {
    expect(readKey(`---\ntitle: "t"\n---\nb`, "horizon")).toBeNull();
  });
});

describe("groupKeyFor", () => {
  test("cards group by shelf and horizon — order is only meaningful inside a group", () => {
    expect(groupKeyFor("cards", { shelf: "before", horizon: "day-of" })).toBe(
      "shelf=before horizon=day-of",
    );
  });

  test("a card with no horizon groups with the other untimed cards on its shelf", () => {
    expect(groupKeyFor("cards", { shelf: "integration", horizon: null })).toBe(
      "shelf=integration horizon=(none)",
    );
  });

  test("safety groups by route", () => {
    expect(groupKeyFor("safety", { route: "pause" })).toBe("route=pause");
  });

  test("learn and resources are each one flat ordered list", () => {
    expect(groupKeyFor("learn", {})).toBe("(collection)");
    expect(groupKeyFor("resources", {})).toBe("(collection)");
  });
});

describe("findCollisions", () => {
  test("reports two entries sharing an order within a group", () => {
    const problems = findCollisions([
      { rel: "a.md", group: "(collection)", order: 10 },
      { rel: "b.md", group: "(collection)", order: 10 },
    ]);
    expect(problems).toEqual([
      'order: 10 is used by 2 entries in (collection) — a.md, b.md. Sort order between them is arbitrary.',
    ]);
  });

  test("the same order in different groups is fine", () => {
    expect(
      findCollisions([
        { rel: "a.md", group: "shelf=before horizon=day-of", order: 10 },
        { rel: "b.md", group: "shelf=integration horizon=first-days", order: 10 },
      ]),
    ).toEqual([]);
  });

  test("lists every colliding file, not just the first two", () => {
    const problems = findCollisions([
      { rel: "a.md", group: "g", order: 5 },
      { rel: "b.md", group: "g", order: 5 },
      { rel: "c.md", group: "g", order: 5 },
    ]);
    expect(problems[0]).toContain("3 entries");
    expect(problems[0]).toContain("a.md, b.md, c.md");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test scripts/lint-order.test.ts`
Expected: FAIL — module `./lint-order.js` does not exist.

- [ ] **Step 3: Write `scripts/lint-order.js`**

```js
/* ============================================================
   Bearings — Order-collision gate
   `order` decides what a reader sees first. Two entries sharing an
   order value inside the same group means their relative position is
   decided by filesystem enumeration, not by an editor — and it can
   change between builds without anyone touching content.

   The cards schema already defends against a related failure by
   defaulting order to 999 so an omission sorts last rather than
   silently leading its group (content.config.ts:149-157). This is the
   other half: an explicit duplicate is just as unintended.

   Scope per collection — order only competes within a rendered group:
     cards      shelf + horizon (ShelfList groups by horizon)
     safety     route
     learn      whole collection (learn.astro sorts one flat list)
     resources  whole collection

   Run: bun run lint:order    Exit 1 on any violation.
   ============================================================ */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname, basename } from "node:path";

const ROOT = new URL("../", import.meta.url).pathname;

const COLLECTIONS = ["cards", "safety", "learn", "resources"];

function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (extname(full) === ".md") out.push(full);
  }
  return out;
}

function frontmatterBlock(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? m[1] : "";
}

/* 999 matches the cards schema default, so a file with no explicit
   order is compared on the same value the renderer will actually use. */
export function readOrder(text) {
  const m = frontmatterBlock(text).match(/^order:\s*(-?\d+)\s*$/m);
  return m ? Number(m[1]) : 999;
}

export function readKey(text, key) {
  const re = new RegExp(`^${key}:\\s*(.*)$`, "m");
  const m = frontmatterBlock(text).match(re);
  if (!m) return null;
  const value = m[1].trim().replace(/^["']|["']$/g, "");
  return value === "" ? null : value;
}

export function groupKeyFor(collection, fm) {
  if (collection === "cards") {
    return `shelf=${fm.shelf ?? "(none)"} horizon=${fm.horizon ?? "(none)"}`;
  }
  if (collection === "safety") return `route=${fm.route ?? "(none)"}`;
  return "(collection)";
}

export function findCollisions(entries) {
  const buckets = new Map();
  for (const e of entries) {
    const key = `${e.group} ${e.order}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(e);
  }
  const problems = [];
  for (const group of buckets.values()) {
    if (group.length < 2) continue;
    const files = group.map((e) => e.rel).sort().join(", ");
    problems.push(
      `order: ${group[0].order} is used by ${group.length} entries in ` +
        `${group[0].group} — ${files}. Sort order between them is arbitrary.`,
    );
  }
  return problems.sort();
}

const problems = [];
let checked = 0;

for (const collection of COLLECTIONS) {
  const entries = [];
  for (const file of walk(join(ROOT, `src/content/${collection}`))) {
    const text = readFileSync(file, "utf8");
    entries.push({
      rel: basename(file),
      group: groupKeyFor(collection, {
        shelf: readKey(text, "shelf"),
        horizon: readKey(text, "horizon"),
        route: readKey(text, "route"),
      }),
      order: readOrder(text),
    });
    checked++;
  }
  for (const p of findCollisions(entries)) {
    problems.push(`${collection}: ${p}`);
  }
}

if (import.meta.main) {
  if (problems.length > 0) {
    console.error("Order check failed:\n");
    for (const p of problems) console.error(`  ✗ ${p}`);
    console.error(`\n${problems.length} order collision(s).`);
    process.exit(1);
  }
  console.log(`✓ No order collisions across ${checked} content entries.`);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun test scripts/lint-order.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 5: Add the script to `package.json`**

In the `scripts` block, after the `lint:links` line:

```json
    "lint:order": "bun scripts/lint-order.js",
```

- [ ] **Step 6: Run the gate and watch it catch the learn collisions**

Run: `bun run lint:order`
Expected: FAIL, exit 1, three collisions in `learn` (orders 10, 20, 30) and **nothing** in cards, safety, or resources. If a card collision appears, stop — the audit verified there are none, so it would mean a card changed since.

- [ ] **Step 7: Assign unique order values across `learn`**

The current pairs encode an intended reading arc that the duplicate values destroy. Set these exact values, spaced by 10 so an entry can be inserted later without renumbering. Change **only** the `order:` line in each file:

| File | Old | New |
|---|---|---|
| `what-preparation-can-do.md` | 10 | `10` |
| `preparation-with-support-behind-it.md` | 20 | `20` |
| `using-alone-what-is-known.md` | 10 | `30` |
| `what-integration-is-and-isnt.md` | 20 | `40` |
| `what-is-known-about-integration.md` | 30 | `50` |
| `the-weeks-after.md` | 30 | `60` |
| `how-often-things-go-badly.md` | 40 | `70` |
| `why-this-app-stays-secular.md` | 50 | `80` |

The resulting arc: what preparation can do → how to prepare → what the evidence does not cover (solo) → what integration is → what is known about it → how it plays out over time → how often things go badly → why the app takes the stance it does.

- [ ] **Step 8: Verify**

Run: `bun run lint:order && bun run build`
Expected: `✓ No order collisions across 44 content entries.`

Then confirm the rendered order. Run: `grep -o '<h2>[^<]*</h2>' dist/learn/index.html`
Expected: titles in exactly the arc above, "What preparation can and cannot do" first, "Why this app stays secular" last.

- [ ] **Step 9: Commit**

```bash
git add scripts/lint-order.js scripts/lint-order.test.ts package.json src/content/learn/
git commit -m "feat: gate order collisions; give learn a deterministic arc

Every learn order value was duplicated (10,10,20,20,30,30,40,50) and
learn.astro sorts on order alone, so each pair rendered in arbitrary
collection order. Assigns unique values spaced by 10 and adds a gate so
this cannot recur. Cards, safety, and resources already had no
collisions; the gate holds that line."
```

---

### Task 3: Wire the review gate into a release script

`bun run lint:review` fails right now — all three safety files lack `reviewedBy`/`reviewedOn`, which `PRODUCT_BOUNDARY.md` names as a launch gate. But `"lint": "lint:phrases && lint:links"`, so whatever CI runs passes clean while the clinician gate fails. The strongest gate is the one nothing runs.

**Do not simply add `lint:review` to `lint`.** That would make every commit fail until a clinician signs off, and the pressure-relief valve an engineer reaches for under a red build is `draft: true` on the safety files — which would pull the safety content off the site entirely. That is a worse outcome than the current state. `PRODUCT_BOUNDARY.md` calls this a *launch* gate, so it belongs in a release script that is expected to be red until review happens.

**Files:**
- Modify: `package.json` (scripts block)
- Modify: `PRODUCT_BOUNDARY.md` (launch gates section)

**Interfaces:**
- Consumes: `lint:order` from Task 2 (must land first, or `lint` will reference a missing script).
- Produces: `bun run lint` = inner-loop gates, expected green. `bun run lint:release` = launch gates, expected red until Task 10.

- [ ] **Step 1: Rewrite the lint scripts**

Replace the `"lint"` line in `package.json` with:

```json
    "lint": "bun run lint:phrases && bun run lint:links && bun run lint:order",
    "lint:release": "bun run lint && bun run lint:review && bun run lint:coverage",
```

`lint:coverage` is included in `lint:release` deliberately: it always exits 0 and prints unconditionally (`PRODUCT_BOUNDARY.md` explains why), so putting it here means the motivation-spread report is *seen* at every release rather than only when someone remembers to run it.

- [ ] **Step 2: Verify each script does what it claims**

Run: `bun run lint`
Expected: PASS — phrases, links, order all green.

Run: `bun run lint:release`
Expected: FAIL at `lint:review` with the three safety files listed. **This is the correct result.** It is the launch gate reporting an unmet launch condition, and it stays red until Task 10.

- [ ] **Step 3: Record the distinction in `PRODUCT_BOUNDARY.md`**

Under `## Launch gates (non-negotiable)`, replace the two bullets with:

```markdown
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
```

- [ ] **Step 4: Commit**

```bash
git add package.json PRODUCT_BOUNDARY.md
git commit -m "chore: separate inner-loop lint from release gates

lint was phrases+links only, so lint:review — the mechanical form of a
documented launch gate — was failing where nothing ran it. Adds
lint:release (lint + review + coverage) and documents why review is not
in the per-commit lint: a gate that fails every commit gets routed
around, and the route around this one is drafting the safety content."
```

---

### Task 4: Citation hygiene — one canonical form per work

Six works are cited across 20 files in inconsistent forms: one wrong author initial, one subtitle capitalized two ways, one file with three sources and zero URLs, and one duplicate citation of the same work. None of these breaks a build; all of them are visible to a reader who checks sources, on a product whose credibility rests on sourcing being real.

**Files:**
- Modify: `src/content/learn/what-preparation-can-do.md` (all 3 sources)
- Modify: `src/content/cards/sitting-with-it.md`, `src/content/cards/moving-the-body.md`, `src/content/learn/what-is-known-about-integration.md` (Gorman capitalization)
- Modify: `src/content/cards/one-small-thing.md`, `src/content/learn/the-weeks-after.md` (Bathje author list)
- Modify: `src/content/cards/recognizing-a-hard-experience.md` (remove duplicate Barrett)

**Interfaces:** none — frontmatter values only, no schema or code change.

- [ ] **Step 1: Establish the canonical form for each work**

These are the exact strings to converge on. House style is "First author + et al." except Bathje, where the full author list is already the majority form (5 files vs 2). Do not restyle a work that is already consistent.

```
Bathje  "Bathje, G. J., Majeski, E., & Kudowor, M. (2022). Psychedelic integration: An analysis of the concept and its practice. Frontiers in Psychology."
        https://doi.org/10.3389/fpsyg.2022.824077

Gorman  "Gorman, I. et al. (2021). Psychedelic Harm Reduction and Integration: A Transtheoretical Model. Frontiers in Psychology."
        https://doi.org/10.3389/fpsyg.2021.645246

Hartog. "Hartogsohn, I. (2016). Set and setting, psychedelics and the placebo response. Journal of Psychopharmacology."
        https://doi.org/10.1177/0269881116677852

Haijen  "Haijen, E. et al. (2018). Predicting Responses to Psychedelics: A Prospective Study. Frontiers in Pharmacology."
        https://doi.org/10.3389/fphar.2018.00897

Carbon. "Carbonaro, T. et al. (2016). Survey study of challenging experiences after ingesting psilocybin mushrooms. Journal of Psychopharmacology."
        https://doi.org/10.1177/0269881116662634

Barrett "Barrett, F. et al. (2016). The Challenging Experience Questionnaire: Characterization of challenging experiences with psilocybin mushrooms. Journal of Psychopharmacology."
        https://doi.org/10.1177/0269881116678781
```

Two facts behind these choices: the author is **Ido** Hartogsohn, so `I.` is correct and the `A.` in `what-preparation-can-do.md` is wrong. The Gorman paper's subtitle is **"A Transtheoretical Model"** in title case, so the three lowercase instances are the ones to change.

- [ ] **Step 2: Fix `what-preparation-can-do.md` — wrong initial, no URLs, one title in sentence case**

Replace the entire `sources:` block:

```yaml
sources:
  - cite: "Hartogsohn, A. (2016). Set and setting, psychedelics and the placebo response. Journal of Psychopharmacology."
    year: 2016
  - cite: "Haijen, E. et al. (2018). Predicting responses to psychedelics: a prospective study. Frontiers in Pharmacology."
    year: 2018
  - cite: "Carbonaro, T. et al. (2016). Survey study of challenging experiences after ingesting psilocybin mushrooms. Journal of Psychopharmacology."
    year: 2016
```

with:

```yaml
sources:
  - cite: "Hartogsohn, I. (2016). Set and setting, psychedelics and the placebo response. Journal of Psychopharmacology."
    url: "https://doi.org/10.1177/0269881116677852"
    year: 2016
  - cite: "Haijen, E. et al. (2018). Predicting Responses to Psychedelics: A Prospective Study. Frontiers in Pharmacology."
    url: "https://doi.org/10.3389/fphar.2018.00897"
    year: 2018
  - cite: "Carbonaro, T. et al. (2016). Survey study of challenging experiences after ingesting psilocybin mushrooms. Journal of Psychopharmacology."
    url: "https://doi.org/10.1177/0269881116662634"
    year: 2016
```

- [ ] **Step 3: Fix the Gorman subtitle in three files**

In `src/content/cards/sitting-with-it.md`, `src/content/cards/moving-the-body.md`, and `src/content/learn/what-is-known-about-integration.md`, change:

```
A transtheoretical model. Frontiers in Psychology."
```

to:

```
A Transtheoretical Model. Frontiers in Psychology."
```

- [ ] **Step 4: Fix the Bathje author list in two files**

In `src/content/cards/one-small-thing.md` and `src/content/learn/the-weeks-after.md`, change:

```
- cite: "Bathje, G. et al. (2022). Psychedelic integration: An analysis of the concept and its practice. Frontiers in Psychology."
```

to:

```
- cite: "Bathje, G. J., Majeski, E., & Kudowor, M. (2022). Psychedelic integration: An analysis of the concept and its practice. Frontiers in Psychology."
```

- [ ] **Step 5: Remove the duplicate Barrett citation**

`src/content/cards/recognizing-a-hard-experience.md` cites the same work twice — the journal article and its PsycTESTS instrument record. Two entries for one work reads as padding on a card whose whole purpose is "this has been documented." Delete these two lines:

```yaml
  - cite: "Barrett, F. et al. (2016). Challenging Experience Questionnaire. PsycTESTS."
    url: "https://doi.org/10.1037/t59060-000"
    year: 2016
```

This leaves two sources (Barrett journal article, Carbonaro). The card is `riskLevel: elevated` + `draft: true`, and the schema requires at least one source for elevated content, so two is still compliant.

- [ ] **Step 6: Verify no citation form is left duplicated**

Run:

```bash
grep -rh 'cite:' src/content/ | sed 's/^ *- cite: //' | sort | uniq -c | sort -rn
```

Expected: each distinct work appears in exactly one string form. Specifically confirm zero results for each of:

```bash
grep -rn 'Hartogsohn, A\.' src/content/          # must be empty
grep -rn 'A transtheoretical model' src/content/ # must be empty
grep -rn 'Bathje, G\. et al' src/content/        # must be empty
grep -rn 'PsycTESTS' src/content/                # must be empty
```

- [ ] **Step 7: Verify the build and gates**

Run: `bun run lint && bun run check && bun run build`
Expected: all pass. The `sourceSchema` refine will reject any URL that is not absolute http(s), so a typo in a DOI added in Step 2 fails the build here.

- [ ] **Step 8: Commit**

```bash
git add src/content/
git commit -m "content: one canonical citation form per work

Hartogsohn's initial was wrong (A., should be I.), Gorman's subtitle was
capitalized two ways across six files, what-preparation-can-do carried
three sources with no URLs while the same works are linked elsewhere, and
recognizing-a-hard-experience cited Barrett twice via two records."
```

---

### Task 5: A quantitative claim with nowhere to cite it

`resources/fireside-project.md` asserts "In published data, 65.9% of callers de-escalated from psychological distress." Fireside's own site shows no such figure — call volume and training hours, plus a press headline, no de-escalation rate. It may come from a paper, but it is unverifiable from the linked source, and the resources schema has **no `sources` field at all**, so there is nowhere to put a citation even if one existed. That is the structural half of the finding: the one collection where `lastVerified` is mandatory because staleness was already identified as a risk is the one collection that cannot cite anything.

**Files:**
- Modify: `src/content.config.ts` (resources collection, ~line 246-263)
- Modify: `src/content/resources/fireside-project.md`

**Interfaces:**
- Produces: `resources` entries gain `sources: Source[]` (defaults `[]`), same `sourceSchema` already shared by cards, learn, and safety. `resources.astro` is not required to render it in this task — the field exists so a factual claim has somewhere legitimate to live.

- [ ] **Step 1: Add `sources` to the resources schema**

In `src/content.config.ts`, in the `resources` collection, insert directly after the `caveat` line:

```ts
    /* A resource description that states a fact — an outcome rate, a
       study finding — needs the same sourcing as any other factual
       claim in the app. Without this field the only options were an
       uncited number or dropping the fact, and the first one shipped.
       Most resources are a name, a link, and a description: default []. */
    sources: z.array(sourceSchema).default([]),
```

- [ ] **Step 2: Remove the unverifiable statistic**

In `src/content/resources/fireside-project.md`, replace the `description` line:

```yaml
description: "Free, confidential peer support line for during and after a psychedelic experience. Call or text 623-473-7433 (US). In published data, 65.9% of callers de-escalated from psychological distress."
```

with:

```yaml
description: "Free, confidential peer support line for during and after a psychedelic experience, staffed by trained volunteers. Call or text 623-473-7433 (US)."
```

The phone number is correct and stays (623-473-7433 = 62-FIRESIDE, verified against the operator's site). "Staffed by trained volunteers" replaces the outcome claim with something the linked source does support.

If someone later locates the paper behind 65.9%, the number can return **with** a `sources:` entry — that is what Step 1 makes possible. Do not restore it on the strength of a press headline.

- [ ] **Step 3: Verify**

Run: `bun run check && bun run build`
Expected: pass.

Run: `grep -rn '65.9' src/content/`
Expected: empty.

Run: `grep -c 'sources' src/content.config.ts`
Expected: a count one higher than before (the new field plus its use in the two existing `superRefine` blocks and three collections).

- [ ] **Step 4: Commit**

```bash
git add src/content.config.ts src/content/resources/fireside-project.md
git commit -m "content: drop an unsourceable outcome stat; let resources cite

fireside-project claimed 65.9% of callers de-escalated; the operator's
site shows no such figure and the resources schema had no sources field,
so the claim had nowhere to be cited from. Adds sources to the schema
and replaces the number with something the linked source supports."
```

---

### Task 6: Two empirical claims with no source behind them

Nine cards carry no `sources`. Seven of those are stance or comfort content, which needs no citation. Two state empirical facts in the app's own authoritative register, which does need one.

Neither claim has a psychedelic-specific source I could verify, so both get reworded to the register they actually occupy — commonly reported experience — rather than keeping the authority and quietly dropping the evidence. This is `VOICE_GUIDE.md`'s "Name uncertainty" applied to the app's own prose instead of only to research summaries.

**Files:**
- Modify: `src/content/cards/writing-it-down.md:12-16`
- Modify: `src/content/cards/less-rushed.md:11-12`

**Interfaces:** none.

- [ ] **Step 1: Reword the memory-decay claim**

`writing-it-down.md` opens by asserting a fact about memory. Replace:

```markdown
Detail decays quickly after an intense experience — not the broad shape of
it, usually, but the specifics: an image, a phrase, the exact feeling of a
moment. If any part of this might matter to you later, writing a little of
it down now, while it's still close, is worth more than trying to
reconstruct it in a week.
```

with:

```markdown
People often find the specifics are the first thing to go — not the broad
shape of an experience, usually, but an image, a phrase, the exact feeling
of a moment. If any part of this might matter to you later, writing a
little of it down while it is still close tends to hold more than trying
to reconstruct it in a week.
```

- [ ] **Step 2: Reword the time-pressure claim**

`less-rushed.md` asserts an effect size ("often more than people expect") with nothing behind it. Replace:

```markdown
Time pressure changes an experience — often more than people expect. It is
worth noticing what is driving the clock before anything begins.
```

with:

```markdown
Time pressure tends to shape an experience, and people often notice it
more in hindsight than in advance. It is worth looking at what is driving
the clock before anything begins.
```

Do not add a citation here. The set-and-setting literature is about context broadly and does not measure schedule pressure specifically; citing Haijen or Hartogsohn for this would be a sourcing gesture rather than a source.

- [ ] **Step 3: Verify voice and build**

Run: `bun run lint:phrases && bun run build`
Expected: pass. Confirm neither rewrite introduced a command-voice construction — both should still read as condition-action.

- [ ] **Step 4: Commit**

```bash
git add src/content/cards/writing-it-down.md src/content/cards/less-rushed.md
git commit -m "content: state two unsourced claims in the register they occupy

Both asserted empirical facts with no source: detail decay after an
intense experience, and time pressure mattering more than people expect.
Neither has a psychedelic-specific source to cite, so both now read as
commonly reported experience rather than established finding."
```

---

### Task 7: Disambiguate the two writing cards

`writing-it-down` and `writing-things-down` sit on the same shelf, describe the same activity, both set `optionalPrompt: true`, and have titles one word apart. In the integration list they read as a duplicate.

They are not duplicates. One is "capture the specifics before they fade" (first-hours, time-sensitive, no evidence claim). The other is "journaling as an ongoing practice, and the research is thinner than the reputation" (first-days, evidence-bearing, two sources). That is a real distinction the titles actively hide. Retitle both and cross-link them rather than merging — merging would either lose the time-sensitivity or bury the evidence caveat.

Slugs do not change (global constraint), so no URL breaks.

**Files:**
- Modify: `src/content/cards/writing-it-down.md` (frontmatter: `title`, `summary`, add `related`)
- Modify: `src/content/cards/writing-things-down.md` (frontmatter: `title`, `summary`, add `related`)

**Interfaces:**
- Consumes: Task 1's body-link gate resolves the new `related` ids. Task 6 already edited `writing-it-down.md`'s body; this task touches only its frontmatter, so the two do not conflict.

- [ ] **Step 1: Retitle the first-hours card**

In `src/content/cards/writing-it-down.md`, replace the `title` and `summary` lines and add `related` after `horizon`:

```yaml
title: "Getting it down while it is close"
```

```yaml
summary: "The specifics fade before the shape does. A few lines in the first hours hold what a memory alone tends not to."
```

```yaml
related: ["writing-things-down"]
```

- [ ] **Step 2: Retitle the practice card**

In `src/content/cards/writing-things-down.md`, replace the `title` and `summary` lines and add `related`:

```yaml
title: "Writing as an ongoing practice"
```

```yaml
summary: "The most widely recommended way to look at an experience on paper — and the research behind it is thinner than the reputation."
```

```yaml
related: ["writing-it-down"]
```

- [ ] **Step 3: Verify the pair now reads as two things**

Run: `bun run lint && bun run build`
Expected: pass, including the `related` cross-links resolving in both directions.

Run: `grep -o '<h3>[^<]*</h3>' dist/integration/index.html | grep -i 'writing\|getting it down'`
Expected: `Getting it down while it is close` under first-hours and `Writing as an ongoing practice` under first-days — visibly different, in different horizon groups.

- [ ] **Step 4: Commit**

```bash
git add src/content/cards/writing-it-down.md src/content/cards/writing-things-down.md
git commit -m "content: make the two writing cards distinguishable

Same shelf, same activity, titles one word apart — they read as a
duplicate. They are not: one is capturing specifics in the first hours,
the other is journaling as a practice with the evidence caveat attached.
Retitled to carry the distinction, cross-linked so either finds the other."
```

---

### Task 8: `how-often-things-go-badly` — the vagueness is inverted

This is the risk-quantification page and it is the least numerate page in the corpus: "a meaningful proportion," "a minority of those," "rates that varied by substance and study." Meanwhile seven integration cards each quote a precise percentage for whether journaling or walking helps.

So the app is specific about what helps and vague about whether people get hurt. That inverts `VOICE_GUIDE.md`'s own rule — "Specific over warm-vague" — at the one place specificity matters most.

Two separate defects to fix:

1. **The numbers are omitted.** Carbonaro 2016 reports 1,993 respondents; 39% ranked it among the five most challenging experiences of their life; 7.6% sought treatment for enduring psychological symptoms; 11% put themselves or others at risk of physical harm; 2.7% sought medical help; 2.6% acted aggressively. Also 84% still reported benefiting — omitting *that* is not caution either, it is one-sidedness in the other direction, and it is the figure that supports the page's own "wider than good or bad" framing.
2. **The title promises a base rate the source cannot support.** Carbonaro asked each respondent about their *single worst* psilocybin experience, recruited online. Those percentages describe worst-experience recall in a self-selected sample. They are not the odds that a given experience goes badly. The current title says "how often," which is the one thing this data cannot tell you.

Title changes; slug does not (global constraint).

**Files:**
- Modify: `src/content/learn/how-often-things-go-badly.md` (title, summary, whole body)

**Interfaces:**
- Consumes: Task 1 patched lines 35-38 of this file to clear a 404, and Task 2 set its `order` to 70. **This task's body rewrite supersedes the Task 1 patch text** — the replacement below already has no link to a draft card. Task 1 stays separate because it is the urgent 404 fix and a reviewer could accept it while rejecting this rewrite. Do not re-add any `/card/` link here; `recognizing-a-hard-experience` is still draft until Task 10.

- [ ] **Step 1: Replace the title and summary**

```yaml
title: "How often things go badly"
summary: "Difficult experiences are common and documented — not rare exceptions, and not a sign of doing it wrong."
```

becomes:

```yaml
title: "What a difficult experience involves"
summary: "The best data describes people recalling their single hardest experience — what it involved, not how often it happens. Both of those are worth being precise about."
```

- [ ] **Step 2: Replace the entire body**

Everything after the closing `---` becomes:

```markdown
The largest survey on this asked 1,993 people to describe the single most
challenging experience they had ever had on psilocybin mushrooms. What it
found, in plain numbers: 39% ranked that experience among the five most
difficult of their entire life. 11% said they had put themselves or someone
else at risk of physical harm. 2.7% sought medical help. Among those whose
experience had happened more than a year earlier, 7.6% had sought treatment
for psychological symptoms that persisted afterward.

Those numbers need their denominator stated, or they mislead in both
directions. Everyone in that survey was asked about their *worst*
experience, and they found the survey and chose to answer it. So these
figures describe what a hard experience can involve when it happens. They
are not the odds that any given experience goes this way, and no study
design here can give you that number.

Held against those same figures: 84% of the same respondents said they
still benefited from the experience. That is not a reassurance placed on
top of the harm, and it does not cancel it. It means both things are
routinely true of the same event, sometimes for the same person — that a
difficult experience can do real damage that needs real help, and can
still be something the person judges as worth having had.

What that research names, plainly: fear out of proportion to any present
danger, a feeling of losing control, grief, isolation, physical distress,
paranoia, insight that overwhelmed rather than clarified, and a sense that
your own self had changed or gone missing. These recur consistently enough
that researchers built a dedicated instrument to characterize them — which
is the useful thing to know. A hard experience is a documented, studied,
common phenomenon, not a sign that something unusual happened to you or
that you handled it wrong.

If something about your situation raises the odds of a hard experience,
[Consider pausing or reconsidering](/safety) covers what is worth
weighing.

Even in clinical settings, with screening and supervision in place, a
systematic review of serotonergic psychedelics and MDMA found that adverse
events do occur, at rates varying by substance and study. "Clinical" and
"controlled" reduce risk. They do not eliminate it.
```

- [ ] **Step 3: Verify every number against the source**

The three sources already in this file's frontmatter are correct and unchanged. Confirm each figure appears in Carbonaro et al. 2016 (https://doi.org/10.1177/0269881116662634 — abstract is sufficient): n=1,993; 39% five most challenging; 11% risk of physical harm; 2.7% sought medical help; 7.6% sought treatment for enduring symptoms among those >1 year out; 84% still endorsed benefit.

If any figure does not match, fix the prose to the source — never the reverse.

- [ ] **Step 4: Verify gates and rendering**

Run: `bun run lint && bun run check && bun run build`
Expected: pass. `lint:links` must stay green — this body has exactly one link (`/safety`) and no `/card/` link.

Run: `grep -c 'card/recognizing-a-hard-experience' dist/learn/how-often-things-go-badly/index.html`
Expected: `0`.

- [ ] **Step 5: Commit**

```bash
git add src/content/learn/how-often-things-go-badly.md
git commit -m "content: put the real numbers on the risk page

The risk-quantification page was the vaguest in the corpus while
integration cards quoted percentages to one decimal — specific about what
helps, vague about whether people get hurt. Adds the Carbonaro figures
(39%, 11%, 2.7%, 7.6%, and the 84% who still endorsed benefit), states
the worst-experience denominator, and retitles: the source cannot support
'how often'."
```

---

### Task 9: The `companion` audience has zero cards

`src/content.config.ts` defines `AUDIENCES = ["self", "companion"]`. Every one of the 27 cards is `self`. A schema field authored to zero is either a plan nobody executed or dead weight in the schema, and there is no way to tell which from the outside.

It should be the first. The `support` motivation ("someone else is doing this and I want to be useful") is one of the seven equal-weight motivations, and a reader arriving through it currently gets cards written to the person taking the substance. That reader is the one person in the app's audience with a job to do on the day, and nothing addresses them.

One card, on the `before` shelf at `day-of`. Authored `draft: true` — see Step 4 for why, and Task 10 for what unblocks it.

**Files:**
- Create: `src/content/cards/if-you-are-the-one-staying.md`

**Interfaces:**
- Consumes: Task 2's `lint:order` gate — this card needs an `order` that does not collide inside `before`/`day-of`.
- Produces: the first `audience: companion` entry; makes the field load-bearing.

- [ ] **Step 1: Find a free order value**

Run: `grep -l 'shelf: "before"' src/content/cards/*.md | xargs grep -H 'horizon: "day-of"' -l | xargs grep -H '^order:'`

Note the values in use. Pick one that does not collide and leaves room either side. Do not renumber existing cards to make space.

- [ ] **Step 2: Create the card frontmatter**

`src/content/cards/if-you-are-the-one-staying.md`, with `<ORDER>` replaced by the value from Step 1:

```yaml
---
title: "If you are the one staying"
summary: "Your job on the day is smaller and longer than it sounds. Mostly you are the thing in the room that stays the same."
shelf: "before"
horizon: "day-of"
audience: "companion"
motivations: ["support"]
tone: "practical"
order: <ORDER>
draft: true
---
```

- [ ] **Step 3: Write the body**

Everything after the closing `---`:

```markdown
Most of this is waiting. Six hours is a long time to be attentive and
mostly unneeded, and the failure mode is not doing too little — it is
getting bored, then restless, then filling the room with yourself.

Some things worth settling before anything starts, while both of you can
still discuss them:

Ask whether they want to be touched, and what kind. A hand held is not the
same as a hug, and someone deep in an experience may not be able to answer
the question when it matters. An answer given beforehand still counts.

Ask what they want if they say they want to leave. Someone may ask to go
outside, or to drive somewhere, or to call a person they have not spoken to
in years. Knowing in advance which of those you are meant to honour and
which you are meant to slow down saves you from deciding it alone at 3am.

Decide who else is in the building, and tell them.

During, the useful things are unglamorous. Water within reach. A blanket.
Lights you can lower rather than switch off. Knowing where the bathroom is
and being willing to walk someone there.

If they ask you the same question six times, answer it the sixth time the
way you answered it the first. The repetition is not a test and it does not
mean your earlier answer failed.

If they are frightened, you do not have to fix it or explain it. Saying
what is true and plain — where they are, who you are, that you are staying,
that it will not last — is more use than reassurance about what they are
experiencing, which you cannot see.

Distress is not the same as emergency. Crying, terror, saying they are
dying, needing to move around — these are common and pass. Chest pain,
a seizure, a very high temperature, someone acting on a plan to harm
themselves or another person, or losing consciousness are different, and
the answer is medical help. [The signs worth acting on](/safety) sets out
where that line is.

Eat something. Sit down. If there are two of you, take turns. Whether you
were any use tends to depend less on what you said than on whether you
were still steady eight hours in.
```

- [ ] **Step 4: Leave it drafted, on purpose**

This card tells someone where the line between distress and emergency is. That is safety content in everything but collection name, and `check-review.js` only compels review for the `safety` collection and for `riskLevel: elevated` entries. A `tone: practical` card on the `before` shelf slips past both gates.

So the gate that should hold this back does not exist, and the honest substitute is `draft: true` until a clinician has read it. Shipping it live at `standard` would be the audit's own finding — a mechanical gate reporting success on a class of content it never inspects — reproduced in new content. Task 10 carries it to review.

Do not add `riskLevel: "elevated"` as a substitute. That would satisfy `check-review.js` by forcing the draft this card already has, while implying to a future reader that the elevated flag was a content judgment rather than a routing trick.

- [ ] **Step 5: Verify**

Run: `bun run lint && bun run check && bun run build`
Expected: pass. Task 1's body-link gate resolves `/safety` in this file — a draft card's links are checked, since they go live the moment the draft flag comes off. Task 2's order gate confirms no collision in `before`/`day-of`.

Run: `test -d dist/card/if-you-are-the-one-staying && echo LIVE || echo DRAFT`
Expected: `DRAFT` — `getStaticPaths` filters it out.

Run: `grep -rl 'audience: "companion"' src/content/cards/ | wc -l`
Expected: `1`.

- [ ] **Step 6: Commit**

```bash
git add src/content/cards/if-you-are-the-one-staying.md
git commit -m "content: first companion-audience card, drafted pending review

The schema has had audience: companion since the beginning with zero cards
written to it, so a reader arriving through the support motivation got
cards addressed to the person taking the substance. This is the first card
for the other person.

Drafted deliberately: it describes where distress stops and emergency
starts, which is safety content that neither check-review.js gate covers.
Goes live after clinician sign-off (Task 10)."
```

---

### Task 10: Blocked — clinician review

Everything above lands without a clinician. This task cannot, and it is the largest single item in the audit.

`bun run lint:review` currently exits 1 on three files:

- `src/content/safety/urgent.md`
- `src/content/safety/before-you-go-further.md`
- `src/content/safety/when-to-get-help.md`

All three are live, none has `reviewedBy`/`reviewedOn`, and `PRODUCT_BOUNDARY.md` names "qualified clinician sign-off on all safety content" as a launch gate. The gate is doing exactly its job: the red build is the accurate state of the project, not a defect to clear.

**Do not clear it by drafting the files.** The pressure-relief valve under a red gate is `draft: true`, and here that would remove the crisis-referral pages from a live site — strictly worse than an unreviewed page. Task 3 keeps `lint:review` out of the inner-loop `lint` for this reason.

**Review queue:**

| File | Why |
|---|---|
| `src/content/safety/urgent.md` | Live crisis page, unreviewed. Also: line 16 says "The numbers below are kept" but `card/[slug].astro:80-89` renders only the kicker, the condition line, and a link to `/safety` — so on a card there are no numbers below. Either the wording or the embed should change; that is a clinician-facing wording call, not an engineering one. |
| `src/content/safety/pause.md` | Live, unreviewed. Contraindication / reconsider content. |
| `src/content/safety/clinician.md` | Live, unreviewed. When-to-involve-a-professional content. |
| `src/content/cards/if-you-are-the-one-staying.md` | New (Task 9). Distress/emergency boundary for a companion. |
| 6 existing `draft: true` cards | `what-youre-taking`, `doing-this-alone`, `when-resisting-makes-it-worse` (before); `doing-this-again`, `recognizing-a-hard-experience`, `when-its-not-settling` (integration). All already `riskLevel: elevated`, so the schema is holding them until review. Re-list with `grep -l '^draft: true' src/content/cards/*.md`. |
| `src/lib/referrals.ts` | Numbers verified 2026-08-01 and correct as of this audit. Needs a clinician on scope and `emergency.note`, not on the digits. |

- [ ] **Step 1: Get the review**

Out of scope for an implementation agent. A qualified clinician reads the queue above and returns, per file, a name and a date.

- [ ] **Step 2: Record it**

Add to each reviewed file's frontmatter:

```yaml
reviewedBy: "<name, credential>"
reviewedOn: "<YYYY-MM-DD>"
```

Both fields or neither. `check-review.js` flags `reviewedOn` without `reviewedBy` — "a date without a named reviewer is not a review" — and that check exists to stop exactly the shortcut a deadline invites.

- [ ] **Step 3: Undraft what passed**

Remove `draft: true` from the cards the clinician cleared. Leave anything they did not clear drafted.

Run: `bun run build && bun run lint:release`
Expected: `lint:release` green for the first time.

- [ ] **Step 4: Then, and only then, flip the two elevated-risk learn entries**

`how-often-things-go-badly` (Task 8) and `using-alone-what-is-known` are both live and neither declares `riskLevel` at all — they inherit `"standard"` from the schema default (`content.config.ts:218`). So there is no line to edit; a `riskLevel: "elevated"` line has to be added. Given what they cover, that is the accurate value.

The ordering matters and is not negotiable: `superRefine` requires an `elevated` entry to be either draft or reviewed. Flipping either one before its review exists forces `draft: true`, which dark-pages two live learn entries — the app's substance-alone page and its risk page — to fix a metadata value. Flip after sign-off, never before.

Run: `bun run check && bun run lint:release && bun run build`
Expected: pass, both entries still live.

- [ ] **Step 5: Commit**

```bash
git add -A src/content/safety src/content/cards src/content/learn
git commit -m "content: record clinician review of safety content

Clears the lint:review gate honestly rather than by drafting the crisis
pages. Undrafts the cards that passed, and flips the two learn entries
that warrant riskLevel: elevated now that review exists to satisfy the
schema's superRefine."
```

---

## Deliberately not in this plan

Recording these so a later reader knows they were considered and declined, not missed.

- **Authoring cards for the `between` shelf.** It has zero cards and looks like a gap. `PRODUCT_BOUNDARY.md` records it as a locked decision — nothing useful is authored for someone mid-experience, and a page that tries becomes something to read instead of something to put down. Leave it at zero.
- **Merging the two writing cards.** Task 7 retitles instead. Merging loses either the first-hours time-sensitivity or the evidence caveat.
- **Renaming any content file.** Every `.md` filename is a public URL. Titles change in this plan; slugs never do.
- **Adding `lint:review` to `lint`.** Task 3's reasoning: a red inner-loop build invites `draft: true` on the crisis pages.
- **Progress indicators, streaks, or completion state** anywhere in the fixes above. Hard commitment in `PRODUCT_BOUNDARY.md`.
- **Re-weighting the seven motivations.** Equal weight is a hard commitment, even though `support` now has more cards than it did.

## Self-review

Run this before handing back. It is a checklist, not a subagent dispatch.

- [ ] **Spec coverage.** Every finding in the audit maps to a task, or appears under "Deliberately not in this plan" with a reason. No finding is silently absent.
- [ ] **Placeholder scan.** `grep -rn 'TODO\|FIXME\|XXX\|<ORDER>\|lorem\|TBD' src/ scripts/` returns nothing from this plan's work. Task 9 Step 2 ships a literal `<ORDER>` that Step 1 must resolve — confirm it did.
- [ ] **No stub tests.** Every test added in Tasks 1 and 2 asserts on real behaviour. No `expect(true).toBe(true)`, no test that passes against an unimplemented function.
- [ ] **Type consistency.** `readOrder` (Task 2) defaults to `999`, matching `order: z.number().default(999)` in the schema. A different default would make the gate disagree with the renderer about what an omitted `order` means.
- [ ] **Both gates fail before they pass.** `lint:links` caught the two 404s before Task 1's content fix; `lint:order` caught the learn collisions before Task 2's renumber. A gate first observed green proves nothing.
- [ ] **Every number traces to a source.** Each figure in Tasks 4, 5, 6, and 8 appears in the cited work. Where a claim had no source, it was reworded (Task 6) or removed (Task 5) — never given a citation that merely looks adjacent.
- [ ] **Voice gate green on all new prose.** `bun run lint` passes on Tasks 7, 8, and 9. Then read the four human-review-only phrases in `VOICE_GUIDE.md` and check the new prose by eye — the linter cannot see those.
- [ ] **No dead links, including in drafts.** `bun run lint:links` green. Draft cards are checked too; their links go live the moment the flag comes off.
- [ ] **`lint:release` still red, for one reason only.** After Tasks 1–9, the only failures are the three unreviewed safety files. Any other failure is a regression from this plan.
- [ ] **Site builds and the two 404s are gone.** `bun run build`, then confirm `/learn/how-often-things-go-badly/` and `/card/less-rushed/` contain no link to a draft slug.

## Success criteria

- `bun run lint`, `bun run check`, `bun test`, and `bun run build` all pass.
- `bun run lint:links` inspects markdown body links, not only `related:` frontmatter.
- `bun run lint:order` exists and passes.
- No live page links to a drafted card.
- Every empirical claim in the corpus is either sourced in a canonical citation form or worded as the observation it actually is.
- `audience: companion` has at least one card authored to it.
- `lint:release` fails only on unreviewed safety content — the real launch gate, visible and unfudged.

## Execution handoff

The plan is saved at `docs/superpowers/plans/2026-08-04-content-audit-remediation.md`. Two ways to run it:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.




