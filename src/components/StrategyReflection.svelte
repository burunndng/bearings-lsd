<script lang="ts">
  /* ============================================================
     Bearings — Strategy reflection

     A deterministic, on-device reflection tool. The user answers
     what they want to (all fields optional), chooses a lens, and
     receives a plain reading: their own words back, plus fixed
     questions and things to check on.

     This component handles:
     - Crisis-language detection and non-blocking referral panel
     - Form input (four optional fields)
     - Reading generation and display
     - Past readings list

     Nothing leaves this device. No interpretation, no generation,
     no network calls. This is a pure local tool using fixed, trusted
     wording that ships with the app.
     ============================================================ */

  import { onMount } from "svelte";
  import { dateLabel } from "../lib/dates.ts";
  import {
    load,
    save,
    type StrategistReading,
  } from "../lib/storage.ts";
  import {
    isCrisisInput,
    buildReading,
    LENS_INFO,
    STRATEGIST_LENSES,
    type StrategistLens,
  } from "../lib/strategist.ts";
  import { emergency, referrals } from "../lib/referrals.ts";

  let currentState = $state("");
  let recentExperience = $state("");
  let observedTension = $state("");
  let focusDomain = $state<StrategistLens>("learning-loops");
  let readings: StrategistReading[] = $state([]);
  let current: StrategistReading | null = $state(null);
  let ready = $state(false);
  let storageError = $state(false);
  let crisisOpen = $state(false);
  /* Announced on delete, same pattern as Journal: the button has no
     visible state change of its own, so this is the confirmation. */
  let announcement = $state("");

  onMount(async () => {
    try {
      readings = (await load("bearings-readings")) ?? [];
    } catch {
      storageError = true;
    } finally {
      ready = true;
    }
  });

  const canRun = $derived(
    currentState.trim() || recentExperience.trim() || observedTension.trim(),
  );

  async function generateAndStore() {
    const reading = buildReading({
      currentState: currentState || undefined,
      recentExperience: recentExperience || undefined,
      focusDomain,
      observedTension: observedTension || undefined,
    });

    current = reading;
    readings = [reading, ...readings];

    try {
      await save("bearings-readings", readings);
    } catch {
      storageError = true;
    }
  }

  async function runReflection() {
    const allText = [currentState, recentExperience, observedTension].join(
      "\n",
    );
    if (isCrisisInput(allText)) {
      crisisOpen = true;
      return;
    }
    await generateAndStore();
  }

  function continueAnyway() {
    crisisOpen = false;
    generateAndStore();
  }

  function isReturnSection(sectionId: string): boolean {
    return sectionId === "return";
  }

  function isCheckSection(sectionId: string): boolean {
    return sectionId === "check";
  }

  /* A one-line label for a past reading. The tension section's title is
     constant by design, so it would name every reading identically in
     the list; the person's own first line — or, when they left it
     blank, the lens they chose — is what actually tells readings
     apart. */
  function readingLabel(reading: StrategistReading): string {
    const tension = reading.sections.find((s) => s.id === "tension");
    const lens = reading.sections.find((s) => s.id === "lens");
    const firstLine = tension?.body.split("\n")[0] ?? "";
    const wroteSomething = firstLine.length > 0 && !firstLine.startsWith("You left this one blank");
    const source = wroteSomething ? firstLine : (lens?.title ?? "");
    return source.length > 64 ? `${source.slice(0, 63).trimEnd()}…` : source;
  }

  async function removeReading(id: string) {
    readings = readings.filter((r) => r.id !== id);
    if (current?.id === id) current = null;
    try {
      await save("bearings-readings", readings);
      announcement = "Reading deleted.";
    } catch {
      storageError = true;
    }
  }
</script>

<section class="strategy" aria-labelledby="strategy-heading">
  {#if crisisOpen}
    <div class="crisis-panel" role="alertdialog" aria-labelledby="crisis-title">
      <h2 id="crisis-title">Before anything else</h2>
      <p>
        What you wrote points toward a moment that deserves people who are
        trained for it, not a reflection tool. The reading can wait. These are
        here now:
      </p>
      <p class="emergency-note">{emergency.note}</p>
      <ul class="referral-list">
        {#each referrals.slice(0, 3) as referral}
          <li>
            <strong>{referral.name}</strong> — {referral.who} <br />
            <span>{referral.detail}</span>
            {" — "}
            <a href={referral.href} class="referral-link">
              {referral.href.startsWith("tel:") ? "Call" : "Visit"}
            </a>
          </li>
        {/each}
      </ul>
      <p>
        <a href="/safety" class="more-link">More on getting urgent help</a>
      </p>
      <div class="crisis-actions">
        <button type="button" onclick={continueAnyway}>
          Continue anyway
        </button>
        <p class="device-note">Everything stays on this device.</p>
      </div>
    </div>
  {/if}

  <div class="form-intro">
    <h2 id="strategy-heading">A short check-in</h2>
    <p class="lede">All of it is optional. The reading works with whatever you give it.</p>
  </div>

  <form onsubmit={(e) => { e.preventDefault(); runReflection(); }}>
    <div class="field-group">
      <label for="current-state">Where things stand</label>
      <p class="help">
        A few words on energy, mood, sleep, and whether the ground feels steady.
      </p>
      <textarea
        id="current-state"
        bind:value={currentState}
        rows="3"
        placeholder="A few words are enough"
      ></textarea>
    </div>

    <div class="field-group">
      <label for="recent-experience">What happened recently</label>
      <p class="help">
        The experience itself, or the days since — your choice what to include.
      </p>
      <textarea
        id="recent-experience"
        bind:value={recentExperience}
        rows="3"
        placeholder="Optional"
      ></textarea>
    </div>

    <div class="field-group">
      <label for="lens">What to look through</label>
      <p class="help">
        A lens is just a way of arranging the questions. You can change it any
        time.
      </p>
      <select id="lens" bind:value={focusDomain}>
        {#each STRATEGIST_LENSES as lens}
          <option value={lens}>{LENS_INFO[lens].label}</option>
        {/each}
      </select>
    </div>

    <div class="field-group">
      <label for="tension">What is pulling</label>
      <p class="help">Optional. What feels jagged, or pulled in two directions at once.</p>
      <textarea
        id="tension"
        bind:value={observedTension}
        rows="3"
        placeholder="Optional"
      ></textarea>
    </div>

    <div class="actions">
      <button type="submit" class="save" disabled={!canRun}>
        Run reflection
      </button>
    </div>
  </form>

  {#if storageError}
    <p class="storage-error" role="alert">
      This browser could not save your reading. You can still write elsewhere
      or try again later.
    </p>
  {/if}

  {#if current}
    <div class="current-reading">
      <h2>Current reading</h2>
      <div class="sections">
        {#each current.sections as section}
          {#if section.quiet}
            <details class="quiet-section">
              <summary>Show the checks behind this: {section.title}</summary>
              <div class="quiet-content">
                <p class="section-title">{section.title}</p>
                <p class="section-body">{section.body}</p>
              </div>
            </details>
          {:else}
            <div class="section" class:return-accent={isReturnSection(section.id)}>
              {#if isCheckSection(section.id)}
                <span class="badge">watching</span>
              {/if}
              <p class="section-title">{section.title}</p>
              <p class="section-body">{section.body}</p>
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {/if}

  {#if readings.length > 0}
    <div class="past-readings">
      <h2>Past readings</h2>
      <div class="reading-list">
        {#each readings as reading (reading.id)}
          <details class="past-reading">
            <summary>
              <span class="reading-date">{dateLabel(reading.createdAt)}</span>
              <span class="reading-title">{readingLabel(reading)}</span>
            </summary>
            <div class="past-sections">
              {#each reading.sections as section}
                {#if section.quiet}
                  <details class="quiet-section">
                    <summary>Show the checks behind this: {section.title}</summary>
                    <div class="quiet-content">
                      <p class="section-title">{section.title}</p>
                      <p class="section-body">{section.body}</p>
                    </div>
                  </details>
                {:else}
                  <div class="section" class:return-accent={isReturnSection(section.id)}>
                    {#if isCheckSection(section.id)}
                      <span class="badge">watching</span>
                    {/if}
                    <p class="section-title">{section.title}</p>
                    <p class="section-body">{section.body}</p>
                  </div>
                {/if}
              {/each}
              <button type="button" class="remove" onclick={() => removeReading(reading.id)}>
                Delete reading
              </button>
            </div>
          </details>
        {/each}
      </div>
    </div>
  {/if}

  <p class="saved-note" role="status" aria-live="polite">{announcement}</p>

  <p class="status">On this device only · nothing you type is sent anywhere</p>
</section>

<style>
  .strategy {
    margin-top: var(--space-4);
    max-width: var(--measure);
  }

  .crisis-panel {
    margin-top: var(--space-4);
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--signal);
    border-radius: var(--radius);
    background: var(--paper-raised);
  }

  .crisis-panel h2 {
    font-size: var(--size-lg);
    margin-bottom: var(--space-3);
  }

  .crisis-panel p {
    margin-bottom: var(--space-2);
  }

  .emergency-note {
    font-weight: 600;
    margin-top: var(--space-3);
    margin-bottom: var(--space-3);
  }

  .referral-list {
    list-style: none;
    padding: 0;
    margin: var(--space-3) 0;
  }

  .referral-list li {
    padding: var(--space-2) 0;
    border-bottom: 1px solid var(--rule);
  }

  .referral-list li:last-child {
    border-bottom: none;
  }

  .referral-link {
    color: var(--gold-bright);
  }

  .more-link {
    color: var(--gold-bright);
    display: inline-block;
    margin-top: var(--space-2);
  }

  .crisis-actions {
    margin-top: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .device-note {
    font-size: var(--size-sm);
    color: var(--ink-faint);
    font-style: italic;
  }

  .form-intro h2 {
    font-size: var(--size-lg);
    margin-bottom: var(--space-2);
  }

  .lede {
    color: var(--ink-soft);
    font-size: var(--size-base);
    margin-bottom: var(--space-4);
  }

  .field-group {
    margin-bottom: var(--space-4);
  }

  label {
    display: block;
    font-weight: 600;
    margin-bottom: var(--space-2);
  }

  .help {
    color: var(--ink-soft);
    font-size: var(--size-sm);
    margin-bottom: var(--space-2);
  }

  textarea {
    width: 100%;
    display: block;
    resize: vertical;
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    padding: var(--space-3);
    color: var(--ink);
    background: var(--paper);
    font: inherit;
    line-height: var(--leading-body);
    transition: border-color 0.25s ease, box-shadow 0.25s ease;
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

  textarea::placeholder {
    color: var(--ink-faint);
    font-style: italic;
  }

  select {
    width: 100%;
    display: block;
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    padding: var(--space-3);
    color: var(--ink);
    background: var(--paper);
    font: inherit;
    line-height: var(--leading-body);
  }

  .actions {
    margin-top: var(--space-4);
  }

  button {
    border-radius: var(--radius);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--rule);
    background: transparent;
    color: var(--ink);
    font-size: var(--size-sm);
    cursor: pointer;
    min-height: var(--tap-min);
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .save {
    border-color: var(--gold);
    color: var(--gold-bright);
    font-family: var(--font-meta);
    font-size: var(--size-meta);
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }

  .storage-error {
    margin-top: var(--space-3);
    color: var(--signal);
    font-weight: 600;
  }

  .current-reading,
  .past-readings {
    margin-top: var(--space-5);
  }

  .current-reading h2,
  .past-readings h2 {
    font-size: var(--size-lg);
    margin-bottom: var(--space-3);
  }

  .section {
    background: var(--paper-raised);
    border-radius: var(--radius);
    padding: var(--space-3) var(--space-4);
    margin-bottom: var(--space-3);
    border-left: 3px solid var(--rule);
    position: relative;
  }

  .section.return-accent {
    border-left-color: var(--gold);
  }

  .badge {
    font-family: var(--font-meta);
    font-size: var(--size-meta);
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--signal);
    display: block;
    margin-bottom: var(--space-2);
  }

  .section-title {
    font-family: var(--font-display);
    font-size: var(--size-lg);
    margin-bottom: var(--space-2);
  }

  .section-body {
    white-space: pre-wrap;
    line-height: var(--leading-body);
  }

  .quiet-section {
    margin-bottom: var(--space-3);
  }

  .quiet-section summary {
    cursor: pointer;
    color: var(--ink-soft);
    font-family: var(--font-meta);
    font-size: var(--size-sm);
    padding: var(--space-1) 0;
  }

  .quiet-section summary:hover {
    color: var(--gold-bright);
  }

  .quiet-content {
    margin-top: var(--space-2);
    padding-left: var(--space-3);
    border-left: 2px solid var(--rule);
  }

  .reading-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .past-reading {
    background: var(--paper-raised);
    border-radius: var(--radius);
    padding: var(--space-3);
    border: 1px solid var(--rule);
  }

  .past-reading summary {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    list-style: none;
  }

  .past-reading summary::-webkit-details-marker {
    display: none;
  }

  .past-reading summary:hover .reading-date {
    color: var(--gold-bright);
  }

  .reading-date {
    font-family: var(--font-meta);
    font-size: var(--size-sm);
    color: var(--ink-faint);
  }

  .reading-title {
    font-family: var(--font-display);
    font-size: var(--size-base);
    color: var(--ink);
  }

  .past-sections {
    margin-top: var(--space-3);
    padding-top: var(--space-3);
    border-top: 1px solid var(--rule);
  }

  .status {
    color: var(--ink-faint);
    margin-top: var(--space-4);
    font-family: var(--font-meta);
    font-size: var(--size-sm);
  }

  /* Delete affordance inside an expanded past reading. Quiet inline
     text with an invisible hit-area expansion, matching Journal's
     per-note remove — deletion here is ordinary, not a red event. */
  .remove {
    position: relative;
    border: 0;
    padding: 0;
    min-height: auto;
    background: none;
    color: var(--ink-faint);
    font-size: var(--size-sm);
    text-decoration: underline;
    text-decoration-color: var(--rule);
    text-underline-offset: 0.15em;
    cursor: pointer;
  }
  .remove::before {
    content: "";
    position: absolute;
    inset: calc(-1 * var(--space-2)) calc(-1 * var(--space-2));
  }
  .remove:hover,
  .remove:focus-visible {
    color: var(--signal);
    text-decoration-color: var(--signal);
  }
  .saved-note {
    margin-top: var(--space-2);
    color: var(--ink-soft);
    font-size: var(--size-sm);
  }
  .saved-note:empty {
    display: none;
  }
</style>
