import { describe, expect, test } from "bun:test";
import {
  STATUS_DEFINITIONS,
  statusDefinition,
  substances,
  lookup,
  type Status,
} from "./interactions.ts";

const ALL_STATUSES: Status[] = [
  "dangerous",
  "unsafe",
  "caution",
  "low-risk-decrease",
  "low-risk-no-synergy",
  "low-risk-synergy",
  "unknown",
];

describe("status definitions", () => {
  test("every status has exactly one definition", () => {
    expect(STATUS_DEFINITIONS).toHaveLength(ALL_STATUSES.length);
    for (const status of ALL_STATUSES) {
      const def = STATUS_DEFINITIONS.find((d) => d.id === status);
      expect(def).toBeDefined();
    }
  });

  test("definitions carry a non-empty label, glyph, and text", () => {
    for (const def of STATUS_DEFINITIONS) {
      expect(def.label.length).toBeGreaterThan(0);
      expect(def.glyph.length).toBeGreaterThan(0);
      expect(def.definition.length).toBeGreaterThan(0);
    }
  });

  test("statusDefinition resolves for every status, including unknown", () => {
    for (const status of ALL_STATUSES) {
      expect(statusDefinition(status).id).toBe(status);
    }
  });
});

describe("lookup", () => {
  test("returns a known pair's status with the matching definition", () => {
    const r = lookup("mdma", "tramadol");
    expect(r).not.toBeNull();
    expect(r!.status).toBe("dangerous");
    expect(r!.definition.id).toBe("dangerous");
    expect(r!.a.id).toBe("mdma");
    expect(r!.b.id).toBe("tramadol");
  });

  test("is order-independent (A+B === B+A)", () => {
    for (const [a, b] of [
      ["mdma", "lsd"],
      ["psilocybin", "ketamine"],
      ["alcohol", "benzos"],
      ["caffeine", "mdma"],
      ["lsd", "lithium"],
    ]) {
      expect(lookup(a, b)!.status).toBe(lookup(b, a)!.status);
      expect(lookup(a, b)!.note).toBe(lookup(b, a)!.note);
    }
  });

  test("an unlisted pair resolves to unknown, not an error", () => {
    const r = lookup("cannabis", "lithium");
    expect(r).not.toBeNull();
    expect(r!.status).toBe("unknown");
    expect(r!.definition.id).toBe("unknown");
  });

  test("same substance on both sides is flagged", () => {
    const r = lookup("mdma", "mdma");
    expect(r).not.toBeNull();
    expect(r!.sameSubstance).toBe(true);
  });

  test("a per-pair note is returned when present", () => {
    const r = lookup("mdma", "tramadol");
    expect(r!.note).toBeTruthy();
  });

  test("no note when the pair has none", () => {
    const r = lookup("lsd", "psilocybin");
    expect(r!.status).toBe("low-risk-synergy");
    expect(r!.note).toBeUndefined();
  });

  test("returns null for an unknown substance id", () => {
    expect(lookup("mdma", "not-a-substance")).toBeNull();
    expect(lookup("nope", "lsd")).toBeNull();
  });
});

describe("dataset integrity", () => {
  test("substances are present and sorted by name", () => {
    expect(substances.length).toBeGreaterThan(1);
    const names = substances.map((s) => s.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  test("every pair of substances resolves to a valid status", () => {
    for (const a of substances) {
      for (const b of substances) {
        const r = lookup(a.id, b.id);
        expect(r).not.toBeNull();
        expect(ALL_STATUSES).toContain(r!.status);
      }
    }
  });

  test("the dataset exercises every coloured (non-unknown) status", () => {
    const seen = new Set<Status>();
    for (const a of substances) {
      for (const b of substances) {
        if (a.id === b.id) continue;
        seen.add(lookup(a.id, b.id)!.status);
      }
    }
    for (const status of ALL_STATUSES) {
      if (status === "unknown") continue;
      expect(seen.has(status)).toBe(true);
    }
  });

  test("every stored cell carries a valid status id", () => {
    // Guard against typos in the JSON itself: a misspelled status
    // would silently become `undefined` and resolve to unknown.
    const valid = new Set<string>(ALL_STATUSES);
    for (const def of STATUS_DEFINITIONS) valid.add(def.id);
    for (const a of substances) {
      for (const b of substances) {
        if (a.id === b.id) continue;
        const r = lookup(a.id, b.id)!;
        if (r.status !== "unknown") {
          expect(valid.has(r.status)).toBe(true);
        }
      }
    }
  });
});
