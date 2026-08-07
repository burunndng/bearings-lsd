/* ============================================================
   Bearings — CSP build gate

   The privacy promise is enforced by a strict Content Security
   Policy, and that policy is split in two:
   - public/_headers carries the non-script/style directives.
   - Astro's security.csp emits a per-page <meta> CSP carrying
     script-src / style-src with a sha256 hash for EVERY inline
     script and style in that page (including the hand-listed
     is:inline hashes from astro.config.mjs).

   The failure mode this script exists to prevent: a page whose
   meta CSP does not cover one of its own inline scripts. Inline
   scripts run only when their exact hash is in script-src; a
   missed hash is a silently dead script in production — the theme
   no-flash, the NightField, or an island that never hydrates. In
   the old header-only CSP every inline script was blocked at once
   and the whole app was dead under a policy that was supposed to
   protect it.

   Rules, per built page:
   1. A CSP <meta> must exist.
   2. Every inline <script> must have its sha256 in script-src.
   3. Every inline <style> must have its sha256 in style-src.
   4. No 'unsafe-inline' in script-src — hashes are the point.

   Run: bun run check:csp    (after a build; exits 1 on violation)
   ============================================================ */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { createHash } from "node:crypto";

const DIST = new URL("../dist/", import.meta.url).pathname;

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
    else if (extname(full) === ".html") out.push(full);
  }
  return out;
}

function sha256Base64(text) {
  return createHash("sha256").update(text).digest("base64");
}

/* Inline blocks of a given tag in an HTML file: content between
   <tag ...> and </tag>. A src= or href= attribute means the block
   is external (a same-origin file, allowed by 'self') and carries
   no hash. */
function inlineBlocks(html, tag) {
  const out = [];
  const re = new RegExp(`<${tag}([^>]*)>([\\s\\S]*?)</${tag}>`, "g");
  let m;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1] ?? "";
    if (/\b(src|href)\s*=/.test(attrs)) continue;
    if (m[2].trim()) out.push(m[2]);
  }
  return out;
}

/* The script-src / style-src directive values from the page's meta
   CSP. Returns the full text after each directive name. */
function cspDirective(metaContent, name) {
  const re = new RegExp(`\\b${name}[^;]*`, "g");
  const found = metaContent.match(re);
  return found ? found.join("") : "";
}

const problems = [];
let pages = 0;

for (const file of walk(DIST)) {
  const rel = file.replace(DIST, "");
  const html = readFileSync(file, "utf8");
  const meta = html.match(
    /<meta[^>]*http-equiv=["']content-security-policy["'][^>]*>/i,
  );
  pages++;

  if (!meta) {
    problems.push(`${rel}  missing CSP <meta> — a page without the meta is a page without hashes`);
    continue;
  }
  /* The content attribute is always double-quoted here — Astro emits
     it that way, and it must, because the CSP tokens themselves use
     single quotes, so a single-quoted attribute could never hold
     them. Capturing [^"]* therefore cannot truncate on a hash. */
  const metaContent = meta[0].match(/content="([^"]*)"/i)?.[1] ?? "";
  const scriptSrc = cspDirective(metaContent, "script-src");
  const styleSrc = cspDirective(metaContent, "style-src");

  for (const block of inlineBlocks(html, "script")) {
    const hash = `'sha256-${sha256Base64(block)}'`;
    if (!scriptSrc.includes(hash)) {
      problems.push(
        `${rel}  inline <script> without matching hash — blocked in production. ` +
          "If it is an <script is:inline>, run `bun run csp:hashes` and update " +
          "astro.config.mjs scriptDirective.hashes.",
      );
    }
  }

  for (const block of inlineBlocks(html, "style")) {
    const hash = `'sha256-${sha256Base64(block)}'`;
    if (!styleSrc.includes(hash)) {
      problems.push(`${rel}  inline <style> without matching hash`);
    }
  }

  if (scriptSrc.includes("'unsafe-inline'")) {
    problems.push(`${rel}  'unsafe-inline' in script-src — hashes are the point`);
  }
}

if (problems.length > 0) {
  console.error("CSP gate failed:\n");
  for (const p of problems) console.error(`  ✗ ${p}`);
  console.error(
    `\n${problems.length} problem${problems.length === 1 ? "" : "s"} across ${pages} page${pages === 1 ? "" : "s"}.`,
  );
  process.exit(1);
}

console.log(`✓ CSP gate passed: ${pages} pages, every inline script and style hashed.`);
