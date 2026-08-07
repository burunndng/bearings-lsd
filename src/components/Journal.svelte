<script lang="ts">
  import { onMount } from "svelte";
  import { ageLabel, dateLabel } from "../lib/dates.ts";
  import { clear, load, save, type Note } from "../lib/storage.ts";

  /* Offsets are a label you choose for yourself, not a scheduled
     prompt. Nothing fires at +6 weeks — there is no notification
     mechanism here, only a note to your later self about when you
     meant to come back. Most integration content stops discussing
     anything past two weeks; +6 weeks is deliberately included
     because that is where the more interesting question starts. */
  const OFFSETS = ["+1 day", "+3 days", "+2 weeks", "+6 weeks"] as const;

  let notes: Note[] = $state([]);
  let body = $state("");
  let revisitLabel: string | null = $state(null);
  let ready = $state(false);
  let storageError = $state(false);
  let oldestFirst = $state(false);

  /* Confirming "delete all" inline rather than with window.confirm():
     the native dialog is OS-styled (breaks the design language on
     iOS in particular), blocks the main thread, and ignores
     data-motion/prefers-reduced-motion. An inline two-step confirm
     stays in the same calm register as everything else here. */
  let confirmingClear = $state(false);

  /* Announced to screen readers after a note is saved, deleted, or all
     notes are cleared. Previously the only feedback was the textarea
     emptying, which is invisible to a screen reader. The live region is
     present from first render — one inserted at the same moment its
     text appears is announced unreliably. Plain confirmation, never
     congratulation: saving a note is not an achievement. */
  let announcement = $state("");

  onMount(async () => {
    try {
      notes = (await load("bearings-notes")) ?? [];
    } catch {
      storageError = true;
    } finally {
      ready = true;
    }
  });

  async function saveNotes(next: Note[]) {
    notes = next;
    try {
      await save("bearings-notes", next);
    } catch {
      storageError = true;
    }
  }

  async function addNote() {
    const text = body.trim();
    if (!text) return;

    await saveNotes([
      {
        id: crypto.randomUUID(),
        body: text,
        createdAt: new Date().toISOString(),
        revisitLabel: revisitLabel ?? undefined,
      },
      ...notes,
    ]);
    body = "";
    revisitLabel = null;
    announcement = "Note saved on this device.";
  }

  async function removeNote(id: string) {
    await saveNotes(notes.filter((note) => note.id !== id));
    announcement = "Note deleted.";
  }

  function requestClearNotes() {
    confirmingClear = true;
  }

  function cancelClearNotes() {
    confirmingClear = false;
  }

  async function clearNotes() {
    /* Irreversible, and these notes are the one thing here that cannot
       be re-derived. Settings.deleteEverything already guards the same
       data with a confirm; leaving this path unguarded made the weaker
       protection the easier one to reach. */
    const had = notes.length;
    confirmingClear = false;
    notes = [];
    try {
      await clear("bearings-notes");
      announcement = `All notes deleted (${had}).`;
    } catch {
      storageError = true;
    }
  }

  const sortedNotes = $derived(
    oldestFirst ? [...notes].reverse() : notes,
  );
</script>

<section class="journal" aria-labelledby="shared-device-heading">
  <div class="shared-device" role="note">
    <h2 id="shared-device-heading">Shared device?</h2>
    <p>
      Notes stay in this browser on this device. Anyone who uses this browser may
      be able to read them. Do not write anything here that needs stronger privacy.
    </p>
  </div>

  <form onsubmit={(event) => { event.preventDefault(); addNote(); }}>
    <label for="note">Write only if it feels useful</label>
    <textarea
      id="note"
      bind:value={body}
      rows="7"
      placeholder="A detail, a question, or nothing at all."
    ></textarea>

    <fieldset class="offsets">
      <legend>
        If you want, mark when you might want to reread this. Nothing is
        scheduled or sent — it is only a label on the note itself.
      </legend>
      <div class="offset-choices">
        {#each OFFSETS as offset}
          <button
            type="button"
            class="offset-opt"
            class:selected={revisitLabel === offset}
            aria-pressed={revisitLabel === offset}
            onclick={() => (revisitLabel = revisitLabel === offset ? null : offset)}
          >
            {offset}
          </button>
        {/each}
      </div>
    </fieldset>

    <div class="actions">
      <button type="submit" class="save" disabled={!body.trim()}>Save on this device</button>
      {#if notes.length && !confirmingClear}
        <button type="button" class="quiet" onclick={requestClearNotes}>Delete all notes</button>
      {/if}
    </div>

    {#if confirmingClear}
      <p class="confirm-row" role="alert">
        Delete all {notes.length} note{notes.length === 1 ? "" : "s"} from this
        browser? This cannot be undone.
        <button type="button" class="quiet danger" onclick={clearNotes}>Yes, delete all</button>
        <button type="button" class="quiet" onclick={cancelClearNotes}>Cancel</button>
      </p>
    {/if}
  </form>

  <p class="saved-note" role="status" aria-live="polite">{announcement}</p>

  {#if storageError}
    <p class="storage-error" role="alert">
      This browser could not save private notes. You can still write elsewhere or try again later.
    </p>
  {/if}

  {#if !ready}
    <p class="status" aria-live="polite">Opening local notes…</p>
  {:else if notes.length}
    <div class="notes-head">
      <p class="notes-count">{notes.length} note{notes.length === 1 ? "" : "s"}</p>
      <button type="button" class="quiet" onclick={() => (oldestFirst = !oldestFirst)}>
        {oldestFirst ? "Show newest first" : "Show oldest first"}
      </button>
    </div>
    <ol class="notes" aria-label="Saved notes">
      {#each sortedNotes as note (note.id)}
        <li>
          <p>{note.body}</p>
          <div class="note-meta">
            <span>
              <time datetime={note.createdAt}>{dateLabel(note.createdAt)}</time>
              <span class="age">· {ageLabel(note.createdAt)}</span>
              {#if note.revisitLabel}
                <span class="revisit-tag">reread {note.revisitLabel}</span>
              {/if}
            </span>
            <button type="button" class="remove" onclick={() => removeNote(note.id)}>
              Delete note
            </button>
          </div>
        </li>
      {/each}
    </ol>
  {:else}
    <p class="status">Nothing saved here yet.</p>
  {/if}
</section>

<style>
  .journal { margin-top: var(--space-4); max-width: var(--measure); }
  .shared-device { border-left: 3px solid var(--gold); background: var(--paper-raised); border-radius: var(--radius); padding: var(--space-3) var(--space-4); margin-bottom: var(--space-4); }
  .shared-device h2 { font-size: var(--size-lg); }
  .shared-device p { color: var(--ink-soft); margin-top: var(--space-1); }
  label { display: block; font-weight: 600; margin-bottom: var(--space-2); }
  textarea { width: 100%; display: block; resize: vertical; border: 1px solid var(--rule); border-radius: var(--radius); padding: var(--space-3); color: var(--ink); background: var(--paper); font: inherit; line-height: var(--leading-body); transition: border-color 0.25s ease, box-shadow 0.25s ease; }
  textarea:focus { border-color: var(--gold); box-shadow: 0 0 16px var(--gold-glow); outline: none; }
  textarea:focus-visible { outline: 3px solid var(--focus-ring); outline-offset: 3px; }
  textarea::placeholder { color: var(--ink-faint); font-style: italic; }
  .actions { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; margin-top: var(--space-2); }
  button { border-radius: var(--radius); padding: var(--space-2) var(--space-3); border: 1px solid var(--rule); background: transparent; color: var(--ink); font-size: var(--size-sm); transition: border-color 0.25s ease, box-shadow 0.25s ease, color 0.25s ease; }
  .save { border-color: var(--gold); color: var(--gold-bright); font-family: var(--font-meta); font-size: var(--size-meta); letter-spacing: 0.22em; text-transform: uppercase; }
  .save:hover:not(:disabled) { box-shadow: 0 0 20px var(--gold-glow); }
  .quiet, .remove { position: relative; text-decoration: underline; text-decoration-color: var(--gold); text-underline-offset: 0.15em; border: 0; padding: 0; min-height: auto; background: none; }
  /* Invisible hit-area expansion to meet the 44px tap target without
     adding visible padding to what is meant to read as inline text. */
  .quiet::before { content: ""; position: absolute; inset: calc(-1 * var(--space-2)) calc(-1 * var(--space-2)); }
  .quiet.danger { color: var(--signal); text-decoration-color: var(--signal); }
  button:disabled { cursor: not-allowed; opacity: 0.55; }
  .confirm-row { margin-top: var(--space-3); padding: var(--space-3); border: 1px solid var(--signal); border-radius: var(--radius); color: var(--ink); display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
  .confirm-row .quiet { margin-top: 0; }
  /* Empty until something is saved, so it occupies no space and adds
     no visual noise — it exists mainly so the announcement has a
     stable live region to land in. */
  .saved-note { margin-top: var(--space-2); color: var(--ink-soft); font-size: var(--size-sm); }
  .saved-note:empty { margin-top: 0; }
  .storage-error { margin-top: var(--space-3); color: var(--signal); font-weight: 600; }
  .status { color: var(--ink-faint); margin-top: var(--space-4); }
  .notes { list-style: none; padding: 0; display: grid; gap: var(--space-3); margin-top: var(--space-4); margin-bottom: var(--space-5); }
  .notes li { padding: var(--space-3) 0; border-top: 1px solid var(--rule); }
  .notes p { white-space: pre-wrap; }
  .note-meta { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); margin-top: var(--space-2); color: var(--ink-faint); font-family: var(--font-meta); font-size: var(--size-meta); letter-spacing: 0.14em; flex-wrap: wrap; }
  .remove { position: relative; min-width: auto; min-height: auto; border: 0; padding: 0; }
  /* Invisible hit-area expansion to meet the 44px tap target without
     adding visible padding to what is meant to read as inline text. */
  .remove::before { content: ""; position: absolute; inset: calc(-1 * var(--space-2)) calc(-1 * var(--space-2)); }
  .offsets { border: 0; padding: 0; margin-top: var(--space-3); }
  .offsets legend { font-weight: 400; color: var(--ink-soft); font-size: var(--size-sm); padding: 0; margin-bottom: var(--space-2); }
  .offset-choices { display: flex; flex-wrap: wrap; gap: var(--space-2); }
  .offset-opt { font-size: var(--size-sm); min-height: var(--tap-min); }
  .offset-opt.selected { border-color: var(--gold); color: var(--gold-bright); }
  .notes-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); flex-wrap: wrap; margin-top: var(--space-5); }
  .notes-count { color: var(--ink-faint); font-family: var(--font-meta); font-size: var(--size-meta); letter-spacing: 0.14em; text-transform: uppercase; }
  .age { color: var(--ink-faint); }
  .revisit-tag { margin-left: var(--space-2); padding: 0.1em 0.5em; border: 1px solid var(--rule); border-radius: var(--radius); text-transform: none; letter-spacing: 0; }
</style>
