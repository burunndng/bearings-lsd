<script lang="ts">
  /* ============================================================
     Bearings — Worksheet renderer

     A dumb renderer for the typed worksheet definitions in
     lib/worksheets.ts. It owns presentation only: the fillable
     fields, the print button, and the nothing-saved warning.

     In-memory only, like the safety Sheet: these worksheets hold
     some of the most sensitive writing in the app, so persisting
     them would be the wrong tradeoff even though it costs the
     user their work on an accidental reload. That tradeoff is
     stated plainly in the UI, not hidden in behavior.

     Every field is optional and there is no validation gate — a
     blank print is a valid print. The print button is always
     enabled; "Save as PDF" is the browser's own dialog.
     ============================================================ */
  import type { WorksheetDef } from "../lib/worksheets.ts";

  let { worksheet }: { worksheet: WorksheetDef } = $props();

  let values = $state<Record<string, string>>({});
  let checks = $state<Record<string, boolean>>({});
  let printTarget = $state<string | null>(null);

  function printSheet() {
    window.print();
  }

  function sectionId(heading: string) {
    return heading
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
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

<div class="worksheet-form">
  <div class="sheet-warning no-print" role="note">
  <p>
    <strong>Nothing here is saved.</strong> This stays in your browser's memory
    only, and disappears when you reload or close this page. Print it or save
    it as a PDF before you close it.
  </p>
</div>

<div class="sheet-actions no-print">
  <button type="button" class="print-btn" onclick={printSheet}>
    Print · Save as PDF
  </button>
</div>

<nav class="worksheet-index no-print" aria-label={`${worksheet.title} sections`}>
  <div class="index-head">
    <span>Field map</span>
    <strong>{worksheet.sections.length} parts</strong>
  </div>
  <ol>
    {#each worksheet.sections as section, index (section.heading)}
      <li>
        <a href={`#${sectionId(section.heading)}`}>
          <span class="index-number" aria-hidden="true">{sectionNumber(index)}</span>
          <span>{section.heading}</span>
        </a>
      </li>
    {/each}
  </ol>
</nav>

<form
  class="worksheet"
  class:print-one={printTarget !== null}
  onsubmit={(e) => e.preventDefault()}
>
  <p class="ws-title">{worksheet.title}</p>
  {#each worksheet.sections as section, index (section.heading)}
    {@const partId = sectionId(section.heading)}
    <section
      class="block"
      class:safety-strip={section.safety}
      class:print-target={printTarget === partId}
      id={partId}
    >
      <div class="section-heading">
        <span class="section-number" aria-hidden="true">{sectionNumber(index)}</span>
        <h2>{section.heading}</h2>
        <button
          type="button"
          class="part-print no-print"
          onclick={() => printPart(partId)}
          aria-label={`Print only ${section.heading}`}
        >
          Print this part
        </button>
      </div>
      {#if section.intro}
        <p class="intro">{section.intro}</p>
      {/if}
      {#if section.link}
        <p class="section-link">
          <a href={section.link.href}>{section.link.label}</a>
        </p>
      {/if}
      {#if section.preprinted}
        <ul class="preprinted">
          {#each section.preprinted as line}
            <li>{line}</li>
          {/each}
        </ul>
      {/if}
      {#each section.fields as field (field.id)}
        {#if field.kind === "line"}
          <label class="field-line">
            <span>{field.label}</span>
            <input type="text" bind:value={values[field.id]} placeholder={field.placeholder} />
          </label>
        {:else if field.kind === "area"}
          <label class="field-area">
            <span>{field.label}</span>
            <textarea rows={field.rows ?? 3} bind:value={values[field.id]} placeholder={field.placeholder}></textarea>
          </label>
        {:else if field.kind === "check"}
          <label class="field-check">
            <input type="checkbox" bind:checked={checks[field.id]} />
            <span>{field.label}</span>
          </label>
        {:else if field.kind === "pair"}
          <div class="pair-row">
            <label>
              <span>{field.leftLabel}</span>
              <input type="text" bind:value={values[`${field.id}-left`]} />
            </label>
            <label>
              <span>{field.rightLabel}</span>
              <input type="text" bind:value={values[`${field.id}-right`]} />
            </label>
          </div>
        {/if}
      {/each}
      {#if section.sources?.length}
        <p class="sources">
          {#each section.sources as source}
            <span class="source">{source.cite}{source.url ? ` — ${source.url}` : ""}</span>
          {/each}
        </p>
      {/if}
    </section>
  {/each}

  <p class="footnote">{worksheet.footnote}</p>
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

  .worksheet-index {
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
  .worksheet-index ol {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-2) var(--space-4);
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .worksheet-index a {
    display: grid;
    grid-template-columns: 2rem minmax(0, 1fr);
    align-items: center;
    gap: var(--space-2);
    min-height: var(--tap-min);
    color: var(--ink-soft);
    font-size: var(--size-sm);
    text-decoration: none;
  }
  .worksheet-index a:hover,
  .worksheet-index a:focus-visible {
    color: var(--gold-bright);
  }
  .index-number {
    color: var(--gold);
    font-family: var(--font-meta);
    font-size: var(--size-meta);
    letter-spacing: 0.1em;
  }
  .worksheet-index a:hover .index-number,
  .worksheet-index a:focus-visible .index-number {
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }

  /* The printed artifact starts here. */
  .ws-title {
    font-family: var(--font-meta);
    font-size: var(--size-meta);
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--ink-faint);
    margin-bottom: var(--space-3);
  }
  .worksheet {
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
  .intro {
    color: var(--ink-soft);
    font-size: var(--size-sm);
    line-height: var(--leading-body);
    margin-bottom: var(--space-3);
  }
  .section-link {
    font-family: var(--font-meta);
    font-size: var(--size-meta);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: var(--space-3);
  }
  .section-link a {
    color: var(--gold);
  }
  .preprinted {
    list-style: none;
    padding: 0;
    display: grid;
    gap: var(--space-2);
    color: var(--ink);
    font-size: var(--size-sm);
    margin-bottom: var(--space-3);
  }
  .preprinted li {
    padding-left: var(--space-3);
    border-left: 2px solid var(--rule);
  }
  label {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    font-size: var(--size-sm);
    color: var(--ink-soft);
    margin-top: var(--space-3);
  }
  input[type="text"],
  textarea {
    font: inherit;
    font-size: var(--size-base);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    background: var(--paper);
    color: var(--ink);
    width: 100%;
    resize: vertical;
  }
  input[type="text"]:focus,
  textarea:focus {
    border-color: var(--gold);
    box-shadow: 0 0 12px var(--gold-glow);
    outline: none;
  }
  input[type="text"]:focus-visible,
  textarea:focus-visible {
    outline: 3px solid var(--focus-ring);
    outline-offset: 2px;
  }
  .field-check {
    flex-direction: row;
    align-items: center;
    gap: var(--space-2);
    color: var(--ink);
    min-height: var(--tap-min);
    margin-top: 0;
  }
  .field-check + .field-check {
    margin-top: 0;
  }
  input[type="checkbox"] {
    accent-color: var(--gold);
    width: 1.1rem;
    height: 1.1rem;
  }
  .pair-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
    break-inside: avoid;
  }
  .sources {
    margin-top: var(--space-3);
    display: grid;
    gap: var(--space-1);
  }
  .source {
    color: var(--ink-faint);
    font-size: var(--size-xs, 0.72rem);
    word-break: break-word;
  }
  .safety-strip {
    border-color: var(--route-urgent);
    border-width: 2px;
  }
  .safety-strip .section-number {
    border-color: var(--route-urgent);
    color: var(--route-urgent);
  }
  .footnote {
    color: var(--ink-faint);
    font-size: var(--size-sm);
    max-width: 72ch;
  }
  @media (max-width: 30rem) {
    .worksheet-index ol {
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
    .pair-row {
      grid-template-columns: 1fr;
    }
  }
</style>
