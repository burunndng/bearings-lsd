/* ============================================================
   Bearings — Referrals JSON endpoint
   Makes the astro.config.mjs NetworkFirst rule for `/referrals`
   target something real. Without this the SW rule matches nothing
   and a corrected crisis number would need a full app redeploy to
   reach an installed PWA — the exact failure mode referrals.ts
   warns about in its own header comment.

   Static endpoint (output: "static" — Blocking Decision 3): this
   still bakes the current referrals.ts into the build. What it
   buys is the runtime-caching contract: NetworkFirst means an
   online visitor always fetches this file fresh before falling
   back to whatever was cached, so a rebuild + redeploy reaches
   installed PWAs on next network use rather than never.
   ============================================================ */
import type { APIRoute } from "astro";
import { referrals, emergency, lastVerified } from "../lib/referrals.ts";

export const prerender = true;

export const GET: APIRoute = () => {
  return new Response(
    JSON.stringify({ referrals, emergency, lastVerified }, null, 2),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
};
