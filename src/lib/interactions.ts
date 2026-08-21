/* ============================================================
   Bearings — Drug-combination lookup (pure, no storage I/O)

   A read-only reference: given two substances, return the
   combination's risk status, a plain definition of that status,
   and any per-pair note. Order-independent (A+B === B+A).

   This module is pure and stateless. It ships with the app as
   static reference data — it writes nothing, reads no device
   storage, and makes no network calls. The dataset is a pinned,
   dated snapshot (see provenance below), rendered the same for
   everyone.

   DATA PROVENANCE: statuses follow the TripSit taxonomy and its
   published community chart (tripsit.me/combo), cross-checked
   against the repo's own sourced content where they overlap
   (lithium: Nayak 2021, already cited on /safety). Per-pair notes
   are Bearings' own wording. Unlisted pairs resolve to "unknown"
   by design — silence means the data is silent, never "safe".
   This table is reference material, not screening: it joins the
   clinician-review queue before release like the rest of the
   safety-adjacent content.
   ============================================================ */

import definitionsData from "../data/combo-definitions.json";
import comboData from "../data/combos.json";

/** The seven combination risk statuses. This taxonomy is the
    widely-used harm-reduction standard; the wording of each
    definition (in combo-definitions.json) is Bearings' own.
    Order is severity-descending and drives only render order. */
export type Status =
  | "dangerous"
  | "unsafe"
  | "caution"
  | "low-risk-decrease"
  | "low-risk-no-synergy"
  | "low-risk-synergy"
  | "unknown";

export interface StatusDefinition {
  id: Status;
  /** short human label, e.g. "Low risk & synergy" */
  label: string;
  /** typographic marker, never emoji — a status is legible by
      colour AND glyph AND label, never colour alone. */
  glyph: string;
  /** plain, non-directive definition in Bearings' voice. */
  definition: string;
}

export interface Substance {
  id: string;
  name: string;
  aliases: string[];
}

export interface ComboResult {
  a: Substance;
  b: Substance;
  status: Status;
  definition: StatusDefinition;
  note?: string;
  /** true when the same substance was chosen on both sides. */
  sameSubstance: boolean;
}

export const STATUS_DEFINITIONS = definitionsData as unknown as StatusDefinition[];

const DEFINITION_BY_ID = Object.fromEntries(
  STATUS_DEFINITIONS.map((d) => [d.id, d]),
) as Record<Status, StatusDefinition>;

/** Definition for a status. "unknown" always resolves, so callers
    never have to handle a missing definition. */
export function statusDefinition(status: Status): StatusDefinition {
  return DEFINITION_BY_ID[status];
}

/* Provenance — mirrors referrals.ts `lastVerified`, shown to the
   user so they can judge freshness for themselves. */
export const isSampleData = false;
export const sourceLabel = "TripSit combination chart · community-maintained";
export const sourceUrl = "https://tripsit.me/combo";
export const sourceSnapshotDate = "2026-08-21";

interface RawCell {
  status: Status;
  note?: string;
}
type RawCombos = Record<string, Record<string, RawCell>>;

const RAW = comboData as unknown as {
  substances: Substance[];
  combos: RawCombos;
};

/** Substances, sorted by display name for stable UI ordering. */
export const substances: Substance[] = [...RAW.substances].sort((x, y) =>
  x.name.localeCompare(y.name),
);

const SUBSTANCE_BY_ID: Record<string, Substance> = Object.fromEntries(
  RAW.substances.map((s) => [s.id, s]),
);

const combos: RawCombos = RAW.combos;

/** Look up the cell for an unordered pair. Forgiving: checks both
    directions, so the data need only store each pair once. */
function cellFor(aId: string, bId: string): RawCell | undefined {
  return combos[aId]?.[bId] ?? combos[bId]?.[aId];
}

/** The core lookup. Returns a fully-resolved result for any two
    substance ids in the dataset, or null if either id is unknown.
    An unlisted pair resolves to the "unknown" status rather than
    throwing, matching the taxonomy. */
export function lookup(aId: string, bId: string): ComboResult | null {
  const a = SUBSTANCE_BY_ID[aId];
  const b = SUBSTANCE_BY_ID[bId];
  if (!a || !b) return null;

  const sameSubstance = aId === bId;
  const cell = sameSubstance ? undefined : cellFor(aId, bId);
  const status: Status = cell?.status ?? "unknown";

  return {
    a,
    b,
    status,
    definition: statusDefinition(status),
    note: cell?.note,
    sameSubstance,
  };
}
