<script lang="ts">
  /* ============================================================
     Bearings — CardNote
     Replaces the placeholder textarea on card/[slug].astro that
     claimed "Stays on this device only" while saving nothing.
     Writes into the SAME bearings-notes store the Journal reads,
     with an optional cardId — additive, so notes written before
     this component existed still parse (Note.cardId is optional).

     Skip is always visible and always works: this is optional,
     never a gate, and there is no requirement to write anything.
     ============================================================ */
  import { onMount } from "svelte";
  import { load, save, type Note } from "../lib/storage.ts";

  interface Props {
    cardId: string;
    shelfPath: string;
    shelfLabel: string;
  }
  const { cardId, shelfPath, shelfLabel }: Props = $props();

  let body = $state("");
  let saved = $state(false);
  let storageError = $state(false);
  let ready = $state(false);

  /* Announced to screen readers on save. The button label flipping to
     "Saved" is a visual-only signal; this is the same information in a
     live region that is present from first render (a region inserted
     at the same moment its text appears is announced unreliably).
     Plain confirmation, not congratulation — nothing here is an
     achievement. */
  let announcement = $state("");

  /* The note this card already had, if any. Held so save() can EDIT it
     in place rather than replace it: the original id and createdAt are
     the note's identity and its age. Rereading your own words weeks
     later is the point of this store (see Journal's ageLabel) — a save
     that resets createdAt to today silently destroys that. */
  let existing: Note | null = $state(null);

  onMount(async () => {
    try {
      const notes = (await load("bearings-notes")) ?? [];
      const found = notes.find((n) => n.cardId === cardId) ?? null;
      existing = found;
      if (found) body = found.body;
    } catch {
      storageError = true;
    } finally {
      ready = true;
    }
  });

  async function persistNote() {
    const text = body.trim();
    try {
      const notes = (await load("bearings-notes")) ?? [];
      const withoutThisCard = notes.filter((n) => n.cardId !== cardId);

      if (!text) {
        /* Clearing the textarea and saving removes the note. Explicit,
           user-initiated, and the only path here that deletes. */
        await save("bearings-notes", withoutThisCard);
        existing = null;
        saved = true;
        announcement = "Note removed from this device.";
        return;
      }

      const note: Note = existing
        ? { ...existing, body: text }
        : {
            id: crypto.randomUUID(),
            body: text,
            createdAt: new Date().toISOString(),
            cardId,
          };

      const isEdit = Boolean(existing);
      await save("bearings-notes", [note, ...withoutThisCard]);
      existing = note;
      saved = true;
      announcement = isEdit
        ? "Note updated on this device."
        : "Note saved on this device.";
    } catch {
      storageError = true;
    }
  }
</script>

<aside class="prompt">
  <label for="reflect">
    If you want to, you may note something here. There is no need to.
  </label>
  <textarea
    id="reflect"
    rows="4"
    bind:value={body}
    oninput={() => { saved = false; announcement = ""; }}
    placeholder="Optional. Stays on this device only."
  ></textarea>
  <div class="row">
    <button type="button" class="save" disabled={!ready} onclick={persistNote}>
      {saved ? "Saved" : "Save on this device"}
    </button>
    <p class="skip">
      You can skip this entirely. <a href={shelfPath}>Back to {shelfLabel}</a>.
    </p>
  </div>
  <p class="saved-note" role="status" aria-live="polite">{announcement}</p>
  {#if storageError}
    <p class="storage-error" role="alert">
      This browser could not save this note. You can still write elsewhere.
    </p>
  {/if}
</aside>

<style>
  .prompt {
    margin-top: var(--space-6);
    padding: var(--space-4);
    border: 1px dashed var(--rule);
    border-radius: var(--radius);
  }
  .prompt label {
    display: block;
    color: var(--ink-soft);
    margin-bottom: var(--space-2);
  }
  textarea {
    width: 100%;
    font-family: var(--font-body);
    font-size: var(--size-base);
    padding: var(--space-3);
    background: var(--paper);
    color: var(--ink);
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    resize: vertical;
  }
  textarea:focus {
    border-color: var(--gold);
    box-shadow: 0 0 16px var(--gold-glow);
    outline: none;
  }
  textarea:focus-visible {
    outline: 3px solid var(--focus-ring);
    outline-offset: 3px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;
    margin-top: var(--space-3);
  }
  .save {
    min-height: var(--tap-min);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--gold);
    border-radius: var(--radius);
    background: transparent;
    color: var(--gold-bright);
    font-family: var(--font-meta);
    font-size: var(--size-meta);
    letter-spacing: 0.18em;
    text-transform: uppercase;
    cursor: pointer;
  }
  .save:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
  .skip {
    margin: 0;
    font-size: var(--size-sm);
    color: var(--ink-faint);
  }
  /* Empty until a save happens: no reserved space, no layout shift,
     and nothing that reads as a reward for having written. */
  .saved-note {
    margin: 0;
    font-size: var(--size-sm);
    color: var(--ink-faint);
  }
  .saved-note:empty {
    display: none;
  }
  .storage-error {
    margin-top: var(--space-2);
    color: var(--signal);
    font-weight: 600;
  }
</style>
