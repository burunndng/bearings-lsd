import { expect, test, describe } from "bun:test";
import {
  stripFrontmatter,
  isDraft,
  bodyLinkTargets,
  resolveBodyLink,
} from "./lint-links.js";

const CTX = {
  cardIds: new Set(["that-is-enough", "doing-this-alone"]),
  draftCardIds: new Set(["doing-this-alone"]),
  learnIds: new Set(["the-weeks-after"]),
  draftLearnIds: new Set<string>(),
  staticRoutes: new Set(["/safety", "/notes", "/before"]),
};

describe("stripFrontmatter", () => {
  test("removes the frontmatter block so frontmatter urls are not scanned", () => {
    const text = `---\nurl: "https://example.com/x"\n---\n\nBody [a](/safety).\n`;
    expect(stripFrontmatter(text)).not.toContain("example.com");
    expect(stripFrontmatter(text)).toContain("/safety");
  });

  test("returns text unchanged when there is no frontmatter", () => {
    expect(stripFrontmatter("plain body")).toBe("plain body");
  });
});

describe("isDraft", () => {
  test("true only when draft: true is in the frontmatter", () => {
    expect(isDraft(`---\ndraft: true\n---\nbody`)).toBe(true);
    expect(isDraft(`---\ndraft: false\n---\nbody`)).toBe(false);
    expect(isDraft(`---\ntitle: "x"\n---\nbody`)).toBe(false);
  });

  test("ignores the word draft in the body", () => {
    expect(isDraft(`---\ntitle: "x"\n---\nI wrote a draft: true story.`)).toBe(
      false,
    );
  });
});

describe("bodyLinkTargets", () => {
  test("finds root-relative markdown links, ignoring external ones", () => {
    const text = `---\ntitle: "t"\n---\nSee [a](/card/that-is-enough) and [b](https://x.com) and [c](/safety).`;
    expect(bodyLinkTargets(text)).toEqual(["/card/that-is-enough", "/safety"]);
  });

  test("finds a link split across a wrapped line", () => {
    const text = `---\ntitle: "t"\n---\nSee [Doing this\nalone](/card/doing-this-alone) for more.`;
    expect(bodyLinkTargets(text)).toEqual(["/card/doing-this-alone"]);
  });
});

describe("resolveBodyLink", () => {
  test("resolves a published card", () => {
    expect(resolveBodyLink("/card/that-is-enough", CTX)).toBeNull();
  });

  test("rejects a card that exists but is draft — this is the shipped 404", () => {
    expect(resolveBodyLink("/card/doing-this-alone", CTX)).toBe(
      'links to "/card/doing-this-alone" — that card is draft: true, so no page is built for it',
    );
  });

  test("rejects a card id that does not exist at all", () => {
    expect(resolveBodyLink("/card/nope", CTX)).toBe(
      'links to "/card/nope" — no card with that id',
    );
  });

  test("resolves a known static route", () => {
    expect(resolveBodyLink("/safety", CTX)).toBeNull();
  });

  test("rejects an unknown static route", () => {
    expect(resolveBodyLink("/sfaety", CTX)).toBe(
      'links to "/sfaety" — no such page',
    );
  });

  test("resolves a published learn entry", () => {
    expect(resolveBodyLink("/learn/the-weeks-after", CTX)).toBeNull();
  });
});
