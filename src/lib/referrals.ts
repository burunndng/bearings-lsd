/* ============================================================
   Bearings — Crisis & harm-reduction referrals
   SINGLE source of truth. See content analysis ("aging into harm"):
   when a number changes (e.g. US 1-800 -> 988), edit ONE line here.

   Service-worker caching for this data is NetworkFirst
   (astro.config.mjs) so the freshest numbers reach users online,
   while a cached copy still works offline.

   Every entry MUST be verified during the quarterly content review.
   lastVerified is shown to users so they can judge freshness.
   ============================================================ */

export interface Referral {
  name: string;
  detail: string;
  /** tel: or https: — kept explicit so intent is visible */
  href: string;
  /** who this is for, in plain language */
  who: string;
  region: string;
}

export const lastVerified = "2026-08-01";

/* Emergency: intentionally generic. We do not hardcode a single
   country's number as THE number — the label routes to local services. */
export const emergency = {
  note: "Emergency services number varies by country (for example 911, 112, 999, 000). Use your local emergency number.",
};

export const referrals: Referral[] = [
  {
    name: "988 Suicide & Crisis Lifeline",
    detail: "Call or text 988",
    href: "tel:988",
    who: "If you are in emotional crisis or thinking about suicide (US).",
    region: "United States",
  },
  {
    name: "Fireside Project",
    detail: "Call or text 62-FIRESIDE (623-473-7433)",
    href: "tel:6234737433",
    who: "Free, confidential support during or after a psychedelic experience (US).",
    region: "United States",
  },
  {
    name: "Samaritans",
    detail: "Call 116 123",
    href: "tel:116123",
    who: "Round-the-clock emotional support (UK & Ireland).",
    region: "United Kingdom & Ireland",
  },
  {
    name: "Find a Helpline",
    detail: "findahelpline.com",
    href: "https://findahelpline.com",
    who: "Free, confidential support lines in many countries.",
    region: "International",
  },
];
