import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

/* ============================================================
   Bearings — Content collection schemas
   Blocking Decision 4: schema finalized BEFORE authoring.
   Every field earns its place. Conservative and extensible.

   Astro v7: collections use the glob() loader and live at
   src/content.config.ts (not src/content/config.ts).

   Phase B additions (preparation + integration build-out):
   - shelves: added `between` and renamed `after` -> `integration`
   - horizon: OPTIONAL timing metadata. Advisory grouping only.
     Never a sequence to complete, never counted, never "next".
   - audience: self vs companion (someone supporting another person)
   - substances: EMPTY array = substance-agnostic (the default).
     Named entries = deliberately substance-specific content.
   - sources: required in practice for any factual claim, on cards
     as well as learn entries. Rigorous sourcing is a hard rule.
   - reviewedBy / reviewedOn / riskLevel: review metadata lives on
     cards now, not just safety. Content that carries risk cannot
     ship unreviewed.
   ============================================================ */

/* The seven equal-weight motivations. No ordering implied here —
   ordering policy lives in the chooser component, documented there.
   A card may serve several motivations (multi-select array). */
const MOTIVATIONS = [
  "curious",     // Curious or learning
  "play",        // Fun, play, or a change of pace
  "close",       // Feeling close to others
  "awe",         // Wonder, creativity, or awe
  "difficult",   // Working through something difficult
  "support",     // Supporting someone else
  "unsure",      // Not sure yet
] as const;

/* `between` covers the acute phase the home copy already promises
   ("before, after, or somewhere in between") and gives the urgent
   route a home that is not only the footer.
   `integration` is the after phase. The term is used deliberately
   and in the UI — it is the accurate word for this work. The
   wellness-cliche constructions of it remain on the forbidden list
   in VOICE_GUIDE.md; the plain noun is fine, the cliche is not. */
const SHELVES = ["before", "between", "integration", "learn"] as const;

/* tone drives subtle presentation, never a value ranking.
   'ambiguity' cards ("that is enough") are first-class content.
   'deep' marks the advanced multidisciplinary material (lenses,
   doorways, ledgers) — a garnet register that says "slower, older
   traditions inside", never "better". */
const TONES = ["practical", "reflective", "risk", "ambiguity", "deep"] as const;

/* OPTIONAL timing metadata. A card with no horizon is not lesser —
   it simply is not time-bound. Rendering groups by horizon only
   when horizons are present, as plain sections. No progress
   semantics: see PRODUCT_BOUNDARY.md hard commitments. */
const HORIZONS = [
  "weeks-before",
  "days-before",
  "day-of",
  "during",
  "first-hours",
  "first-days",
  "first-weeks",
  "months-after",
] as const;

/* Someone supporting another person reads in a different posture,
   often mid-event. Defaults to `self`. */
const AUDIENCES = ["self", "companion"] as const;

/* Substance-agnostic by default (empty array). Named substances mark
   content that is deliberately specific, which raises the sourcing
   and review bar rather than lowering it. */
const SUBSTANCES = [
  "psilocybin",
  "lsd",
  "mdma",
  "ketamine",
  "ayahuasca",
  "dmt",
  "mescaline",
  "cannabis",
  "other",
] as const;

/* `standard` content still needs sources for factual claims.
   `elevated` content (medical, crisis-adjacent, legal) must carry
   reviewedBy + reviewedOn before it can ship. */
const RISK_LEVELS = ["standard", "elevated"] as const;

/* Shared so cards and learn cannot drift apart. Sourcing format is
   one thing, defined once.

   url is validated as http(s) via refine rather than the deprecated
   .url() helper. Validation matters here: a citation pointing at a
   malformed or non-web URL is a sourcing failure, and sourcing is a
   hard rule, so it should fail the build rather than ship. */
const sourceSchema = z.object({
  cite: z.string().min(1),
  url: z
    .string()
    .refine((v) => /^https?:\/\/\S+$/.test(v), {
      message: "Source url must be an absolute http(s) URL",
    })
    .optional(),
  year: z.number().int().min(1900).max(2100).optional(),
});

const cards = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/cards" }),
  schema: z
    .object({
      title: z.string(),
      shelf: z.enum(SHELVES),
      /* multi-select: a card can legitimately serve several
         motivations. Empty array = surfaces for everyone. */
      motivations: z.array(z.enum(MOTIVATIONS)).default([]),
      tone: z.enum(TONES).default("reflective"),
      /* optional timing. absent is a valid, first-class state. */
      horizon: z.enum(HORIZONS).optional(),
      audience: z.enum(AUDIENCES).default("self"),
      /* empty = substance-agnostic */
      substances: z.array(z.enum(SUBSTANCES)).default([]),
      /* renders an optional, always-skippable reflection input */
      optionalPrompt: z.boolean().default(false),
      /* The reflection prompt this card surfaces inside its note
         island. Rendered by CardNote when the card also sets
         optionalPrompt: true — without that flag the island itself
         does not render, so a promptText alone shows nothing. */
      promptText: z.string().max(400).optional(),
      /* short shelf summary; kept separate from body for card previews */
      summary: z.string().max(220).optional(),
      /* sourcing is not optional for factual claims. kept as an array
         so the absence of sources on a claim-bearing card is visible. */
      sources: z.array(sourceSchema).default([]),
      /* cross-links between related cards, by id. Not a "next step". */
      related: z.array(z.string()).default([]),
      /* surfaces an inline safety embed pointing at one of the three
         routes, for cards where a safety handoff belongs in context. */
      safetyRoute: z.enum(["pause", "clinician", "urgent"]).optional(),
      riskLevel: z.enum(RISK_LEVELS).default("standard"),
      reviewedBy: z.string().optional(),
      reviewedOn: z.coerce.date().optional(),
      lastReviewed: z.coerce.date().optional(),
      draft: z.boolean().default(false),
      /* Sort position WITHIN a horizon group (groupByHorizon in
         lib/shelves.ts). Advisory placement only — never a sequence,
         never rendered as a number, no completion semantics.

         Defaults high so an omission sorts LAST rather than first.
         The old default of 0 meant a card that simply forgot this key
         silently led its horizon group, which is a placement decided
         by an oversight rather than by an editor. Failing to the back
         is the quieter failure: a card in an unintended middle
         position is easy to miss in review, a card wrongly leading a
         shelf is what a reader sees first. */
      order: z.number().default(999),
    })
    /* PRODUCT_BOUNDARY.md documents that elevated content needs review
       metadata and sourcing. Documentation alone is not a gate — this
       makes it mechanical. draft: true is the escape valve while a
       card is being authored ahead of review. */
    .superRefine((data, ctx) => {
      if (data.riskLevel !== "elevated" || data.draft) return;
      if (!data.reviewedBy || !data.reviewedOn) {
        ctx.addIssue({
          code: "custom",
          message:
            "riskLevel: elevated requires reviewedBy and reviewedOn, or draft: true until reviewed.",
        });
      }
      if (data.sources.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "riskLevel: elevated requires at least one source.",
        });
      }
    }),
});

/* Safety content: separate collection, three routes.
   Route is visual+linguistic+positional, not color alone. */
const safety = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/safety" }),
  schema: z.object({
    title: z.string(),
    route: z.enum(["pause", "clinician", "urgent"]),
    /* condition-action lead line, e.g. "If you are unsure about
       a medication..." — surfaced above the body. */
    condition: z.string().optional(),
    order: z.number().default(0),
    /* clinical review gate (Blocking Decision 5): content does not
       ship live until reviewed. Tracked in-content, versioned, and
       enforced mechanically by scripts/check-review.js. */
    reviewedBy: z.string().optional(),
    reviewedOn: z.coerce.date().optional(),
    sources: z.array(sourceSchema).default([]),
    /* draft safety content is authored but NOT rendered. This is what
       makes it possible to write and stage this material before a
       clinician has signed it off. */
    draft: z.boolean().default(false),
  }),
});

/* Learn: evidence with visible sourcing and freshness.
   Every claim linked; last-reviewed date shown to users. */
const learn = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/learn" }),
  schema: z
    .object({
      title: z.string(),
      summary: z.string().max(280).optional(),
      /* Same tone vocabulary as cards. Currently only "deep" carries a
         visual register (garnet, on the shelf and detail page); the
         rest render identically. Declared here so the field exists
         instead of being silently stripped as an unknown key. */
      tone: z.enum(TONES).default("reflective"),
      order: z.number().default(0),
      /* uncertainty is stated as uncertainty; sources are required
         for factual claims. See content analysis (aging into harm). */
      sources: z.array(sourceSchema).default([]),
      substances: z.array(z.enum(SUBSTANCES)).default([]),
      riskLevel: z.enum(RISK_LEVELS).default("standard"),
      reviewedBy: z.string().optional(),
      reviewedOn: z.coerce.date().optional(),
      lastReviewed: z.coerce.date().optional(),
      draft: z.boolean().default(false),
    })
    .superRefine((data, ctx) => {
      if (data.riskLevel !== "elevated" || data.draft) return;
      if (!data.reviewedBy || !data.reviewedOn) {
        ctx.addIssue({
          code: "custom",
          message:
            "riskLevel: elevated requires reviewedBy and reviewedOn, or draft: true until reviewed.",
        });
      }
      if (data.sources.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "riskLevel: elevated requires at least one source.",
        });
      }
    }),
});

/* Resources: vetted outside support and reading. lastVerified is
   required — a stale link is a content bug, and the date is shown
   to users so they can judge freshness for themselves.
   url is optional: books are cited, not linked. */
const resources = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/resources" }),
  schema: z.object({
    name: z.string(),
    url: z
      .string()
      .refine((v) => /^https?:\/\/\S+$/.test(v), {
        message: "Resource url must be an absolute http(s) URL",
      })
      .optional(),
    kind: z.enum(["peer-line", "directory", "hub", "reading"]),
    access: z.enum(["free", "paid", "mixed"]),
    description: z.string().max(280),
    caveat: z.string().max(280).optional(),
    /* A resource description that states a fact — an outcome rate, a
       study finding — needs the same sourcing as any other factual
       claim in the app. Without this field the only options were an
       uncited number or dropping the fact, and the first one shipped.
       Most resources are a name, a link, and a description: default []. */
    sources: z.array(sourceSchema).default([]),
    order: z.number().default(0),
    lastVerified: z.coerce.date(),
  }),
});

export const collections = { cards, safety, learn, resources };
