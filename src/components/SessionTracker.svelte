<script lang="ts">
  /* ============================================================
     Bearings — Session tracker
     The spine of the depth track. Not a program: a session is
     never explicitly "started" or "ended" by the user — it is
     inferred from note timestamps (see lib/sessions.ts), because
     asking someone to press "begin" before a psychedelic experience
     and "end" after one asks for an administrative act neither
     moment has room for.

     What this component actually does, in order:
     1. Question sharpener — a deterministic, ungraded set of
        checks on a draft question, run BEFORE a session (own
        words in, own words out, never assessed).
     2. Two-stage capture during the inferred active window:
        - raw (first ~18h): three minimal fields, nothing more
        - interview (day 1–4): four fixed questions
     3. Past sessions, plainly listed, oldest question visible so
        "last time" is not a separate feature to build.

     Interpretation is refused throughout: this component asks and
     records. It never tells anyone what an answer means. See
     PRODUCT_BOUNDARY.md — not a therapist, no prescribed meaning.
     ============================================================ */
  import { onMount } from "svelte";
  import { dateLabel } from "../lib/dates.ts";
  import { load, save, type Note, type Session } from "../lib/storage.ts";
  import {
    defaultStage,
    inferSessions,
    isOpen,
    pendingQuestions,
    recurringTags,
    INTERVIEW_PROMPTS,
    type InferredSession,
  } from "../lib/sessions.ts";

  /* Each test is a question about the question, not a verdict. Every
     step offers "keep it anyway" — this sharpens, it does not gate. */
  const SHARPENER_TESTS = [
    {
      id: "command",
      prompt:
        "Read it back. Is this a question you could sit with, or is it asking someone else to change, or asking why something happened?",
      hint: '"Why did they do that" or "how do I make this different" tend to lead nowhere useful. "What is my part in this" travels further.',
    },
    {
      id: "yesno",
      prompt: "Could this be answered yes or no?",
      hint: 'Closed questions tend to close the thing down with them. "Do I want this?" often opens further as "What do I actually want, here?"',
    },
    {
      id: "other",
      prompt: "Is this about you, or about someone else's behaviour?",
      hint: "A question about someone else usually has no answer you can find alone. Turned toward your own experience, it usually does.",
    },
    {
      id: "capacity",
      prompt:
        "Would you still recognise this in six hours, tired, in an unfamiliar state of mind?",
      hint: 'Specific tends to survive better than abstract. "What am I afraid of losing" outlasts "the nature of my fear."',
    },
  ] as const;

  const RAW_FIELDS = [
    {
      id: "image",
      label: "One image still with you",
      placeholder: "A few words are enough",
    },
    {
      id: "word",
      label: "One word for how it felt",
      placeholder: "Just the word",
    },
    {
      id: "else",
      label: "Anything else you don't want to lose",
      placeholder: "Optional",
    },
  ] as const;

  let notes: Note[] = $state([]);
  let sessions: Session[] = $state([]);
  let ready = $state(false);
  let storageError = $state(false);
  let announcement = $state("");

  /* Confirming "set aside" inline rather than with window.confirm():
     the native dialog is OS-styled, blocks the main thread, and
     ignores data-motion/prefers-reduced-motion. Holds the id of the
     one session currently asking to be confirmed, if any. */
  let settingAsideId: string | null = $state(null);

  /* Sharpener flow state. step 0 = drafting; 1..N = the tests in
     order; step > tests.length = accepted, ready to save. */
  let sharpenerOpen = $state(false);
  let draftQuestion = $state("");
  let sharpenerStep = $state(0);

  /* Raw-capture and interview draft bodies, keyed by field/prompt id
     so re-render does not lose in-progress text between renders. */
  let rawDrafts: Record<string, string> = $state({});
  let interviewDrafts: Record<string, string> = $state({});
  let tagDraft = $state("");

  onMount(async () => {
    try {
      notes = (await load("bearings-notes")) ?? [];
      sessions = (await load("bearings-sessions")) ?? [];
    } catch {
      storageError = true;
    } finally {
      ready = true;
    }
  });

  /* Only the most recent inferred session is ever offered the
     capture UI, and only while it is within isOpen's window — an
     older open session further back is read as history rather
     than reopened, so there is never ambiguity about which one
     "active" means. */
  const inferred = $derived(inferSessions(notes, sessions));
  const mostRecent = $derived(inferred[inferred.length - 1] ?? null);
  const active = $derived(
    mostRecent && isOpen(mostRecent) ? mostRecent : null,
  );
  const past = $derived(
    active ? inferred.slice(0, -1) : inferred,
  );
  const lastPast = $derived(past[past.length - 1] ?? null);
  const stage = $derived(active ? defaultStage(active.startedAt) : null);

  /* Tags a person used in more than one session. Strictly factual —
     it counts occurrences of words they chose themselves and says
     nothing about what the repetition means. Anything more (grouping
     near-synonyms, reading a theme out of it) would be the app
     interpreting someone's experience for them. */
  const recurring = $derived(recurringTags(inferred));

  /* A question saved but not yet written against. Only the newest is
     offered the capture fields — an older one still shows in the list
     below, because silently dropping something a person wrote would
     be worse than showing it with its date. */
  const pending = $derived(pendingQuestions(notes, sessions));
  const held = $derived(!active && pending.length ? pending[0] : null);

  /* Notes are written against whichever of the two is in front of the
     person: an active inferred session, or a held question that has
     nothing attached yet. In the second case the id is the Session's
     own, which is exactly what inferSessions' explicit-link pass
     reads — so the first saved note converts the held question into
     an active session with the question already attached. */
  const captureId = $derived(active?.id ?? held?.id ?? null);

  /* Pending questions not shown as `held`. When a question is held
     this is everything older than it; when an active session has the
     floor this is all of them. Listed plainly, each with a way out —
     a standing reminder of something a person decided not to do is
     exactly the kind of quiet pressure PRODUCT_BOUNDARY.md refuses. */
  const otherPending = $derived(
    active ? pending : held ? pending.slice(1) : [],
  );

  async function persistNotes(next: Note[]) {
    notes = next;
    try {
      await save("bearings-notes", next);
    } catch {
      storageError = true;
    }
  }

  async function persistSessions(next: Session[]) {
    sessions = next;
    try {
      await save("bearings-sessions", next);
    } catch {
      storageError = true;
    }
  }

  function openSharpener() {
    draftQuestion = "";
    sharpenerStep = 0;
    sharpenerOpen = true;
  }

  function sharpenerAdvance() {
    sharpenerStep += 1;
  }

  function sharpenerRestart() {
    sharpenerStep = 0;
  }

  async function acceptQuestion() {
    const text = draftQuestion.trim();
    if (!text) return;
    const session: Session = {
      id: crypto.randomUUID(),
      question: text,
      createdAt: new Date().toISOString(),
    };
    await persistSessions([session, ...sessions]);
    sharpenerOpen = false;
    announcement = "Question saved. It will be here until you write against it or set it aside.";
  }

  function skipSharpener() {
    sharpenerOpen = false;
  }

  async function saveRawField(fieldId: string) {
    const text = (rawDrafts[fieldId] ?? "").trim();
    if (!text || !captureId) return;
    const note: Note = {
      id: crypto.randomUUID(),
      body: text,
      createdAt: new Date().toISOString(),
      sessionId: captureId,
      stage: "raw",
      promptId: fieldId,
    };
    await persistNotes([note, ...notes]);
    rawDrafts = { ...rawDrafts, [fieldId]: "" };
    announcement = "Saved on this device.";
  }

  async function saveInterviewAnswer(promptId: string) {
    const text = (interviewDrafts[promptId] ?? "").trim();
    if (!text || !captureId) return;
    const note: Note = {
      id: crypto.randomUUID(),
      body: text,
      createdAt: new Date().toISOString(),
      sessionId: captureId,
      stage: "interview",
      promptId,
    };
    await persistNotes([note, ...notes]);
    interviewDrafts = { ...interviewDrafts, [promptId]: "" };
    announcement = "Saved on this device.";
  }

  async function addTag(target: InferredSession) {
    const tag = tagDraft.trim();
    if (!tag || target.notes.length === 0) return;
    /* Tags attach to one fixed note in the session — notes[0], the
       oldest in the cluster — rather than to every note in it. One
       clear place to look for a session's tags, and it keeps a tag
       from being duplicated across a whole cluster every time one
       is added. */
    const carrier = target.notes[0];
    const nextNotes = notes.map((n) =>
      n.id === carrier.id
        ? { ...n, tags: [...new Set([...(n.tags ?? []), tag])] }
        : n,
    );
    await persistNotes(nextNotes);
    tagDraft = "";
  }

  /* Deleting a question nothing was written against. Needed because a
     held question otherwise waits indefinitely with no way to clear
     it, which turns an optional tool into a standing reminder of
     something a person chose not to do. PRODUCT_BOUNDARY.md: nobody
     owes the experience anything, including a question they wrote
     down once. Only ever offered for pending questions — once notes
     are attached, deleting the question would strand them. */
  function requestSetAside(session: Session) {
    settingAsideId = session.id;
  }

  function cancelSetAside() {
    settingAsideId = null;
  }

  async function setAside(session: Session) {
    settingAsideId = null;
    await persistSessions(sessions.filter((s) => s.id !== session.id));
    announcement = "Removed.";
  }

  function hasAnswered(target: InferredSession, promptId: string): boolean {
    return target.notes.some((n) => n.promptId === promptId);
  }

  function answerFor(target: InferredSession, promptId: string): string | null {
    return target.notes.find((n) => n.promptId === promptId)?.body ?? null;
  }
</script>

<section class="tracker" aria-labelledby="tracker-heading">
  <h2 id="tracker-heading">A held question, and what came after</h2>
  <p class="detail">
    Entirely optional, and separate from the rest of Bearings. Nobody owes an
    experience a held question, and having one is not a requirement for the
    rest of this app to be useful.
  </p>

  {#snippet rawCapture()}
    {#each RAW_FIELDS as field}
      <div class="field-row">
        <label for={`raw-${field.id}`}>{field.label}</label>
        <textarea
          id={`raw-${field.id}`}
          rows="2"
          placeholder={field.placeholder}
          value={rawDrafts[field.id] ?? ""}
          oninput={(e) =>
            (rawDrafts = {
              ...rawDrafts,
              [field.id]: (e.target as HTMLTextAreaElement).value,
            })}
        ></textarea>
        <button
          type="button"
          class="save small"
          disabled={!(rawDrafts[field.id] ?? "").trim()}
          onclick={() => saveRawField(field.id)}
        >
          Save
        </button>
      </div>
    {/each}
  {/snippet}

  {#if !ready}
    <p class="status" aria-live="polite">Opening…</p>
  {:else}
    {#if sharpenerOpen}
      <div class="sharpener">
        {#if sharpenerStep === 0}
          <label for="draft-question">A question you might want to hold</label>
          <textarea
            id="draft-question"
            bind:value={draftQuestion}
            rows="2"
            placeholder="In your own words. There is no wrong way to start this."
          ></textarea>
          <div class="row">
            <button
              type="button"
              class="save"
              disabled={!draftQuestion.trim()}
              onclick={sharpenerAdvance}
            >
              Test this question
            </button>
            <button type="button" class="quiet" onclick={skipSharpener}>
              Not now
            </button>
          </div>
        {:else if sharpenerStep <= SHARPENER_TESTS.length}
          {@const test = SHARPENER_TESTS[sharpenerStep - 1]}
          <p class="question-echo">"{draftQuestion}"</p>
          <p class="test-prompt">{test.prompt}</p>
          <p class="test-hint">{test.hint}</p>
          <div class="row">
            <button type="button" class="save" onclick={sharpenerAdvance}>
              Keep it
            </button>
            <button type="button" class="quiet" onclick={sharpenerRestart}>
              Rephrase
            </button>
          </div>
        {:else}
          <p class="question-echo">"{draftQuestion}"</p>
          <p class="test-prompt">This is your question. Nothing tested it against anything but itself.</p>
          <div class="row">
            <button type="button" class="save" onclick={acceptQuestion}>
              Hold this question
            </button>
            <button type="button" class="quiet" onclick={sharpenerRestart}>
              Rephrase anyway
            </button>
          </div>
        {/if}
      </div>
    {:else if active}
      <div class="active-session">
        {#if active.question}
          <p class="held-question">Held question: "{active.question}"</p>
        {/if}

        {#if stage === "raw"}
          <h3>The first hours</h3>
          <p class="detail">
            As little as possible. Detail decays fast — a phrase now is worth
            more than a paragraph next week.
          </p>
          {@render rawCapture()}
        {:else if stage === "interview"}
          <h3>The days after</h3>
          <p class="detail">Four questions. Answer whichever fit, skip the rest.</p>
          {#each INTERVIEW_PROMPTS as prompt}
            <div class="field-row">
              <label for={`iv-${prompt.id}`}>{prompt.text}</label>
              {#if hasAnswered(active, prompt.id)}
                <p class="answered">{answerFor(active, prompt.id)}</p>
              {:else}
                <textarea
                  id={`iv-${prompt.id}`}
                  rows="3"
                  placeholder="Skip if nothing fits"
                  value={interviewDrafts[prompt.id] ?? ""}
                  oninput={(e) =>
                    (interviewDrafts = {
                      ...interviewDrafts,
                      [prompt.id]: (e.target as HTMLTextAreaElement).value,
                    })}
                ></textarea>
                <button
                  type="button"
                  class="save small"
                  disabled={!(interviewDrafts[prompt.id] ?? "").trim()}
                  onclick={() => saveInterviewAnswer(prompt.id)}
                >
                  Save
                </button>
              {/if}
            </div>
          {/each}
        {:else}
          <h3>Sitting with it</h3>
          <p class="detail">
            No fixed prompt here. If you want to tag this session with a
            word or two of your own, you can — it is the only way this app
            will ever notice something recurring.
          </p>
        {/if}

        <div class="tag-row">
          <label for="tag-input">Tag this session (your own word)</label>
          <div class="row">
            <input id="tag-input" type="text" bind:value={tagDraft} placeholder="e.g. contempt" />
            <button
              type="button"
              class="save small"
              disabled={!tagDraft.trim()}
              onclick={() => addTag(active)}
            >
              Add
            </button>
          </div>
          {#if active.notes[0]?.tags?.length}
            <p class="tags">{active.notes[0].tags.join(" · ")}</p>
          {/if}
        </div>
      </div>
    {:else if held}
      <div class="active-session">
        <p class="held-question">"{held.question}"</p>
        <p class="detail">
          Held {dateLabel(held.createdAt)}. Nothing has been written against
          it yet — add to it now, or come back to it later.
        </p>
        <h3>If something is with you right now</h3>
        {@render rawCapture()}
        {#if settingAsideId === held.id}
          <p class="confirm-row" role="alert">
            Remove this question? Nothing was written against it, so nothing
            else is deleted.
            <button type="button" class="quiet danger" onclick={() => setAside(held)}>
              Yes, remove it
            </button>
            <button type="button" class="quiet" onclick={cancelSetAside}>
              Cancel
            </button>
          </p>
        {:else}
          <button type="button" class="quiet" onclick={() => requestSetAside(held)}>
            Set this question aside
          </button>
        {/if}
      </div>
    {:else}
      <button type="button" class="save" onclick={openSharpener}>
        Prepare a held question
      </button>

      {#if lastPast}
        <div class="last-time">
          <p class="kicker">Last time</p>
          {#if lastPast.question}
            <p class="held-question">"{lastPast.question}"</p>
          {/if}
          <p class="detail">
            {dateLabel(lastPast.startedAt)} · {lastPast.notes.length} note{lastPast.notes.length === 1 ? "" : "s"}
          </p>
        </div>
      {/if}
    {/if}

    {#if recurring.length}
      <div class="history">
        <p class="kicker">Words you have used more than once</p>
        <ul class="recurring">
          {#each recurring as item (item.tag)}
            <li>
              <span class="tag-name">{item.tag}</span>
              <span class="detail">{item.count} sessions</span>
            </li>
          {/each}
        </ul>
        <p class="detail">
          Only a count of your own words. What the repetition means, if it
          means anything, is not something this app can tell you.
        </p>
      </div>
    {/if}

    {#if otherPending.length}
      <div class="history">
        <p class="kicker">Also waiting ({otherPending.length})</p>
        <ul class="past-list">
          {#each otherPending as session (session.id)}
            <li>
              <p class="held-question small">"{session.question}"</p>
              <p class="detail">
                Held {dateLabel(session.createdAt)} · nothing written yet
              </p>
              {#if settingAsideId === session.id}
                <p class="confirm-row" role="alert">
                  Remove this question? Nothing was written against it, so
                  nothing else is deleted.
                  <button type="button" class="quiet danger" onclick={() => setAside(session)}>
                    Yes, remove it
                  </button>
                  <button type="button" class="quiet" onclick={cancelSetAside}>
                    Cancel
                  </button>
                </p>
              {:else}
                <button
                  type="button"
                  class="quiet"
                  onclick={() => requestSetAside(session)}
                >
                  Set aside
                </button>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if past.length}
      <div class="history">
        <p class="kicker">Past sessions ({past.length})</p>
        <ul class="past-list">
          {#each [...past].reverse() as session (session.id)}
            <li>
              {#if session.question}
                <p class="held-question small">"{session.question}"</p>
              {/if}
              <p class="detail">
                {dateLabel(session.startedAt)} · {session.notes.length} note{session.notes.length === 1 ? "" : "s"}
                {#if session.notes[0]?.tags?.length}
                  · {session.notes[0].tags.join(", ")}
                {/if}
              </p>
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
  .tracker {
    margin-top: var(--space-6);
    margin-bottom: var(--space-6);
    padding-top: var(--space-4);
    border-top: 1px solid var(--rule);
    max-width: var(--measure);
  }
  .tracker h2 {
    font-size: var(--size-lg);
  }
  .tracker h3 {
    font-size: var(--size-base);
    margin-top: var(--space-4);
    margin-bottom: var(--space-2);
  }
  .detail {
    color: var(--ink-soft);
    margin-top: var(--space-2);
  }
  label {
    display: block;
    font-weight: 600;
    margin-top: var(--space-3);
    margin-bottom: var(--space-2);
  }
  textarea,
  input[type="text"] {
    width: 100%;
    font: inherit;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    background: var(--paper);
    color: var(--ink);
  }
  textarea:focus,
  input[type="text"]:focus {
    border-color: var(--gold);
    outline: none;
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
  .quiet.danger {
    color: var(--signal);
    text-decoration-color: var(--signal);
  }
  .confirm-row {
    margin-top: var(--space-3);
    padding: var(--space-3);
    border: 1px solid var(--signal);
    border-radius: var(--radius);
    color: var(--ink);
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;
  }
  .confirm-row .quiet {
    margin-top: 0;
  }
  .sharpener,
  .active-session,
  .last-time,
  .history {
    margin-top: var(--space-4);
  }
  .question-echo {
    font-family: var(--font-display);
    font-size: var(--size-lg);
    font-weight: 500;
    margin-bottom: var(--space-3);
  }
  .test-prompt {
    font-weight: 600;
  }
  .test-hint {
    color: var(--ink-faint);
    font-size: var(--size-sm);
    margin-top: var(--space-1);
  }
  .held-question {
    font-family: var(--font-display);
    font-size: var(--size-lg);
    font-weight: 500;
    margin-bottom: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--paper-raised);
    border-radius: var(--radius);
  }
  .held-question.small {
    font-size: var(--size-base);
    padding: var(--space-2) var(--space-3);
  }
  .field-row {
    margin-bottom: var(--space-3);
  }
  .answered {
    padding: var(--space-3);
    background: var(--paper-raised);
    border-radius: var(--radius);
    color: var(--ink-soft);
    white-space: pre-wrap;
  }
  .tag-row {
    margin-top: var(--space-4);
    padding-top: var(--space-3);
    border-top: 1px solid var(--rule);
  }
  .tag-row input {
    max-width: 20rem;
  }
  .tags {
    margin-top: var(--space-2);
    color: var(--gold-bright);
    font-family: var(--font-meta);
    font-size: var(--size-meta);
    letter-spacing: 0.1em;
  }
  .kicker {
    font-family: var(--font-meta);
    font-size: var(--size-meta);
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--ink-faint);
  }
  .past-list {
    list-style: none;
    padding: 0;
    display: grid;
    gap: var(--space-3);
    margin-top: var(--space-3);
  }
  .past-list li {
    padding: var(--space-2) 0;
    border-top: 1px solid var(--rule);
  }
  .recurring {
    list-style: none;
    padding: 0;
    display: grid;
    gap: var(--space-2);
    margin-top: var(--space-3);
  }
  .recurring li {
    display: flex;
    align-items: baseline;
    gap: var(--space-3);
  }
  .tag-name {
    color: var(--gold-bright);
    font-family: var(--font-meta);
    font-size: var(--size-meta);
    letter-spacing: 0.1em;
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
