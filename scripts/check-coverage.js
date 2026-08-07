/* ============================================================
   Bearings — Motivation & shelf coverage report

   PRODUCT_BOUNDARY.md, content review checklist:

     "At each content review, check card counts per motivation across
      the authored shelves. A motivation with very few or zero cards is
      not a launch blocker on its own, but it is a signal that the
      equal-weight promise made by the motivation chooser is drifting
      out of alignment with what actually exists — and that gap should
      be visible to whoever is reviewing, not discovered by a user."

   That paragraph sets this script's contract precisely, so read the
   two halves separately:

   1. "not a launch blocker on its own" — this script ALWAYS exits 0.
      It is a report, not a gate. If you find yourself wanting it to
      fail a build, that is a change to PRODUCT_BOUNDARY.md first and
      to this file second, in that order.

   2. "visible to whoever is reviewing, not discovered by a user" —
      the numbers print unconditionally, including when everything
      looks fine. A report that only speaks up when it judges
      something wrong trains people to skim it, and hides the trend
      between one review and the next.

   Coverage is computed on NON-DRAFT cards, because that is what a
   person choosing a motivation actually reaches. Draft counts print
   separately: they are the pipeline, and a motivation that looks thin
   until you notice three of its cards are staged behind clinician
   review is a different situation from one that was never written.

   Run: bun run lint:coverage    Always exits 0.
   ============================================================ */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = new URL("../", import.meta.url).pathname;
const CARDS_DIR = "src/content/cards";

/* Kept in the same order as MOTIVATION_LABELS in src/lib/shelves.ts.
   Hardcoded rather than imported: this script is plain node reading
   files off disk, with no Astro/TS resolution available. The tradeoff
   is that adding a motivation means editing two places — so the
   unknown-motivation check below exists to make that loud instead of
   silent. */
const MOTIVATIONS = [
  "curious",
  "play",
  "close",
  "awe",
  "difficult",
  "support",
  "unsure",
];

/* `between` is capped at zero authored cards by an explicit locked
   decision (PRODUCT_BOUNDARY.md: writing advice to be read mid
   experience is higher-risk content this product has no basis for
   authoring yet). Listing it here keeps a deliberate zero from
   printing as though it were an accident — noise that would train a
   reviewer to ignore this output. */
const INTENTIONALLY_EMPTY = new Set(["between"]);

const SHELVES = ["before", "between", "integration"];

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

/* Top-level scalar frontmatter keys, same approach as
   check-review.js. Nested list items are indented and ignored. */
function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z][A-Za-z0-9_]*):\s*(.*)$/);
    if (!kv) continue;
    out[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

/* Parses the inline array form every card currently uses:
   motivations: ["difficult", "awe", "unsure"]

   Returns null — NOT an empty list — for any value this reader cannot
   parse, so the caller can surface it instead of counting it as zero.

   The empty-string case is the important one, and it is why this
   function does not use a falsy check. `frontmatter()` above reads
   top-level scalars only, so a multi-line YAML array:

     motivations:
       - "difficult"

   yields the key with an EMPTY value, and the indented items are
   never seen. Treating that as [] would drop a real card's
   motivations while still counting it in the shelf totals — the
   report would be quietly wrong in the one direction nobody would
   think to check. A genuinely absent key is handled at the call
   site, which never calls in here at all. */
function parseInlineList(raw) {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (trimmed === "[]") return [];
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return null;
  return trimmed
    .slice(1, -1)
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

function bar(n, max, width = 24) {
  if (max === 0) return "";
  return "█".repeat(Math.max(0, Math.round((n / max) * width)));
}

function pct(n, total) {
  return total === 0 ? "0%" : `${Math.round((n / total) * 100)}%`;
}

const files = walk(join(ROOT, CARDS_DIR));
const live = [];
const drafts = [];
const parseWarnings = [];
const unknownMotivations = new Map();

for (const file of files) {
  const rel = file.replace(ROOT, "");
  const fm = frontmatter(readFileSync(file, "utf8"));

  if (!fm) {
    parseWarnings.push(`${rel}  no frontmatter block — not counted`);
    continue;
  }

  /* An absent key is legitimate and means "written for everyone" —
     ShelfFilter.svelte never hides a card with no motivations. That is
     different from a key that is present but unreadable here, which is
     a reporting bug and has to be visible. */
  let motivations = [];
  if ("motivations" in fm) {
    motivations = parseInlineList(fm.motivations);
    if (motivations === null) {
      parseWarnings.push(
        `${rel}  motivations present but not parseable as an inline ` +
          `array (multi-line YAML lists are not read) — NOT COUNTED`,
      );
      continue;
    }
  }

  for (const m of motivations) {
    if (!MOTIVATIONS.includes(m)) {
      if (!unknownMotivations.has(m)) unknownMotivations.set(m, []);
      unknownMotivations.get(m).push(rel);
    }
  }

  const card = { rel, shelf: fm.shelf ?? "(none)", motivations };
  if (fm.draft === "true") drafts.push(card);
  else live.push(card);
}

const countIn = (cards, m) =>
  cards.filter((c) => c.motivations.includes(m)).length;

console.log("Coverage report — a signal for content review, not a gate.\n");

/* ---------- motivations ---------- */

const liveCounts = MOTIVATIONS.map((m) => ({
  motivation: m,
  live: countIn(live, m),
  draft: countIn(drafts, m),
}));

const maxLive = Math.max(...liveCounts.map((c) => c.live), 0);
const minLive = Math.min(...liveCounts.map((c) => c.live));

console.log(
  `Motivations — cards reachable per motivation (${live.length} non-draft cards)\n`,
);
for (const c of [...liveCounts].sort((a, b) => b.live - a.live)) {
  const share = pct(c.live, live.length);
  const staged = c.draft > 0 ? `  (+${c.draft} draft)` : "";
  console.log(
    `  ${c.motivation.padEnd(10)} ${String(c.live).padStart(3)}  ${share.padStart(4)}  ${bar(c.live, maxLive)}${staged}`,
  );
}

console.log(
  `\n  Spread: ${minLive}–${maxLive} cards. A person choosing the thinnest` +
    `\n  motivation reaches ${pct(minLive, live.length)} of the shelf; the widest, ${pct(maxLive, live.length)}.`,
);

const zeros = liveCounts.filter((c) => c.live === 0);
if (zeros.length > 0) {
  console.log(
    `\n  Zero non-draft cards: ${zeros.map((c) => c.motivation).join(", ")}.` +
      `\n  The chooser offers these as equal-weight options.`,
  );
}

/* ---------- shelves ---------- */

console.log(`\nShelves — non-draft cards per shelf\n`);
for (const shelf of SHELVES) {
  const n = live.filter((c) => c.shelf === shelf).length;
  const d = drafts.filter((c) => c.shelf === shelf).length;
  const staged = d > 0 ? `  (+${d} draft)` : "";
  const note = INTENTIONALLY_EMPTY.has(shelf)
    ? "  — capped at zero by locked decision"
    : "";
  console.log(
    `  ${shelf.padEnd(12)} ${String(n).padStart(3)}${staged}${note}`,
  );
}

const orphaned = live.filter((c) => !SHELVES.includes(c.shelf));
if (orphaned.length > 0) {
  console.log(`\n  Cards on an unrecognised shelf:`);
  for (const c of orphaned) console.log(`    ${c.rel}  shelf: ${c.shelf}`);
}

/* ---------- integrity notes ---------- */

if (unknownMotivations.size > 0) {
  console.log(
    `\nUnrecognised motivation values — either a typo, or MOTIVATIONS in` +
      `\nthis script has drifted from src/lib/shelves.ts:\n`,
  );
  for (const [m, where] of unknownMotivations) {
    console.log(`  "${m}"  in ${where.join(", ")}`);
  }
}

if (parseWarnings.length > 0) {
  console.log(`\nNot counted — read these before trusting the numbers above:\n`);
  for (const w of parseWarnings) console.log(`  ! ${w}`);
}

console.log(
  `\n${files.length} card files: ${live.length} non-draft, ${drafts.length} draft.`,
);
console.log("See PRODUCT_BOUNDARY.md — content review checklist.");
