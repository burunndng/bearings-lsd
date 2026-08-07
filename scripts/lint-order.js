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
    const key = `${e.group} ${e.order}`;
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
