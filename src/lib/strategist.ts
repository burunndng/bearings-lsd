/* ============================================================
   Bearings — Strategist reflection engine (pure, no storage I/O)

   A deterministic, on-device reflection tool. The user answers what
   they want to (all fields optional), chooses a lens, and receives a
   plain reading: their own words back, plus fixed questions and things
   to check on.

   This module contains no storage I/O, no network calls, no
   interpretation. It is a pure transformation engine that builds a
   reading from user inputs using fixed, trusted wording — like the
   interview prompts in sessions.ts. Nothing here is generated; all
   content is authored ahead.

   Crisis-language detection is strict but permissive: false positives
   are acceptable because the UI shows a non-blocking panel with a
   continue-anyway route. False negatives are not acceptable — if
   someone writes language that suggests they are in crisis, they must
   see the referral panel, even if it turns out to be a false positive.
   ============================================================ */

import type { StrategistReading, StrategistSection } from "./storage.ts";

/** The three lenses available for arranging questions. Each is a way
    of looking at the same situation, not a path or a progression. */
export const STRATEGIST_LENSES = [
  "change-map",
  "learning-loops",
  "pulling-two",
] as const;

export type StrategistLens = (typeof STRATEGIST_LENSES)[number];

/** Fixed content for each lens. The description introduces the
    perspective; the questions are asked the same way every time —
    these are not generated, they are trusted wording like the
    interview prompts. */
export const LENS_INFO: Record<
  StrategistLens,
  { label: string; description: string }
> = {
  "change-map": {
    label: "A map of change",
    description: "What tends to change, and what you would have to give up for it to.",
  },
  "learning-loops": {
    label: "How learning loops back",
    description: "What is being learned, and what is doing the learning.",
  },
  "pulling-two": {
    label: "Pulling in two directions",
    description: "Two pulls at once, and what each one protects.",
  },
};

/** User inputs for building a reading. All fields are optional — the
    reading works with whatever is given, and empty fields are allowed.
    This is a tool, not a form to complete. */
export interface StrategistInputs {
  /** Where things stand: energy, mood, sleep, whether the ground feels steady. */
  currentState?: string;
  /** What happened recently: the experience itself, or the days since. */
  recentExperience?: string;
  /** Which lens to arrange questions through. */
  focusDomain: StrategistLens;
  /** What feels jagged, or pulled in two directions at once. */
  observedTension?: string;
}

/** Crisis-language markers. Case-insensitive matching. False positives
    are acceptable — the UI panel is non-blocking. False negatives are
    not acceptable. */
export const CRISIS_MARKERS = [
  "suicide",
  "suicidal",
  "kill myself",
  "killing myself",
  "end my life",
  "end it all",
  "want to die",
  "wish i was dead",
  "harm myself",
  "hurting myself",
  "hurt myself",
  "hearing voices",
  "going to hurt someone",
  "hurt someone else",
] as const;

/** Detects crisis language in user input. Returns true if any marker
    appears in the text, case-insensitive. This is a gate that shows a
    non-blocking referral panel — the user can continue anyway. */
export function isCrisisInput(text: string): boolean {
  const lowered = text.toLowerCase();
  return CRISIS_MARKERS.some((marker) => lowered.includes(marker));
}

/** Builds a complete strategy reading from user inputs. Always returns
    all five sections in the same order (audit, tension, lens, check,
    return) even when fields are empty — this is stable layout, not
    dynamic content.

    The reading is deterministic: same inputs always produce the same
    reading. Nothing here is generated; all content is fixed, trusted
    wording that ships with the app. */
export function buildReading(inputs: StrategistInputs): StrategistReading {
  const sections: StrategistSection[] = [];

  /* ----------------------------------------------------------------
     1. Audit section (quiet: true)

     Shows what the system checked and what fields were used. This is
     the "how this was assembled" section, collapsed by default because
     it is meta-information about the process, not the reading itself.
     ---------------------------------------------------------------- */

  const auditLines: string[] = [];

  auditLines.push("Checks that ran before anything was shown:");
  const allText = [
    inputs.currentState,
    inputs.recentExperience,
    inputs.observedTension,
  ]
    .filter(Boolean)
    .join("\n");
  auditLines.push(
    `crisis-language check (${isCrisisInput(allText) ? "found" : "none found"}), lens selection, question selection.`,
  );
  auditLines.push("No text left this device.");

  if (inputs.currentState) {
    auditLines.push("Where things stand — included.");
  } else {
    auditLines.push("Where things stand — left blank, that is allowed.");
  }

  if (inputs.recentExperience) {
    auditLines.push("What happened recently — included.");
  } else {
    auditLines.push("What happened recently — left blank, that is allowed.");
  }

  if (inputs.observedTension) {
    auditLines.push("What is pulling — included.");
  } else {
    auditLines.push("What is pulling — left blank, that is allowed.");
  }

  sections.push({
    id: "audit",
    title: "How this reading was assembled",
    body: auditLines.join("\n"),
    quiet: true,
  });

  /* ----------------------------------------------------------------
     2. Tension section

     When the user wrote about what is pulling, mirror it back verbatim
     as its own paragraph, then ask fixed questions. If they left it
     blank, say that is allowed and invite them back.
     ---------------------------------------------------------------- */

  if (inputs.observedTension) {
    const tensionLines: string[] = [
      inputs.observedTension,
      "",
      "Put the tension into one sentence, in your own words.",
      "What would have to be true for this to feel less urgent?",
      "What would change if you decided nothing about it today?",
    ];
    sections.push({
      id: "tension",
      title: "The tension, in your own words",
      body: tensionLines.join("\n"),
      quiet: false,
    });
  } else {
    sections.push({
      id: "tension",
      title: "The tension, in your own words",
      body: "You left this one blank. That is allowed. Come back to it if it starts pulling.",
      quiet: false,
    });
  }

  /* ----------------------------------------------------------------
     3. Lens section

     The selected lens provides a description and fixed questions.
     These are the same every time, like interview prompts — not
     generated, not personalized.
     ---------------------------------------------------------------- */

  const lensInfo = LENS_INFO[inputs.focusDomain];
  const lensLines: string[] = [lensInfo.description, ""];

  switch (inputs.focusDomain) {
    case "change-map":
      lensLines.push(
        "If this were already behind you, what would look different about an ordinary day?",
        "What would changing cost or protect that you are not willing to price yet?",
      );
      break;
    case "learning-loops":
      lensLines.push(
        "What is this experience teaching you about how you react?",
        "What is it teaching you about how you learn, and can you learn it without reliving it?",
        "What does the pattern say about what you value?",
      );
      break;
    case "pulling-two":
      lensLines.push(
        "Name the two pulls. What would following each one protect or cost?",
        "Is one of them yours, and is the other answering something or someone else?",
        "Is there a third option that is not either pull?",
      );
      break;
  }

  sections.push({
    id: "lens",
    title: lensInfo.label,
    body: lensLines.join("\n"),
    quiet: false,
  });

  /* ----------------------------------------------------------------
     4. Check section

     Fixed suggestions of things to look after in the hours after.
     These are not obligations — "none of these are owed" makes that
     clear.
     ---------------------------------------------------------------- */

  sections.push({
    id: "check",
    title: "Things you may want to check on",
    body: [
      "Rest, warmth, and simple food can help in the hours after.",
      "You may want to consider who is around you and what has been agreed.",
      "There is no rush on decisions made from inside an intense experience.",
      "If any part of this matters to you later, you can come back to it.",
      "",
      "None of these are owed. They are suggestions, not a list of obligations.",
    ].join("\n"),
    quiet: false,
  });

  /* ----------------------------------------------------------------
     5. Return section

     The closing reminder: everything here is material for a choice,
    not a requirement. This section gets a visual accent (gold border)
    in the UI to signal it is the "what you do with this" part.
     ---------------------------------------------------------------- */

  sections.push({
    id: "return",
    title: "The choice is yours",
    body: "Everything on this page is material for a choice you get to make, later or never. You are allowed to set the whole reading aside and act on none of it.",
    quiet: false,
  });

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    sections,
  };
}
