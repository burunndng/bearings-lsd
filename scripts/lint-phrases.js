/* ============================================================
   Bearings — Forbidden-phrase linter
   Runs in CI against content, components, pages — including
   aria-label and placeholder attributes. See VOICE_GUIDE.md.
   Run: bun run lint:phrases
   Exit 1 on any match so CI fails.

   Line-based (not whole-file indexOf): a full-file scan makes it
   impossible to quote a forbidden phrase in prose that is CRITICIZING
   it — which content like "why this app stays secular" legitimately
   needs to do. Rewritten to check line-by-line, with a narrow escape
   hatch: a line ending in `voice:allow` is skipped. The marker is
   visible in source and grep-able, so it cannot become a silent
   allowlist — anyone reviewing content can see exactly where and why
   the linter was told to stand down.
   ============================================================ */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = new URL("../", import.meta.url).pathname;
const SCAN_DIRS = ["src"];
const EXTS = new Set([".astro", ".svelte", ".md", ".mdx", ".ts", ".js"]);

/* Phrases that signal drift back toward the wellness cliché or a
   directive/therapeutic posture the product refuses. Case-insensitive.
   Kept deliberately narrow to avoid false positives on legitimate prose.

   Some entries in VOICE_GUIDE.md's forbidden list are NOT here because
   they are not reliably regex-able without false positives (e.g. "the
   medicine" as a substance-reference vs. "medicine" in "a qualified
   clinician... medicine cabinet"; "journey" as a noun for the
   experience vs. legitimate uses like "journey" in a citation title).
   Those are marked human-review-only in VOICE_GUIDE.md rather than
   silently unenforced. */
const FORBIDDEN = [
  "healing journey",
  "trust the medicine",
  "integrate your download",
  "your downloads",
  "heal your nervous system",
  "sacred container",
  "highest self",
  "raise your vibration",
  "plant teacher",
  "the medicine will",
  "transform your life",
  "begin your healing",
  "begin your journey",
];

/* A line ending in this marker (after trimming) is exempt. Narrow on
   purpose: it exempts one line, not a file or a phrase globally. */
const ALLOW_MARKER = /voice:allow\s*$/i;

const ATTR_RE = /(aria-label|placeholder)\s*=\s*["']([^"']*)["']/gi;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const s = statSync(full);
    if (s.isDirectory()) out.push(...walk(full));
    else if (EXTS.has(extname(full))) out.push(full);
  }
  return out;
}

let violations = 0;
const files = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)));

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const rel = file.replace(ROOT, "");
  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (ALLOW_MARKER.test(line)) continue;

    const lower = line.toLowerCase();
    for (const phrase of FORBIDDEN) {
      if (lower.includes(phrase)) {
        console.error(`  ✗ ${rel}:${i + 1}  forbidden phrase: "${phrase}"`);
        violations++;
      }
    }

    let m;
    while ((m = ATTR_RE.exec(line)) !== null) {
      const val = m[2].toLowerCase();
      for (const phrase of FORBIDDEN) {
        if (val.includes(phrase)) {
          console.error(
            `  ✗ ${rel}:${i + 1}  forbidden phrase in ${m[1]}: "${phrase}"`,
          );
          violations++;
        }
      }
    }
  }
}

if (violations > 0) {
  console.error(`\n${violations} voice violation(s). See VOICE_GUIDE.md.`);
  console.error(
    `If a line legitimately needs to quote a forbidden phrase (e.g. to`,
  );
  console.error(
    `criticize it), end that line with "voice:allow" to exempt it.`,
  );
  process.exit(1);
}
console.log(`✓ No forbidden phrases across ${files.length} files.`);
