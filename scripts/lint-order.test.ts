import { expect, test, describe } from "bun:test";
import {
  readOrder,
  readKey,
  groupKeyFor,
  findCollisions,
} from "./lint-order.js";

describe("readOrder", () => {
  test("reads an explicit order", () => {
    expect(readOrder(`---\ntitle: "t"\norder: 25\n---\nbody`)).toBe(25);
  });

  test("defaults to 999 when absent, matching the cards schema default", () => {
    expect(readOrder(`---\ntitle: "t"\n---\nbody`)).toBe(999);
  });

  test("ignores an order-looking line in the body", () => {
    expect(readOrder(`---\ntitle: "t"\n---\norder: 3 in the body`)).toBe(999);
  });
});

describe("readKey", () => {
  test("reads and unquotes a scalar", () => {
    expect(readKey(`---\nshelf: before\n---\nb`, "shelf")).toBe("before");
    expect(readKey(`---\nroute: "pause"\n---\nb`, "route")).toBe("pause");
  });

  test("returns null when the key is absent", () => {
    expect(readKey(`---\ntitle: "t"\n---\nb`, "horizon")).toBeNull();
  });
});

describe("groupKeyFor", () => {
  test("cards group by shelf and horizon — order is only meaningful inside a group", () => {
    expect(groupKeyFor("cards", { shelf: "before", horizon: "day-of" })).toBe(
      "shelf=before horizon=day-of",
    );
  });

  test("a card with no horizon groups with the other untimed cards on its shelf", () => {
    expect(groupKeyFor("cards", { shelf: "integration", horizon: null })).toBe(
      "shelf=integration horizon=(none)",
    );
  });

  test("safety groups by route", () => {
    expect(groupKeyFor("safety", { route: "pause" })).toBe("route=pause");
  });

  test("learn and resources are each one flat ordered list", () => {
    expect(groupKeyFor("learn", {})).toBe("(collection)");
    expect(groupKeyFor("resources", {})).toBe("(collection)");
  });
});

describe("findCollisions", () => {
  test("reports two entries sharing an order within a group", () => {
    const problems = findCollisions([
      { rel: "a.md", group: "(collection)", order: 10 },
      { rel: "b.md", group: "(collection)", order: 10 },
    ]);
    expect(problems).toEqual([
      'order: 10 is used by 2 entries in (collection) — a.md, b.md. Sort order between them is arbitrary.',
    ]);
  });

  test("the same order in different groups is fine", () => {
    expect(
      findCollisions([
        { rel: "a.md", group: "shelf=before horizon=day-of", order: 10 },
        { rel: "b.md", group: "shelf=integration horizon=first-days", order: 10 },
      ]),
    ).toEqual([]);
  });

  test("lists every colliding file, not just the first two", () => {
    const problems = findCollisions([
      { rel: "a.md", group: "g", order: 5 },
      { rel: "b.md", group: "g", order: 5 },
      { rel: "c.md", group: "g", order: 5 },
    ]);
    expect(problems[0]).toContain("3 entries");
    expect(problems[0]).toContain("a.md, b.md, c.md");
  });
});
