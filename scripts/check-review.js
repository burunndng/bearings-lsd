/* ============================================================
   Bearings — Review gate
   Enforces the launch gates from PRODUCT_BOUNDARY.md in CI:
   "Qualified clinician sign-off on all safety content."

   A gate that only exists in a document is not a gate. This makes
   it mechanical, so unreviewed risk-bearing content cannot reach a
   build even by accident.

   Rules:
   1. Every safety entry is inherently risk-bearing. It must either
      be draft: true, or carry BOTH reviewedBy and reviewedOn.
   2. Any card or learn entry with riskLevel: elevated must either
      be draft: true, or carry BOTH reviewedBy and reviewedOn.
   3. Anything claiming review must name a reviewer, not just a date.

   Draft content is excluded from rendering by the shelf/safety
   pages, so drafting unreviewed material is safe and expected.
   Shipping it is what this script prevents.

   Run: bun run lint:review    Exit 1 on any violation.
   ============================================================ */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = new URL("../", import.meta.url).pathname;

/* dir -> whether every entry in it is treated as risk-bearing */
const TARGETS = [
  { dir: "src/content/safety", alwaysElevated: true },
  { dir: "src/content/cards", alwaysElevated: false },
  { dir: "src/content/learn", alwaysElevated: false },
];

function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out; // directory may not exist yet
  }
  for (const name of entries) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (extname(full) === ".md") out.push(full);
  }
  return out;
}

/* Minimal frontmatter reader. We only need presence and scalar
   values of a few known keys, so this stays dependency-free and in
   the same style as lint-phrases.js. */
function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    // top-level keys only; nested list items are indented and ignored
    const kv = line.match(/^([A-Za-z][A-Za-z0-9_]*):\s*(.*)$/);
    if (!kv) continue;
    let value = kv[2].trim().replace(/^["']|["']$/g, "");
    out[kv[1]] = value;
  }
  return out;
}

const problems = [];
let checked = 0;

for (const { dir, alwaysElevated } of TARGETS) {
  for (const file of walk(join(ROOT, dir))) {
    const rel = file.replace(ROOT, "");
    const text = readFileSync(file, "utf8");
    const fm = frontmatter(text);

    if (!fm) {
      problems.push(`${rel}  missing frontmatter block`);
      continue;
    }

    checked++;

    const isDraft = fm.draft === "true";
    const elevated = alwaysElevated || fm.riskLevel === "elevated";
    const hasReviewer = Boolean(fm.reviewedBy);
    const hasDate = Boolean(fm.reviewedOn);

    // Rule 3: a date without a named reviewer is not a review.
    if (hasDate && !hasReviewer) {
      problems.push(
        `${rel}  has reviewedOn but no reviewedBy — name the reviewer`,
      );
    }

    if (!elevated || isDraft) continue;

    // Rules 1 and 2
    if (!hasReviewer || !hasDate) {
      const missing = [
        !hasReviewer ? "reviewedBy" : null,
        !hasDate ? "reviewedOn" : null,
      ]
        .filter(Boolean)
        .join(" and ");
      const why = alwaysElevated
        ? "safety content requires clinician sign-off"
        : "riskLevel: elevated requires sign-off";
      problems.push(
        `${rel}  missing ${missing} — ${why}. Mark draft: true until reviewed.`,
      );
    }
  }
}

if (problems.length > 0) {
  console.error("Review gate failed:\n");
  for (const p of problems) console.error(`  ✗ ${p}`);
  console.error(
    `\n${problems.length} unreviewed risk-bearing entr${
      problems.length === 1 ? "y" : "ies"
    }.`,
  );
  console.error("See PRODUCT_BOUNDARY.md — launch gates.");
  process.exit(1);
}

console.log(`✓ Review gate passed across ${checked} content entries.`);
