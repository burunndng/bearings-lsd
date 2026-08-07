<script lang="ts">
  /* ============================================================
     Bearings — Cooling-off ledger

     Why this exists: the days after an experience are a common time
     to feel certain about a large decision — quit, leave, confess,
     move — and that certainty is not evidence either way. The
     research on this is thin and mostly self-reported, so this
     component makes no claim about what should happen. It does one
     narrow, honest thing: it records what you decided, how certain
     you were, and the date you yourself chose to look again. Then it
     shows you your own earlier certainty next to your later reading
     of it.

     PULL-ONLY, and this is a real limitation stated in the UI rather
     than hidden by it: nothing here schedules a notification. An
     entry waits until this page is opened. A ledger that pushed
     reminders would be the app deciding when someone should revisit
     an experience, which PRODUCT_BOUNDARY.md refuses.

     It does not grade certainty, does not advise delay, and does not
     treat "dropped" as the correct answer. A decision that still
     holds after two weeks is not a failure of the ledger.
     ============================================================ */
  import { onMount } from "svelte";
  import { dateLabel } from "../lib/dates.ts";
  import { load, save, type LedgerEntry } from "../lib/storage.ts";
  import { dueForReview } from "../lib/sessions.ts";

  /** Default gap before review. Two weeks is a starting point, not a
      recommendation — the date field is editable and nothing treats a
      shorter one as a mistake. */
  const DEFAULT_REVIEW_DAYS = 14;

  const OUTCOMES: { id: NonNullable<LedgerEntry["outcome"]>; label: string }[] =
    [
      { id: "holds", label: "Still holds" },
      { id: "dropped", label: "Let it go" },
      { id: "refined", label: "Changed shape" },
    ];

  let entries: LedgerEntry[] = $state([]);
  let ready = $state(false);
  let storageError = $state(false);
  let announcement = $state("");

  let formOpen = $state(false);
  let decisionDraft = $state("");
  let certaintyDraft = $state(5);
  let reviewDraft = $state("");

  /** Which entry is mid-refinement, and the text for it. Kept out of
      the entry itself so an abandoned edit never persists. */
  let refiningId: string | null = $state(null);
  let refinementDraft = $state("");

  onMount(async () => {
    try {
      entries = (await load("bearings-ledger")) ?? [];
    } catch {
      storageError = true;
    } finally {
      ready = true;
    }
  });

  /* Local date, not UTC: `toISOString().slice(0,10)` shifts the date
     by one for anyone west of UTC in the evening, which would quietly
     set a review date a day off from the one shown. */
  function dateInputValue(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function defaultReviewDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + DEFAULT_REVIEW_DAYS);
    return dateInputValue(d);
  }

  /* Midday rather than midnight so a review date is "due" during the
     day a person picked, not from its first second in some other
     timezone. */
  function toIso(dateValue: string): string {
    const [y, m, d] = dateValue.split("-").map(Number);
    return new Date(y, m - 1, d, 12, 0, 0).toISOString();
  }

  const due = $derived(dueForReview(entries));
  const waiting = $derived(
    entries
      .filter((e) => !e.outcome && !due.some((d) => d.id === e.id))
      .sort((a, b) => +new Date(a.reviewAt) - +new Date(b.reviewAt)),
  );
  const resolved = $derived(
    entries
      .filter((e) => e.outcome)
      .sort(
        (a, b) =>
          +new Date(b.reviewedAt ?? b.decidedAt) -
          +new Date(a.reviewedAt ?? a.decidedAt),
      ),
  );

  async function persist(next: LedgerEntry[]) {
    entries = next;
    try {
      await save("bearings-ledger", next);
    } catch {
      storageError = true;
    }
  }

  function openForm() {
    decisionDraft = "";
    certaintyDraft = 5;
    reviewDraft = defaultReviewDate();
    formOpen = true;
  }

  async function saveEntry() {
    const decision = decisionDraft.trim();
    if (!decision || !reviewDraft) return;
    const entry: LedgerEntry = {
      id: crypto.randomUUID(),
      decision,
      certainty: certaintyDraft,
      decidedAt: new Date().toISOString(),
      reviewAt: toIso(reviewDraft),
    };
    await persist([entry, ...entries]);
    formOpen = false;
    announcement =
      "Written down. It will be here when you open this page after that date — nothing will notify you.";
  }

  async function resolve(
    entry: LedgerEntry,
    outcome: NonNullable<LedgerEntry["outcome"]>,
  ) {
    /* "Changed shape" is the only outcome that needs more words, so it
       opens a field instead of resolving immediately. */
    if (outcome === "refined" && refiningId !== entry.id) {
      refiningId = entry.id;
      refinementDraft = "";
      return;
    }
    const next = entries.map((e) =>
      e.id === entry.id
        ? {
            ...e,
            outcome,
            reviewedAt: new Date().toISOString(),
            ...(outcome === "refined" && refinementDraft.trim()
              ? { refinement: refinementDraft.trim() }
              : {}),
          }
        : e,
    );
    refiningId = null;
    refinementDraft = "";
    await persist(next);
    announcement = "Marked.";
  }

  function cancelRefine() {
    refiningId = null;
    refinementDraft = "";
  }
</script>

<section class="ledger" aria-labelledby="ledger-heading">
  <h2 id="ledger-heading">Decisions you want to look at again</h2>
  <p class="detail">
    Optional. If you decided something that felt clear and large, you can put
    it here with a date to reread it. This does not advise waiting and it does
    not treat a decision that still holds as a mistake — it only keeps the
    earlier version of your own certainty so you can see it next to the later
    one.
  </p>

  {#if !ready}
    <p class="status" aria-live="polite">Opening…</p>
  {:else}
    {#if formOpen}
      <div class="form">
        <label for="decision">What you decided</label>
        <textarea
          id="decision"
          bind:value={decisionDraft}
          rows="3"
          placeholder="In your own words"
        ></textarea>

        <label for="certainty">
          How certain it feels right now: {certaintyDraft} of 10
        </label>
        <input
          id="certainty"
          type="range"
          min="1"
          max="10"
          step="1"
          bind:value={certaintyDraft}
        />
        <p class="detail small">
          Your own scale. It is not a score and nothing compares it to anyone
          else's.
        </p>

        <label for="review-at">Look at this again on</label>
        <input id="review-at" type="date" bind:value={reviewDraft} />
        <p class="detail small">
          Two weeks is only the prefilled date. Change it to whatever you
          actually want.
        </p>

        <div class="row">
          <button
            type="button"
            class="save"
            disabled={!decisionDraft.trim() || !reviewDraft}
            onclick={saveEntry}
          >
            Write it down
          </button>
          <button type="button" class="quiet" onclick={() => (formOpen = false)}>
            Cancel
          </button>
        </div>
      </div>
    {:else}
      <button type="button" class="save" onclick={openForm}>
        Note a decision
      </button>
    {/if}

    {#if due.length}
      <div class="group">
        <p class="kicker">Ready when you are ({due.length})</p>
        <ul>
          {#each due as entry (entry.id)}
            <li>
              <p class="decision">{entry.decision}</p>
              <p class="detail small">
                Written {dateLabel(entry.decidedAt)} · felt {entry.certainty} of
                10 then
              </p>
              <p class="detail small">Reading it back now, is it the same?</p>
              {#if refiningId === entry.id}
                <label for={`refine-${entry.id}`}>What it is now</label>
                <textarea
                  id={`refine-${entry.id}`}
                  bind:value={refinementDraft}
                  rows="3"
                  placeholder="The version you would write today"
                ></textarea>
                <div class="row">
                  <button
                    type="button"
                    class="save small"
                    onclick={() => resolve(entry, "refined")}
                  >
                    Save that
                  </button>
                  <button type="button" class="quiet" onclick={cancelRefine}>
                    Cancel
                  </button>
                </div>
              {:else}
                <div class="row">
                  {#each OUTCOMES as outcome}
                    <button
                      type="button"
                      class="save small"
                      onclick={() => resolve(entry, outcome.id)}
                    >
                      {outcome.label}
                    </button>
                  {/each}
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if waiting.length}
      <div class="group">
        <p class="kicker">Waiting ({waiting.length})</p>
        <ul>
          {#each waiting as entry (entry.id)}
            <li>
              <p class="decision">{entry.decision}</p>
              <p class="detail small">
                Felt {entry.certainty} of 10 on {dateLabel(entry.decidedAt)} ·
                you chose to look again on {dateLabel(entry.reviewAt)}
              </p>
            </li>
          {/each}
        </ul>
        <p class="detail small">
          Nothing will remind you. These appear here when you next open this
          page after the date you picked.
        </p>
      </div>
    {/if}

    {#if resolved.length}
      <div class="group">
        <p class="kicker">Looked at again ({resolved.length})</p>
        <ul>
          {#each resolved as entry (entry.id)}
            <li>
              <p class="decision">{entry.decision}</p>
              <p class="detail small">
                {entry.certainty} of 10 on {dateLabel(entry.decidedAt)} ·
                {#if entry.outcome === "holds"}still held{:else if entry.outcome === "dropped"}let go{:else}changed shape{/if}
                {#if entry.reviewedAt}
                  on {dateLabel(entry.reviewedAt)}
                {/if}
              </p>
              {#if entry.refinement}
                <p class="refinement">{entry.refinement}</p>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  {/if}

  <p class="saved-note" role="status" aria-live="polite">{announcement}</p>
  {#if storageError}
    <p class="storage-error" role="alert">
      This browser could not save this. You can still use it, but it won't
      persist between visits.
    </p>
  {/if}
</section>

<style>
  .ledger {
    margin-top: var(--space-6);
    margin-bottom: var(--space-6);
    padding-top: var(--space-4);
    border-top: 1px solid var(--rule);
    max-width: var(--measure);
  }
  .ledger h2 {
    font-size: var(--size-lg);
  }
  .detail {
    color: var(--ink-soft);
    margin-top: var(--space-2);
  }
  .detail.small {
    font-size: var(--size-sm);
    color: var(--ink-faint);
    margin-top: var(--space-1);
  }
  label {
    display: block;
    font-weight: 600;
    margin-top: var(--space-3);
    margin-bottom: var(--space-2);
  }
  textarea,
  input[type="date"] {
    width: 100%;
    font: inherit;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    background: var(--paper);
    color: var(--ink);
  }
  input[type="date"] {
    max-width: 14rem;
  }
  textarea:focus,
  input[type="date"]:focus {
    border-color: var(--gold);
    outline: none;
  }
  input[type="range"] {
    width: 100%;
    max-width: 22rem;
    accent-color: var(--gold);
  }
  .row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;
    margin-top: var(--space-2);
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
    letter-spacing: 0.16em;
    text-transform: uppercase;
    margin-top: var(--space-3);
  }
  .save.small {
    margin-top: 0;
    padding: var(--space-1) var(--space-2);
  }
  .save:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
  .quiet {
    position: relative;
    text-decoration: underline;
    text-decoration-color: var(--gold);
    text-underline-offset: 0.15em;
    border: 0;
    padding: 0;
    min-height: auto;
    background: none;
    margin-top: var(--space-3);
  }
  /* Invisible hit-area expansion to meet the 44px tap target without
     adding visible padding to what is meant to read as inline text. */
  .quiet::before {
    content: "";
    position: absolute;
    inset: calc(-1 * var(--space-2)) calc(-1 * var(--space-2));
  }
  .form,
  .group {
    margin-top: var(--space-4);
  }
  .kicker {
    font-family: var(--font-meta);
    font-size: var(--size-meta);
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--ink-faint);
  }
  ul {
    list-style: none;
    padding: 0;
    display: grid;
    gap: var(--space-4);
    margin-top: var(--space-3);
  }
  li {
    padding-top: var(--space-3);
    border-top: 1px solid var(--rule);
  }
  .decision {
    font-family: var(--font-display);
    font-size: var(--size-base);
    white-space: pre-wrap;
  }
  .refinement {
    margin-top: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: var(--paper-raised);
    border-radius: var(--radius);
    color: var(--ink-soft);
    white-space: pre-wrap;
  }
  .status {
    color: var(--ink-faint);
    margin-top: var(--space-3);
  }
  .saved-note {
    margin-top: var(--space-2);
    color: var(--ink-soft);
    font-size: var(--size-sm);
  }
  .saved-note:empty {
    margin-top: 0;
  }
  .storage-error {
    margin-top: var(--space-3);
    color: var(--signal);
    font-weight: 600;
  }
</style>
