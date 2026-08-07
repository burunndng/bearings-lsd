<script lang="ts">
  /* ============================================================
     Bearings — Baseline anchor
     Explicitly NOT a scored instrument. No PHQ-9, GAD-7, readiness
     score, or scored MEQ30 — a score becomes a permission slip,
     and issuing clearance is the gatekeeper posture
     PRODUCT_BOUNDARY.md refuses. This is a private, undated-by-
     default question you write yourself, with a 0-10 slider you
     also define the meaning of, logged as a plain dated list —
     never a chart, never a trend line (a trend line is scoring
     optics dressed up as neutral data).

     Separate storage key (bearings-anchor, registered in
     storage.ts) from bearings-notes: zero migration risk to the
     Journal if this shape ever changes.
     ============================================================ */
  import { onMount } from "svelte";
  import { dateLabel } from "../lib/dates.ts";
  import { clear, load, save, type AnchorData, type Reading } from "../lib/storage.ts";

  let question = $state("");
  let draftQuestion = $state("");
  let value = $state(5);
  let readings: Reading[] = $state([]);
  let ready = $state(false);
  let storageError = $state(false);
  let editingQuestion = $state(false);

  onMount(async () => {
    try {
      const data = await load("bearings-anchor");
      if (data) {
        question = data.question;
        readings = data.readings;
      } else {
        editingQuestion = true;
      }
    } catch {
      storageError = true;
    } finally {
      ready = true;
    }
  });

  async function persist() {
    try {
      await save("bearings-anchor", { question, readings });
    } catch {
      storageError = true;
    }
  }

  function setQuestion() {
    const text = draftQuestion.trim();
    if (!text) return;
    question = text;
    draftQuestion = "";
    editingQuestion = false;
    persist();
  }

  async function addReading() {
    readings = [{ value, at: new Date().toISOString() }, ...readings];
    await persist();
  }

  async function removeReading(at: string) {
    readings = readings.filter((r) => r.at !== at);
    await persist();
  }

  async function clearAnchor() {
    question = "";
    readings = [];
    editingQuestion = true;
    try {
      await clear("bearings-anchor");
    } catch {
      storageError = true;
    }
  }

</script>

<section class="anchor" aria-labelledby="anchor-heading">
  <h2 id="anchor-heading">A private marker</h2>
  <p class="detail">
    Not a score, not a diagnosis, not anything anyone else will see or grade.
    Write one question in your own words — something you might want to check
    in on over time — and mark where you'd put yourself, on a scale you define
    for yourself.
  </p>

  {#if !ready}
    <p class="status" aria-live="polite">Opening…</p>
  {:else if editingQuestion}
    <form onsubmit={(e) => { e.preventDefault(); setQuestion(); }}>
      <label for="anchor-question">Your question, in your own words</label>
      <input
        id="anchor-question"
        type="text"
        bind:value={draftQuestion}
        placeholder="Something only you need to define"
      />
      <button type="submit" class="save" disabled={!draftQuestion.trim()}>
        Use this question
      </button>
    </form>
  {:else}
    <div class="question-row">
      <p class="question">{question}</p>
      <button type="button" class="quiet" onclick={() => (editingQuestion = true)}>
        Change question
      </button>
    </div>

    <div class="reading-row">
      <label for="anchor-value">Where would you put yourself right now (0–10)?</label>
      <input id="anchor-value" type="range" min="0" max="10" step="1" bind:value={value} />
      <span class="value-out">{value}</span>
      <button type="button" class="save" onclick={addReading}>Log this</button>
    </div>

    {#if readings.length}
      <ul class="readings" aria-label="Logged readings">
        {#each readings as r (r.at)}
          <li>
            <span class="value-tag">{r.value}</span>
            <time datetime={r.at}>{dateLabel(r.at)}</time>
            <button type="button" class="remove" onclick={() => removeReading(r.at)}>
              Delete
            </button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="status">Nothing logged yet.</p>
    {/if}

    <button type="button" class="quiet clear" onclick={clearAnchor}>
      Delete this question and every reading
    </button>
  {/if}

  {#if storageError}
    <p class="storage-error" role="alert">
      This browser could not save this. You can still use it, but it won't
      persist between visits.
    </p>
  {/if}
</section>

<style>
  .anchor {
    margin-top: var(--space-6);
    margin-bottom: var(--space-5);
    padding-top: var(--space-4);
    border-top: 1px solid var(--rule);
    max-width: var(--measure);
  }
  .anchor h2 {
    font-size: var(--size-lg);
  }
  .detail {
    color: var(--ink-soft);
    margin-top: var(--space-2);
    margin-bottom: var(--space-3);
  }
  label {
    display: block;
    font-weight: 600;
    margin-bottom: var(--space-2);
  }
  input[type="text"] {
    width: 100%;
    padding: var(--space-3);
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
  }
  input[type="text"]:focus,
  input[type="range"]:focus-visible {
    border-color: var(--gold);
    outline: none;
  }
  button {
    border-radius: var(--radius);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--rule);
    background: transparent;
    color: var(--ink);
    font-size: var(--size-sm);
    min-height: var(--tap-min);
  }
  .save {
    border-color: var(--gold);
    color: var(--gold-bright);
    font-family: var(--font-meta);
    font-size: var(--size-meta);
    letter-spacing: 0.18em;
    text-transform: uppercase;
    margin-top: var(--space-3);
  }
  .save:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
  .quiet,
  .remove {
    position: relative;
    text-decoration: underline;
    text-decoration-color: var(--gold);
    text-underline-offset: 0.15em;
    border: 0;
    padding: 0;
    min-height: auto;
    background: none;
  }
  /* Invisible hit-area expansion to meet the 44px tap target without
     adding visible padding to what is meant to read as inline text. */
  .quiet::before,
  .remove::before {
    content: "";
    position: absolute;
    inset: calc(-1 * var(--space-2)) calc(-1 * var(--space-2));
  }
  .clear {
    display: block;
    margin-top: var(--space-4);
    color: var(--signal);
    text-decoration-color: var(--signal);
  }
  .question-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
    flex-wrap: wrap;
  }
  .question {
    font-family: var(--font-display);
    font-size: var(--size-lg);
    font-weight: 500;
  }
  .reading-row {
    margin-top: var(--space-4);
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;
  }
  .reading-row label {
    flex-basis: 100%;
  }
  .value-out {
    font-family: var(--font-meta);
    color: var(--gold-bright);
    min-width: 2ch;
  }
  .readings {
    list-style: none;
    padding: 0;
    display: grid;
    gap: var(--space-2);
    margin-top: var(--space-4);
  }
  .readings li {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) 0;
    border-top: 1px solid var(--rule);
    font-family: var(--font-meta);
    font-size: var(--size-meta);
    letter-spacing: 0.1em;
    color: var(--ink-faint);
  }
  .value-tag {
    color: var(--gold-bright);
    font-weight: 600;
  }
  .status {
    color: var(--ink-faint);
    margin-top: var(--space-3);
  }
  .storage-error {
    margin-top: var(--space-3);
    color: var(--signal);
    font-weight: 600;
  }
</style>
