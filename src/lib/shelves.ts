/* ============================================================
   Bearings — Shelf and horizon labels
   Single source of truth so the nav, breadcrumbs, and shelf pages
   cannot drift apart.

   Horizon labels are plain and non-directive. They describe when
   something tends to be relevant, not when you are supposed to do
   it. No numbering, no "step", no "next" — see PRODUCT_BOUNDARY.md.
   ============================================================ */

export type Shelf = "before" | "between" | "integration" | "learn";

export type Motivation =
  | "curious"
  | "play"
  | "close"
  | "awe"
  | "difficult"
  | "support"
  | "unsure";

/* Single source of truth for motivation labels — MotivationChooser
   and ShelfFilter must never drift apart on wording. */
export const MOTIVATION_LABELS: Record<Motivation, string> = {
  curious: "Curious or learning",
  play: "Fun, play, or a change of pace",
  close: "Feeling close to others",
  awe: "Wonder, creativity, or awe",
  difficult: "Working through something difficult",
  support: "Supporting someone else",
  unsure: "Not sure yet",
};

export type Horizon =
  | "weeks-before"
  | "days-before"
  | "day-of"
  | "during"
  | "first-hours"
  | "first-days"
  | "first-weeks"
  | "months-after";

export const SHELF_LABELS: Record<Shelf, string> = {
  before: "Before",
  between: "In between",
  integration: "Integration",
  learn: "Learn",
};

export const SHELF_PATHS: Record<Shelf, string> = {
  before: "/before",
  between: "/between",
  integration: "/integration",
  learn: "/learn",
};

export const HORIZON_LABELS: Record<Horizon, string> = {
  "weeks-before": "In the weeks before",
  "days-before": "In the days before",
  "day-of": "On the day",
  during: "While it is happening",
  "first-hours": "The first few hours after",
  "first-days": "The first few days after",
  "first-weeks": "The weeks after",
  "months-after": "Months later",
};

/* Stable rendering order for horizon sections. This is chronology,
   not priority, and it never implies completion. */
export const HORIZON_ORDER: Horizon[] = [
  "weeks-before",
  "days-before",
  "day-of",
  "during",
  "first-hours",
  "first-days",
  "first-weeks",
  "months-after",
];

interface HasHorizon {
  data: { horizon?: Horizon; order: number };
}

/* Groups cards into horizon sections, preserving a trailing
   ungrouped bucket for cards with no horizon. Cards without a
   horizon are not lesser content — they are simply not time-bound,
   so they render in a plain unlabelled group. */
export function groupByHorizon<T extends HasHorizon>(cards: T[]) {
  const byOrder = [...cards].sort((a, b) => a.data.order - b.data.order);
  const grouped = HORIZON_ORDER.map((horizon) => ({
    horizon,
    label: HORIZON_LABELS[horizon],
    cards: byOrder.filter((c) => c.data.horizon === horizon),
  })).filter((g) => g.cards.length > 0);

  const untimed = byOrder.filter((c) => !c.data.horizon);

  return { grouped, untimed };
}
