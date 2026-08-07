/* ============================================================
   Bearings — CSP hash helper for <script is:inline> blocks

   Astro's security.csp hashes bundled and hydration scripts
   automatically, but NOT <script is:inline> blocks. Those two
   (theme no-flash in BaseLayout.astro, NightField canvas) must be
   listed by hand in astro.config.mjs -> security.csp ->
   scriptDirective.hashes, and the hash is computed over the exact
   bytes Astro emits — i.e. the raw content between the tags,
   leading newline and indentation included.

   If you edit either script:
     1. run `bun run csp:hashes`
     2. paste the printed lines into astro.config.mjs, replacing
        the two old hashes
     3. `bun run build && bun run check:csp` must pass
   scripts/check-csp.js makes step 3 mechanical: a build whose
   pages carry an inline script without a matching hash fails the
   release gate.

   Run: bun run csp:hashes    (also verifies against dist if built)
   ============================================================ */

import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

/* The <script is:inline> blocks the app emits, as (path, tag-regex).
   Add a new one here when you add an inline script. */
const INLINE_SCRIPTS = [
  {
    path: "src/layouts/BaseLayout.astro",
    tag: "<script is:inline>",
  },
  {
    path: "src/components/NightField.astro",
    tag: "<script is:inline>",
  },
];

function sha256Base64(text) {
  return createHash("sha256").update(text).digest("base64");
}

/* Extract the raw content between <script ...> and </script> from a
   source file. Astro emits this content verbatim, so the hash over
   it matches the hash over the served HTML. */
function inlineBody(path, tag) {
  const text = readFileSync(path, "utf8");
  const start = text.indexOf(tag);
  if (start === -1) throw new Error(`${path}: tag ${tag} not found`);
  const openEnd = text.indexOf(">", start);
  const close = text.indexOf("</script>", openEnd);
  if (close === -1) throw new Error(`${path}: missing </script>`);
  return text.slice(openEnd + 1, close);
}

/* Cross-check against the built HTML when dist exists, so a future
   Astro change that transforms inline scripts is caught here rather
   than silently invalidating the hardcoded hashes. */
function checkAgainstDist() {
  if (!existsSync("dist/index.html")) return;
  const html = readFileSync("dist/index.html", "utf8");
  for (const { path, tag } of INLINE_SCRIPTS) {
    const srcHash = sha256Base64(inlineBody(path, tag));
    const found = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].some(
      (m) => sha256Base64(m[1]) === srcHash,
    );
    if (!found) {
      console.error(
        `✗ ${path} hash not found in dist — the build transforms inline scripts, ` +
          "the hardcoded hashes are stale.",
      );
      process.exitCode = 1;
    }
  }
}

let failed = false;
for (const { path } of INLINE_SCRIPTS) {
  try {
    const hash = sha256Base64(inlineBody(path, "<script is:inline>"));
    console.log(`"sha256-${hash}", // ${path}`);
  } catch (e) {
    console.error(`✗ ${e.message}`);
    failed = true;
  }
}

if (!failed) checkAgainstDist();
if (failed) process.exit(1);
