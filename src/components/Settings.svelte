<script lang="ts">
  import { onMount } from "svelte";
  import { ageLabel, dateLabel } from "../lib/dates.ts";
  import {
    clear,
    load,
    save,
    wipe,
    type AnchorData,
    type LedgerEntry,
    type Note,
    type Session,
  } from "../lib/storage.ts";
  import { INTERVIEW_PROMPTS } from "../lib/sessions.ts";

  interface Props {
    /** card id -> title, resolved at build time in settings.astro.
        A note stores only cardId, so this is what lets the export
        name a card rather than a slug. */
    cardTitles?: Record<string, string>;
  }
  const { cardTitles = {} }: Props = $props();

  let theme = $state<"system" | "light" | "dark">("system");
  let reduceMotion = $state(false);
  let ready = $state(false);
  let message = $state("");

  onMount(async () => {
    try {
      const savedTheme = await load("bearings-theme");
      theme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : "system";
      reduceMotion = (await load("bearings-motion")) === "reduce";
    } catch {
      message = "This browser is not allowing settings to be saved.";
    } finally {
      ready = true;
    }
  });

  async function setTheme(next: "system" | "light" | "dark") {
    theme = next;
    try {
      if (next === "system") {
        await clear("bearings-theme");
        document.documentElement.removeAttribute("data-theme");
      } else {
        await save("bearings-theme", next);
        document.documentElement.setAttribute("data-theme", next);
      }
    } catch {
      message = "This browser is not allowing settings to be saved.";
    }
  }

  async function setMotion() {
    try {
      if (reduceMotion) {
        await save("bearings-motion", "reduce");
        document.documentElement.setAttribute("data-motion", "reduce");
      } else {
        await clear("bearings-motion");
        document.documentElement.removeAttribute("data-motion");
      }
    } catch {
      message = "This browser is not allowing settings to be saved.";
    }
  }

  /* ------------------------------------------------------------
     Export

     Why this exists: notes are local-only by design, which means a
     cleared browser, an evicted IndexedDB store, or a mistaken tap on
     "Delete everything" loses the one thing here that cannot be
     re-derived. Local-first is only a promise worth making if a person
     can also keep their own copy.

     Plain text, not JSON: the value in this store is rereading your own
     words months later, and that should not require a parser or this
     app still existing. The file is written to be readable on its own
     in ten years.

     Nothing here touches the network — Blob + createObjectURL is a
     same-document operation, and the CSP sets connect-src 'self'. The
     file is handed to the browser's own download mechanism, which is
     the explicit, user-initiated action PRODUCT_BOUNDARY.md requires
     before anything leaves the device.
     ------------------------------------------------------------ */

  let exporting = $state(false);

  function cardLabel(cardId: string): string {
    return cardTitles[cardId] ?? cardId;
  }

  function promptLabel(promptId: string): string | null {
    return INTERVIEW_PROMPTS.find((p) => p.id === promptId)?.text ?? null;
  }

  function buildExport(
    notes: Note[],
    anchor: AnchorData | undefined,
    sessions: Session[],
    ledger: LedgerEntry[],
  ): string {
    const out: string[] = [];

    out.push("BEARINGS — a copy of your notes");
    out.push(`Written ${dateLabel(new Date().toISOString())}`);
    out.push("");
    out.push(
      "This file came from your own browser. Bearings did not send it",
      "anywhere. Once it is saved, it is an ordinary unencrypted text",
      "file: anyone who can read the device it sits on can read it. You",
      "may want to consider where you keep it.",
    );
    out.push("");
    out.push("=".repeat(64));
    out.push("");

    /* Oldest first. The Journal defaults to newest-first because that
       is what you want when adding to it; a document you sit down to
       read wants the opposite. */
    const ordered = [...notes].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    out.push(`NOTES (${ordered.length})`);
    out.push("");

    if (ordered.length === 0) {
      out.push("  Nothing was saved in notes on this device.");
      out.push("");
    }

    for (const note of ordered) {
      out.push("-".repeat(64));
      out.push(`${dateLabel(note.createdAt)}  ·  ${ageLabel(note.createdAt)}`);
      if (note.cardId) out.push(`Written from: ${cardLabel(note.cardId)}`);
      if (note.revisitLabel) {
        out.push(`You marked this to reread: ${note.revisitLabel}`);
      }
      /* Notes written through the session flow answer a specific
         question. Exporting the answer without the question would
         leave a stranger's reply to nothing in a file meant to be
         readable on its own years later. */
      if (note.promptId) {
        const label = promptLabel(note.promptId);
        if (label) out.push(`In answer to: ${label}`);
      }
      if (note.tags?.length) out.push(`Your tags: ${note.tags.join(", ")}`);
      out.push("");
      out.push(note.body);
      out.push("");
    }

    /* Held questions and the cooling-off ledger (the /sessions page).
       Both are exported even though most people never open that page:
       an export that silently omits a section is the same quiet data
       loss this file exists to prevent. */
    if (sessions.length > 0) {
      out.push("=".repeat(64));
      out.push("");
      out.push(`QUESTIONS YOU HELD (${sessions.length})`);
      out.push("");
      const orderedSessions = [...sessions].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      for (const session of orderedSessions) {
        out.push(`  ${dateLabel(session.createdAt)}`);
        out.push(`  ${session.question}`);
        out.push("");
      }
    }

    if (ledger.length > 0) {
      out.push("=".repeat(64));
      out.push("");
      out.push(`DECISIONS YOU WROTE DOWN (${ledger.length})`);
      out.push("");
      out.push(
        "The number is the certainty you gave it at the time, on your own",
        "scale. It is not a score and it was never compared to anything.",
      );
      out.push("");
      const orderedLedger = [...ledger].sort(
        (a, b) =>
          new Date(a.decidedAt).getTime() - new Date(b.decidedAt).getTime(),
      );
      for (const entry of orderedLedger) {
        out.push("-".repeat(64));
        out.push(
          `${dateLabel(entry.decidedAt)}  ·  felt ${entry.certainty} of 10`,
        );
        out.push("");
        out.push(entry.decision);
        out.push("");
        if (entry.outcome) {
          const said =
            entry.outcome === "holds"
              ? "Still held"
              : entry.outcome === "dropped"
                ? "Let go"
                : "Changed shape";
          out.push(
            entry.reviewedAt
              ? `${said} when you read it again on ${dateLabel(entry.reviewedAt)}.`
              : `${said} when you read it again.`,
          );
          if (entry.refinement) {
            out.push("");
            out.push(entry.refinement);
          }
        } else {
          out.push(`You chose to read this again on ${dateLabel(entry.reviewAt)}.`);
        }
        out.push("");
      }
    }

    if (anchor && anchor.question) {
      out.push("=".repeat(64));
      out.push("");
      out.push("A PRIVATE MARKER");
      out.push("");
      out.push(`Your question: ${anchor.question}`);
      out.push("");
      out.push(
        "The scale below is one you defined for yourself. It is not a",
        "score and it does not mean anything outside your own reading of it.",
      );
      out.push("");
      const readings = [...anchor.readings].sort(
        (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
      );
      if (readings.length === 0) {
        out.push("  Nothing logged.");
      } else {
        for (const r of readings) {
          out.push(`  ${String(r.value).padStart(2)}  ${dateLabel(r.at)}`);
        }
      }
      out.push("");
    }

    out.push("=".repeat(64));
    out.push("");
    out.push(
      "Deleting this file does not delete anything in Bearings, and",
      "deleting your notes in Bearings does not delete this file.",
    );
    out.push("");

    return out.join("\n");
  }

  async function downloadCopy() {
    exporting = true;
    message = "";
    try {
      const notes = (await load("bearings-notes")) ?? [];
      const anchor = await load("bearings-anchor");
      const sessions = (await load("bearings-sessions")) ?? [];
      const ledger = (await load("bearings-ledger")) ?? [];

      /* Nothing to write is not an error, and an empty file would be a
         worse answer than saying so plainly. Every store is checked:
         someone who only ever wrote a held question and no notes still
         has something worth copying. */
      if (
        notes.length === 0 &&
        !anchor?.question &&
        sessions.length === 0 &&
        ledger.length === 0
      ) {
        message =
          "There is nothing saved on this device yet, so there is nothing to copy.";
        return;
      }

      const text = buildExport(notes, anchor, sessions, ledger);
      const stamp = new Date().toISOString().slice(0, 10);
      const url = URL.createObjectURL(
        new Blob([text], { type: "text/plain;charset=utf-8" }),
      );

      const a = document.createElement("a");
      a.href = url;
      a.download = `bearings-copy-${stamp}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      /* Revoked on the next turn: revoking synchronously can cancel the
         download in some browsers before it has read the blob. */
      setTimeout(() => URL.revokeObjectURL(url), 0);

      const parts: string[] = [];
      if (notes.length)
        parts.push(`${notes.length} note${notes.length === 1 ? "" : "s"}`);
      if (sessions.length)
        parts.push(
          `${sessions.length} question${sessions.length === 1 ? "" : "s"}`,
        );
      if (ledger.length)
        parts.push(
          `${ledger.length} decision${ledger.length === 1 ? "" : "s"}`,
        );
      const summary = parts.length ? parts.join(", ") : "your entries";
      message = `A copy of ${summary} was handed to this browser to save.`;
    } catch {
      message =
        "This browser could not produce a copy. Nothing was changed.";
    } finally {
      exporting = false;
    }
  }

  async function deleteEverything() {
    if (!window.confirm("Delete all notes and local Bearings settings from this browser? This cannot be undone.")) return;
    try {
      // wipe() clears every registered key in both stores from one
      // place (src/lib/storage.ts). A key not in that registry cannot
      // be written in the first place, so this cannot silently miss one.
      await wipe();
      document.documentElement.removeAttribute("data-theme");
      document.documentElement.removeAttribute("data-motion");
      theme = "system";
      reduceMotion = false;
      message = "Local notes and Bearings settings were deleted from this browser.";
    } catch {
      message = "Some local data could not be deleted. Try again or clear this site’s data in your browser settings.";
    }
  }
</script>

<section class="settings" aria-label="Settings">
  {#if !ready}
    <p>Loading local settings…</p>
  {:else}
    <fieldset>
      <legend>Appearance</legend>
      <p class="detail">Choose a look for this browser. System setting is the default.</p>
      <div class="choices">
        {#each ["system", "light", "dark"] as option}
          <label>
            <input type="radio" name="theme" value={option} checked={theme === option} onchange={() => setTheme(option as "system" | "light" | "dark")} />
            {option[0].toUpperCase() + option.slice(1)}
          </label>
        {/each}
      </div>
    </fieldset>

    <fieldset>
      <legend>Motion</legend>
      <label class="toggle">
        <input type="checkbox" bind:checked={reduceMotion} onchange={setMotion} />
        <span>Reduce all motion</span>
      </label>
      <p class="detail">Stops every animation, including the drifting background. Your system's reduced-motion setting is always respected either way.</p>
    </fieldset>

    <fieldset>
      <legend>Reminders</legend>
      <p class="detail">
        Not built yet in this version. When they exist, they will be off by
        default and will never be used to pressure you to interpret or
        revisit an experience.
      </p>
    </fieldset>

    <section class="data" aria-labelledby="data-heading">
      <h2 id="data-heading">Data on this device</h2>
      <p>Everything saved here — notes, held questions, decisions — stays in this browser unless you delete it. Bearings does not send it to a server.</p>

      <div class="copy-block">
        <button type="button" class="copy" disabled={exporting} onclick={downloadCopy}>
          {exporting ? "Preparing…" : "Download a copy of what is saved here"}
        </button>
        <p class="detail">
          A plain text file, saved by this browser wherever it normally saves
          files. Because notes live only in this browser, clearing its data —
          or losing the device — loses them. A copy is the only way to keep
          them elsewhere.
        </p>
        <p class="detail caution">
          Once saved, that file is ordinary unencrypted text, outside this
          browser and outside anything Bearings can protect. Anyone who can
          read the device it sits on can read it. On a shared or work computer
          you may want to consider whether that is what you want.
        </p>
      </div>

      <button type="button" class="delete" onclick={deleteEverything}>Delete everything on this device</button>
    </section>
  {/if}

  <p class="message" role="status" aria-live="polite">{message}</p>
</section>

<style>
  .settings { max-width: var(--measure); margin-top: var(--space-4); margin-bottom: var(--space-5); }
  fieldset, .data { border: 0; border-top: 1px solid var(--rule); padding: var(--space-4) 0; }
  legend, .data h2 { font-family: var(--font-display); font-size: var(--size-lg); font-weight: 500; }
  .detail, .data p { color: var(--ink-soft); margin-top: var(--space-1); }
  .choices { display: flex; flex-wrap: wrap; gap: var(--space-3); margin-top: var(--space-3); }
  .choices label, .toggle { display: flex; align-items: center; gap: var(--space-2); font-family: var(--font-ui); min-height: var(--tap-min); }
  input { accent-color: var(--gold); width: 1.1rem; height: 1.1rem; }
  .toggle { margin-top: var(--space-3); }
  .delete { margin-top: var(--space-3); padding: var(--space-2) var(--space-3); min-height: var(--tap-min); border: 1px solid var(--signal); border-radius: var(--radius); background: transparent; color: var(--signal); font: inherit; font-size: var(--size-sm); font-weight: 600; }
  /* Separated from the delete button by a rule: these are the two
     irreversible-feeling actions on this page and they do opposite
     things. Keeping a copy should not sit flush against erasing one. */
  .copy-block { margin-top: var(--space-4); padding-bottom: var(--space-4); border-bottom: 1px solid var(--rule); }
  .copy { padding: var(--space-2) var(--space-3); min-height: var(--tap-min); border: 1px solid var(--gold); border-radius: var(--radius); background: transparent; color: var(--gold-bright); font-family: var(--font-meta); font-size: var(--size-meta); letter-spacing: 0.18em; text-transform: uppercase; }
  .copy:disabled { cursor: not-allowed; opacity: 0.55; }
  .copy-block .detail { margin-top: var(--space-2); }
  /* Stated, not alarmed: a quiet left rule rather than warning colour.
     The person is not doing something wrong by keeping a copy. */
  .caution { border-left: 2px solid var(--rule); padding-left: var(--space-3); }
  .message { margin-top: var(--space-3); color: var(--ink-soft); }
  .message:empty { margin-top: 0; }
</style>
