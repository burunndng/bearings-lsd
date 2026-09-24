<script lang="ts">
  /* ============================================================
     Bearings — The Sheet
     In-memory only. Nothing persists, nothing is saved, nothing
     survives a reload. This form holds the most sensitive data in
     the app (substance, dose source, contacts) — paper is the
     artifact, this form is only the means to print it. Persisting
     it would be the wrong tradeoff even though it costs the user
     their work on an accidental reload. That tradeoff is stated
     plainly in the UI, not hidden in behavior.

     Referrals pulled from the single source of truth so the phone
     number printed here can never drift from the one shown on
     /safety.
     ============================================================ */
  import { referrals } from "../lib/referrals.ts";

  const fireside = referrals.find((r) => r.name === "Fireside Project");

  let substance = $state("");
  let source = $state("");
  let tested = $state("");
  let when = $state("");

  let started = $state("");
  let effectsUntil = $state("");

  let contactOneName = $state("");
  let contactOneWay = $state("");
  let contactTwoName = $state("");
  let contactTwoWay = $state("");

  let ifThenExtra1If = $state("");
  let ifThenExtra1Then = $state("");
  let ifThenExtra2If = $state("");
  let ifThenExtra2Then = $state("");

  const HANDLED_ITEMS = [
    "Water",
    "Food that needs no cooking",
    "A blanket",
    "Keys stowed somewhere I won't need to find them",
    "Phone charged",
    "Playlist downloaded, not streamed",
    "Door locked",
  ];

  const SHEET_SECTIONS = [
    { id: "what", label: "What" },
    { id: "when", label: "When" },
    { id: "who", label: "Who" },
    { id: "if-then", label: "If — then" },
    { id: "handled", label: "Handled" },
    { id: "why", label: "Why" },
    { id: "tomorrow", label: "Tomorrow" },
    { id: "safety", label: "Safety" },
  ] as const;
  let handled = $state<Record<string, boolean>>({});

  let why = $state("");

  let tomorrowNothing = $state(false);
  let tomorrowFood = $state(false);
  let tomorrowMessage = $state("");
  let printTarget = $state<string | null>(null);

  function printSheet() {
    window.print();
  }

  function sectionNumber(index: number) {
    return String(index + 1).padStart(2, "0");
  }

  function printPart(id: string) {
    printTarget = id;
    window.addEventListener("afterprint", () => (printTarget = null), { once: true });
    window.print();
  }
</script>

<div class="sheet-form">
  <div class="sheet-warning" role="note">
  <p>
    <strong>Nothing here is saved.</strong> This stays in your browser's memory
    only, and disappears the moment you reload or close this page. Print it
    before you close this page, or the words leave with it.
  </p>
</div>

<div class="sheet-actions no-print">
  <button type="button" class="print-btn" onclick={printSheet}>Print this sheet</button>
</div>

<nav class="sheet-index no-print" aria-label="Safety Sheet sections">
  <div class="index-head">
    <span>Field map</span>
    <strong>{SHEET_SECTIONS.length} parts</strong>
  </div>
  <ol>
    {#each SHEET_SECTIONS as section, index (section.id)}
      <li>
        <a href={`#sheet-${section.id}`}>
          <span class="index-number" aria-hidden="true">{sectionNumber(index)}</span>
          <span>{section.label}</span>
        </a>
      </li>
    {/each}
  </ol>
</nav>

<form class="sheet" class:print-one={printTarget !== null}>
  <section class="block" class:print-target={printTarget === "sheet-what"} id="sheet-what">
    <div class="section-heading">
      <span class="section-number" aria-hidden="true">01</span>
      <h2>What</h2>
      <button
        type="button"
        class="part-print no-print"
        onclick={() => printPart("sheet-what")}
        aria-label="Print only What"
      >
        Print this part
      </button>
    </div>
    <div class="grid-2">
      <label>
        Substance
        <input type="text" bind:value={substance} placeholder="What you're taking" />
      </label>
      <label>
        Source
        <input type="text" bind:value={source} placeholder="Where it came from" />
      </label>
      <label>
        Tested?
        <input type="text" bind:value={tested} placeholder="Reagent, fentanyl strip, neither" />
      </label>
      <label>
        When
        <input type="text" bind:value={when} placeholder="Date / time planned" />
      </label>
    </div>
  </section>

  <section class="block" class:print-target={printTarget === "sheet-when"} id="sheet-when">
    <div class="section-heading">
      <span class="section-number" aria-hidden="true">02</span>
      <h2>When</h2>
      <button
        type="button"
        class="part-print no-print"
        onclick={() => printPart("sheet-when")}
        aria-label="Print only When"
      >
        Print this part
      </button>
    </div>
    <div class="grid-2">
      <label>
        Started
        <input type="text" bind:value={started} placeholder="Time you actually start" />
      </label>
      <label>
        Effects expected until
        <input type="text" bind:value={effectsUntil} placeholder="Rough end time" />
      </label>
    </div>
    <p class="printed-note">Time will feel wrong while it's happening. That is the substance, not a sign anything is off.</p>
  </section>

  <section class="block" class:print-target={printTarget === "sheet-who"} id="sheet-who">
    <div class="section-heading">
      <span class="section-number" aria-hidden="true">03</span>
      <h2>Who</h2>
      <button
        type="button"
        class="part-print no-print"
        onclick={() => printPart("sheet-who")}
        aria-label="Print only Who"
      >
        Print this part
      </button>
    </div>
    <div class="grid-2">
      <label>
        Contact 1 (name one)
        <input type="text" bind:value={contactOneName} placeholder="Name" />
      </label>
      <label>
        How to reach them
        <input type="text" bind:value={contactOneWay} placeholder="Phone number" />
      </label>
      <label>
        Contact 2
        <input type="text" bind:value={contactTwoName} placeholder="Name" />
      </label>
      <label>
        How to reach them
        <input type="text" bind:value={contactTwoWay} placeholder="Phone number" />
      </label>
    </div>
    {#if fireside}
      <p class="printed-note">
        {fireside.name}: {fireside.detail} — {fireside.who}
      </p>
    {/if}
  </section>

  <section
    class="block if-then"
    class:print-target={printTarget === "sheet-if-then"}
    id="sheet-if-then"
  >
    <div class="section-heading">
      <span class="section-number" aria-hidden="true">04</span>
      <h2>If — then</h2>
      <button
        type="button"
        class="part-print no-print"
        onclick={() => printPart("sheet-if-then")}
        aria-label="Print only If then"
      >
        Print this part
      </button>
    </div>
    <ul class="preprinted">
      <li>If I want to leave the house &rarr; I don't.</li>
      <li>If I want to message someone &rarr; it waits until tomorrow.</li>
      <li>If I feel like I'm dying &rarr; this passes. Sit down. Call the line.</li>
    </ul>
    <div class="if-then-row">
      <label>
        If
        <input type="text" bind:value={ifThenExtra1If} />
      </label>
      <label>
        then
        <input type="text" bind:value={ifThenExtra1Then} />
      </label>
    </div>
    <div class="if-then-row">
      <label>
        If
        <input type="text" bind:value={ifThenExtra2If} />
      </label>
      <label>
        then
        <input type="text" bind:value={ifThenExtra2Then} />
      </label>
    </div>
  </section>

  <section class="block" class:print-target={printTarget === "sheet-handled"} id="sheet-handled">
    <div class="section-heading">
      <span class="section-number" aria-hidden="true">05</span>
      <h2>Handled</h2>
      <button
        type="button"
        class="part-print no-print"
        onclick={() => printPart("sheet-handled")}
        aria-label="Print only Handled"
      >
        Print this part
      </button>
    </div>
    <ul class="checklist">
      {#each HANDLED_ITEMS as item}
        <li>
          <label>
            <input type="checkbox" bind:checked={handled[item]} />
            {item}
          </label>
        </li>
      {/each}
    </ul>
  </section>

  <section class="block" class:print-target={printTarget === "sheet-why"} id="sheet-why">
    <div class="section-heading">
      <span class="section-number" aria-hidden="true">06</span>
      <h2>Why</h2>
      <button
        type="button"
        class="part-print no-print"
        onclick={() => printPart("sheet-why")}
        aria-label="Print only Why"
      >
        Print this part
      </button>
    </div>
      <input type="text" bind:value={why} placeholder="One line, in your own words — why this, why now" class="why-input" />
  </section>

  <section class="block" class:print-target={printTarget === "sheet-tomorrow"} id="sheet-tomorrow">
    <div class="section-heading">
      <span class="section-number" aria-hidden="true">07</span>
      <h2>Tomorrow</h2>
      <button
        type="button"
        class="part-print no-print"
        onclick={() => printPart("sheet-tomorrow")}
        aria-label="Print only Tomorrow"
      >
        Print this part
      </button>
    </div>
    <ul class="checklist">
      <li>
        <label>
          <input type="checkbox" bind:checked={tomorrowNothing} />
          Nothing scheduled
        </label>
      </li>
      <li>
        <label>
          <input type="checkbox" bind:checked={tomorrowFood} />
          Food already in the house
        </label>
      </li>
    </ul>
    <label>
      Who I'll message tomorrow
      <input type="text" bind:value={tomorrowMessage} />
    </label>
  </section>

  <section
    class="block safety-strip"
    class:print-target={printTarget === "sheet-safety"}
    id="sheet-safety"
  >
    <div class="section-heading">
      <span class="section-number" aria-hidden="true">08</span>
      <h2>Safety, in six lines</h2>
      <button
        type="button"
        class="part-print no-print"
        onclick={() => printPart("sheet-safety")}
        aria-label="Print only the safety section"
      >
        Print this part
      </button>
    </div>
    <ul class="preprinted">
      <li>Pressured, unsafe place, or unsure about a medication? There's no cost to pausing.</li>
      <li>History of psychosis, heart condition, lithium or MAOI use? Talk to a clinician first.</li>
      <li>Chest pain, seizure, unresponsive, or thoughts of self-harm? Get urgent help now.</li>
      <li>Still not feeling right the next day? That's a reason to call, not to wait.</li>
      <li>Fireside Project: {fireside?.detail}.</li>
      <li>Full detail: bearings app, "Support & safety".</li>
    </ul>
  </section>
</form>
</div>

<style>
  .sheet-warning {
    border-left: 3px solid var(--signal);
    background: var(--paper-raised);
    border-radius: var(--radius);
    padding: var(--space-3) var(--space-4);
    margin-bottom: var(--space-4);
  }
  .sheet-warning p {
    color: var(--ink-soft);
    margin: 0;
  }
  .sheet-actions {
    margin-bottom: var(--space-4);
  }
  .print-btn {
    padding: var(--space-2) var(--space-4);
    min-height: var(--tap-min);
    border: 1px solid var(--gold);
    border-radius: var(--radius);
    background: transparent;
    color: var(--gold-bright);
    font: inherit;
    font-weight: 600;
  }
  .print-btn:hover {
    box-shadow: 0 0 20px var(--gold-glow);
  }
  .sheet-index {
    max-width: 72ch;
    margin-bottom: var(--space-5);
    border-block: 1px solid var(--rule);
    padding-block: var(--space-3);
  }
  .index-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
    color: var(--ink-faint);
    font-family: var(--font-meta);
    font-size: var(--size-meta);
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .index-head strong {
    color: var(--gold);
    font-weight: 500;
  }
  .sheet-index ol {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-2) var(--space-4);
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .sheet-index a {
    display: grid;
    grid-template-columns: 2rem minmax(0, 1fr);
    align-items: center;
    gap: var(--space-2);
    min-height: var(--tap-min);
    color: var(--ink-soft);
    font-size: var(--size-sm);
    text-decoration: none;
  }
  .sheet-index a:hover,
  .sheet-index a:focus-visible {
    color: var(--gold-bright);
  }
  .index-number {
    color: var(--gold);
    font-family: var(--font-meta);
    font-size: var(--size-meta);
    letter-spacing: 0.1em;
  }
  .sheet {
    display: grid;
    gap: var(--space-5);
    max-width: 72ch;
    margin-bottom: var(--space-6);
  }
  .block {
    position: relative;
    scroll-margin-top: var(--space-4);
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    padding: var(--space-4);
  }
  .section-heading {
    display: grid;
    grid-template-columns: 2.5rem minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
  }
  .part-print {
    min-height: var(--tap-min);
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    padding-inline: var(--space-3);
    background: transparent;
    color: var(--ink-soft);
    font: inherit;
    font-size: var(--size-sm);
    cursor: pointer;
  }
  .part-print:hover,
  .part-print:focus-visible {
    border-color: var(--gold);
    color: var(--gold-bright);
  }
  .section-number {
    display: grid;
    place-items: center;
    width: 2.5rem;
    height: 2.5rem;
    border: 1px solid var(--rule);
    border-radius: 50%;
    color: var(--gold);
    font-family: var(--font-meta);
    font-size: var(--size-meta);
    letter-spacing: 0.1em;
  }
  .block h2 {
    font-size: var(--size-lg);
  }
  .grid-2 {
    display: grid;
    gap: var(--space-3);
    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  }
  label {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    font-size: var(--size-sm);
    color: var(--ink-soft);
  }
  input[type="text"] {
    font: inherit;
    font-size: var(--size-base);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    background: var(--paper);
    color: var(--ink);
  }
  input[type="text"]:focus {
    border-color: var(--gold);
    box-shadow: 0 0 12px var(--gold-glow);
    outline: none;
  }
  input[type="text"]:focus-visible {
    outline: 3px solid var(--focus-ring);
    outline-offset: 2px;
  }
  input[type="checkbox"] {
    accent-color: var(--gold);
    width: 1.1rem;
    height: 1.1rem;
  }
  .why-input {
    width: 100%;
  }
  .printed-note {
    margin-top: var(--space-3);
    color: var(--ink-faint);
    font-size: var(--size-sm);
  }
  .preprinted {
    list-style: none;
    padding: 0;
    display: grid;
    gap: var(--space-2);
    color: var(--ink);
  }
  .if-then-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
    margin-top: var(--space-3);
    break-inside: avoid;
  }
  .checklist {
    list-style: none;
    padding: 0;
    display: grid;
    gap: var(--space-2);
  }
  .checklist label {
    flex-direction: row;
    align-items: center;
    gap: var(--space-2);
    color: var(--ink);
    min-height: var(--tap-min);
  }
  .safety-strip {
    border-color: var(--route-urgent);
    border-width: 2px;
  }
  .safety-strip .section-number {
    border-color: var(--route-urgent);
    color: var(--route-urgent);
  }
  .safety-strip .preprinted li {
    break-inside: avoid;
  }
  @media (max-width: 30rem) {
    .sheet-index ol {
      grid-template-columns: 1fr;
    }
    .section-heading {
      grid-template-columns: 2rem minmax(0, 1fr);
      gap: var(--space-2);
    }
    .section-number {
      width: 2rem;
      height: 2rem;
    }
    .part-print {
      grid-column: 2;
      justify-self: start;
    }
    .grid-2,
    .if-then-row {
      grid-template-columns: 1fr;
    }
  }
</style>

