import { describe, expect, test } from "bun:test";
import {
  buildReading,
  isCrisisInput,
  STRATEGIST_LENSES,
  LENS_INFO,
  type StrategistLens,
} from "./strategist.ts";
import { createStore, memoryBacking } from "./storage.ts";

describe("buildReading", () => {
  test("returns all five sections in correct order", () => {
    const reading = buildReading({
      currentState: "feeling tired",
      recentExperience: "difficult night",
      focusDomain: "learning-loops",
      observedTension: "caught between two choices",
    });

    expect(reading.sections).toHaveLength(5);
    expect(reading.sections.map((s) => s.id)).toEqual([
      "audit",
      "tension",
      "lens",
      "check",
      "return",
    ]);
  });

  test("audit section has quiet: true", () => {
    const reading = buildReading({
      currentState: "feeling tired",
      recentExperience: "difficult night",
      focusDomain: "learning-loops",
      observedTension: "caught between two choices",
    });

    expect(reading.sections[0].id).toBe("audit");
    expect(reading.sections[0].quiet).toBe(true);
  });

  test("lens section title matches selected lens label", () => {
    for (const lens of STRATEGIST_LENSES) {
      const reading = buildReading({
        focusDomain: lens as StrategistLens,
      });
      const lensSection = reading.sections.find((s) => s.id === "lens");
      expect(lensSection?.title).toBe(LENS_INFO[lens as StrategistLens].label);
    }
  });

  test("lens section title differs between lenses", () => {
    const reading1 = buildReading({ focusDomain: "change-map" });
    const reading2 = buildReading({ focusDomain: "learning-loops" });
    const reading3 = buildReading({ focusDomain: "pulling-two" });

    const title1 = reading1.sections.find((s) => s.id === "lens")?.title;
    const title2 = reading2.sections.find((s) => s.id === "lens")?.title;
    const title3 = reading3.sections.find((s) => s.id === "lens")?.title;

    expect(title1).not.toBe(title2);
    expect(title2).not.toBe(title3);
    expect(title1).not.toBe(title3);
  });

  test("observedTension text appears verbatim in tension section", () => {
    const tensionText =
      "I feel pulled between wanting to stay home and wanting to go out";
    const reading = buildReading({
      focusDomain: "learning-loops",
      observedTension: tensionText,
    });

    const tensionSection = reading.sections.find((s) => s.id === "tension");
    expect(tensionSection?.body).toContain(tensionText);
  });

  test("empty inputs still return all five sections, no throw", () => {
    const reading = buildReading({
      currentState: undefined,
      recentExperience: undefined,
      focusDomain: "learning-loops",
      observedTension: undefined,
    });

    expect(reading.sections).toHaveLength(5);
    expect(reading.sections.map((s) => s.id)).toEqual([
      "audit",
      "tension",
      "lens",
      "check",
      "return",
    ]);
  });

  test("empty fields show 'left blank, that is allowed' in audit", () => {
    const reading = buildReading({
      currentState: undefined,
      recentExperience: undefined,
      focusDomain: "learning-loops",
      observedTension: undefined,
    });

    const auditSection = reading.sections.find((s) => s.id === "audit");
    expect(auditSection?.body).toContain("Where things stand — left blank");
    expect(auditSection?.body).toContain("What happened recently — left blank");
    expect(auditSection?.body).toContain("What is pulling — left blank");
  });

  test("empty tension section allows blank", () => {
    const reading = buildReading({
      focusDomain: "learning-loops",
      observedTension: undefined,
    });

    const tensionSection = reading.sections.find((s) => s.id === "tension");
    expect(tensionSection?.body).toContain("left this one blank");
    expect(tensionSection?.body).toContain("That is allowed");
  });

  test("change-map lens includes correct questions", () => {
    const reading = buildReading({ focusDomain: "change-map" });
    const lensSection = reading.sections.find((s) => s.id === "lens");

    expect(lensSection?.body).toContain("If this were already behind you");
    expect(lensSection?.body).toContain("What would changing cost or protect");
  });

  test("learning-loops lens includes correct questions", () => {
    const reading = buildReading({ focusDomain: "learning-loops" });
    const lensSection = reading.sections.find((s) => s.id === "lens");

    expect(lensSection?.body).toContain("teaching you about how you react");
    expect(lensSection?.body).toContain("teaching you about how you learn");
    expect(lensSection?.body).toContain("pattern say about what you value");
  });

  test("pulling-two lens includes correct questions", () => {
    const reading = buildReading({ focusDomain: "pulling-two" });
    const lensSection = reading.sections.find((s) => s.id === "lens");

    expect(lensSection?.body).toContain("Name the two pulls");
    expect(lensSection?.body).toContain("Is one of them yours");
    expect(lensSection?.body).toContain("third option that is not either pull");
  });

  test("check section includes all standard lines", () => {
    const reading = buildReading({ focusDomain: "learning-loops" });
    const checkSection = reading.sections.find((s) => s.id === "check");

    expect(checkSection?.body).toContain("Rest, warmth, and simple food");
    expect(checkSection?.body).toContain("who is around you");
    expect(checkSection?.body).toContain("no rush on decisions");
    expect(checkSection?.body).toContain("None of these are owed");
  });

  test("return section emphasizes choice", () => {
    const reading = buildReading({ focusDomain: "learning-loops" });
    const returnSection = reading.sections.find((s) => s.id === "return");

    expect(returnSection?.title).toBe("The choice is yours");
    expect(returnSection?.body).toContain("set the whole reading aside");
  });

  test("generates stable id and timestamp", () => {
    const reading = buildReading({ focusDomain: "learning-loops" });

    expect(reading.id).toMatch(/^[0-9a-f-]{36}$/); // UUID format
    expect(new Date(reading.createdAt)).toBeInstanceOf(Date);
  });
});

describe("isCrisisInput", () => {
  test("detects explicit suicide language", () => {
    expect(isCrisisInput("I keep thinking about killing myself")).toBe(true);
    expect(isCrisisInput("I'm feeling suicidal")).toBe(true);
    expect(isCrisisInput("I want to end my life")).toBe(true);
    expect(isCrisisInput("I want to end it all")).toBe(true);
    expect(isCrisisInput("I wish I was dead")).toBe(true);
    expect(isCrisisInput("I'm thinking about suicide")).toBe(true);
  });

  test("detects self-harm language", () => {
    expect(isCrisisInput("I'm thinking about hurting myself")).toBe(true);
    expect(isCrisisInput("I want to harm myself")).toBe(true);
    expect(isCrisisInput("I'm hurting myself")).toBe(true);
    expect(isCrisisInput("hurt myself")).toBe(true);
  });

  test("detects harm-to-others language", () => {
    expect(isCrisisInput("I'm going to hurt someone")).toBe(true);
    expect(isCrisisInput("I might hurt someone else")).toBe(true);
  });

  test("detects psychosis language", () => {
    expect(isCrisisInput("I'm hearing voices")).toBe(true);
  });

  test("case-insensitive matching", () => {
    expect(isCrisisInput("I'm feeling SUICIDAL")).toBe(true);
    expect(isCrisisInput("I WANT TO KILL MYSELF")).toBe(true);
    expect(isCrisisInput("HeArInG vOiCeS")).toBe(true);
  });

  test("returns false for normal content", () => {
    expect(
      isCrisisInput("I had a difficult experience and feel tired"),
    ).toBe(false);
    expect(isCrisisInput("I'm feeling anxious about tomorrow")).toBe(false);
    expect(isCrisisInput("This was a really hard experience")).toBe(false);
  });

  test("returns false for empty string", () => {
    expect(isCrisisInput("")).toBe(false);
  });
});

describe("storage round-trip", () => {
  test("save and load readings via deep module seam", async () => {
    const store = createStore(memoryBacking());
    const reading = buildReading({
      currentState: "feeling tired but hopeful",
      recentExperience: "intense night",
      focusDomain: "pulling-two",
      observedTension: "want to stay, want to leave",
    });

    await store.save("bearings-readings", [reading]);
    const loaded = await store.load("bearings-readings");

    expect(loaded).toBeDefined();
    expect(loaded).toHaveLength(1);
    expect(loaded![0]).toEqual(reading);
    expect(loaded![0].sections).toHaveLength(5);
  });

  test("round-trip with multiple readings", async () => {
    const store = createStore(memoryBacking());
    const reading1 = buildReading({
      focusDomain: "change-map",
      observedTension: "stuck in old patterns",
    });
    const reading2 = buildReading({
      focusDomain: "learning-loops",
      currentState: "more aware now",
    });

    await store.save("bearings-readings", [reading1, reading2]);
    const loaded = await store.load("bearings-readings");

    expect(loaded).toHaveLength(2);
    expect(loaded![0]).toEqual(reading1);
    expect(loaded![1]).toEqual(reading2);
  });

  test("round-trip preserves exact section order and content", async () => {
    const store = createStore(memoryBacking());
    const reading = buildReading({
      focusDomain: "pulling-two",
      observedTension: "pulled two ways",
    });

    await store.save("bearings-readings", [reading]);
    const loaded = await store.load("bearings-readings");

    expect(loaded![0].sections.map((s) => s.id)).toEqual([
      "audit",
      "tension",
      "lens",
      "check",
      "return",
    ]);

    for (let i = 0; i < reading.sections.length; i++) {
      expect(loaded![0].sections[i].title).toBe(reading.sections[i].title);
      expect(loaded![0].sections[i].body).toBe(reading.sections[i].body);
      expect(loaded![0].sections[i].quiet).toBe(reading.sections[i].quiet);
    }
  });

  test("memoryBacking clones on get and set", async () => {
    const store = createStore(memoryBacking());
    const reading = buildReading({ focusDomain: "learning-loops" });

    await store.save("bearings-readings", [reading]);
    const loaded1 = await store.load("bearings-readings");
    const loaded2 = await store.load("bearings-readings");

    // Mutating the first loaded copy should not affect the second
    loaded1![0].sections[0].title = "tampered";

    expect(loaded2![0].sections[0].title).toBe(
      "How this reading was assembled",
    );
  });
});
