# Voice Guide

Calm, adult, specific, unpretentious, never patronizing. The floor is the
forbidden-phrase list (enforced in CI). This guide is the ceiling: concrete
before/after examples, not just adjectives. One designated editor holds the
voice.

## Principles

- **Condition-action, not command.** Give the person the information and let
  them decide.
- **Specific over warm-vague.** "Who is sober and able to help?" beats
  "hold space for each other."
- **Name uncertainty.** "Early evidence suggests" not "studies prove."
- **No promises.** Preparation can help; it cannot guarantee an easy or safe
  experience. Never imply otherwise.
- **Ambiguity is a real position, not a dead end.** Validate it with genuine
  presence — a sentence or two — not just an affirming label.

## Before / after examples

| Avoid | Use |
|---|---|
| "Begin your healing journey." | "A place to get your bearings." |
| "Trust the medicine." | "You may want to consider who is around you and what has been agreed." |
| "Integrate your downloads." | "If any part of this matters to you later, you can come back to it." |
| "Heal your nervous system." | "Rest, warmth, and simple food can help in the hours after." |
| "Set your sacred intention." | "If you want to, you might name what you are hoping for. There is no need to." |
| "Transform into your highest self." | "Nobody owes the experience a breakthrough." |
| "You need to prepare properly." | "You may want to consider what would make this feel less rushed." |
| "I had a good time. That is enough." (bare) | "I had a good time. That is enough. Not every experience needs to become a lesson or a turning point. You are allowed to have just been there." |

## Forbidden phrases

Two tiers. Both are load-bearing; only the first is mechanically enforced.

**Checked by `scripts/lint-phrases.js` (CI fails on a match):**

healing journey, trust the medicine, integrate your download(s), your
downloads, heal your nervous system, sacred container, highest self, raise
your vibration, plant teacher, the medicine will, transform your life,
begin your healing, begin your journey.

A line that legitimately needs to quote one of these — to criticize it,
the way `learn/why-this-app-stays-secular` does — can end that line with
`voice:allow` to exempt it. The marker is visible in source, so exemptions
are never silent.

**Human-review-only (not regex-able without false positives):**

- "the medicine" as a substance-reference (ambiguous against legitimate
  uses of "medicine" elsewhere, e.g. clinical contexts)
- "set an intention" used as an imperative command (the noun "intention"
  is fine and used elsewhere in this guide's own approved examples)
- bare "vibration(s)" outside the "raise your vibration" construction
- "journey" as a noun standing in for the experience itself (distinct
  from legitimate uses, e.g. a citation title containing the word)

These four require an editor's eye at content review, not a script. They
are listed here so they are not silently unenforced by omission — see
PRODUCT_BOUNDARY.md's content-review checklist.

## Also lint

aria-labels and placeholder attributes — it is easy to write "Begin your
reflection" in an aria-label and miss it in a copy review.
