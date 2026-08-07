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

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname, basename } from "node:path";

const ROOT = new URL("../", import.meta.url).pathname;
const CARDS_DIR = join(ROOT, "src/content/cards");

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

/* Minimal frontmatter reader for the one field we need. `related`
   is a YAML flow or block array of quoted strings — both forms
   reduce to "everything inside [ ... ]" or the immediate indented
   "- id" lines following the key. */
function readRelated(text) {
  const flow = text.match(/^related:\s*\[(.*)\]\s*$/m);
  if (flow) {
    return flow[1]
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }
  const blockStart = text.match(/^related:\s*$/m);
  if (!blockStart) return [];
  const after = text.slice(blockStart.index + blockStart[0].length);
  const ids = [];
  for (const line of after.split(/\r?\n/)) {
    const item = line.match(/^\s*-\s*["']?([^"'\s]+)["']?\s*$/);
    if (item) {
      ids.push(item[1]);
      continue;
    }
    if (line.trim() === "") continue;
    break; // first non-list line ends the block
  }
  return ids;
}

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
