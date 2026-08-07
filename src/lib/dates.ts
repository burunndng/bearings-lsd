/* ============================================================
   Bearings — Date formatting

   Extracted because Journal.svelte and Anchor.svelte already held
   byte-identical copies of dateLabel, and the Settings export needs
   both of these as well. Three call sites for one pure function is
   where a shared module stops being premature.

   Both formatters are locale-aware via Intl with no hardcoded
   locale: someone reading their own notes should see dates the way
   their device writes them.
   ============================================================ */

/** Absolute timestamp: "3 August 2026, 14:22". */
export function dateLabel(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

/** Relative age in plain language, with no false precision past a few
    weeks. This is the highest-value affordance in the notes store for
    someone with no therapist: rereading your own words weeks later and
    seeing plainly how long ago you wrote them. */
export function ageLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 14) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 12) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}
