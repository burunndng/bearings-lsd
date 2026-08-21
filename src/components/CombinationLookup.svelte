<script lang="ts">
  /* ============================================================
     Bearings — Combination lookup (UI for lib/interactions.ts)

     The engine was written and tested before this component
     existed; everything here is presentation. No storage I/O, no
     network, no persisted state — a pairing chosen here is not
     written anywhere, so there is nothing to wipe and nothing to
     leak. Reloading the page clears it.

     Three constraints this component exists to honour:

     1. A status is legible by glyph AND label AND colour, never
        colour alone. `dangerous` and `unsafe` share the magenta
        register and are separated by glyph, label, and fill —
        someone who cannot distinguish the two hues still reads
        two different statuses.
     2. `isSampleData` is surfaced unconditionally and above the
        result, not in a footnote. Sample data presented as real
        interaction data is the worst failure available to this
        page, so the notice is not dismissible.
     3. It looks things up. It does not clear anyone for anything
        (PRODUCT_BOUNDARY.md: not a safety gatekeeper). No copy
        here says a pairing is fine — the statuses say what they
        say and the reader decides.

     `sameSubstance` is handled as its own state rather than shown
     as "Unknown": the engine resolves A+A to unknown because no
     cell exists, which is true but reads as a data gap rather
     than what it is.
     ============================================================ */
  import {
    substances,
    lookup,
    STATUS_DEFINITIONS,
    isSampleData,
    sourceLabel,
    sourceUrl,
    sourceSnapshotDate,
    type ComboResult,
  } from "../lib/interactions.ts";

  let aId = $state("");
  let bId = $state("");

  const result = $derived<ComboResult | null>(
    aId && bId ? lookup(aId, bId) : null,
  );

  function swap() {
    const held = aId;
    aId = bId;
    bId = held;
  }

  function clear() {
    aId = "";
    bId = "";
  }
</script>

{#if isSampleData}
  <aside class="sample-notice">
    <p class="sample-head">
      <span class="sample-glyph" aria-hidden="true">▚</span>
      Sample data — not real interaction information
    </p>
    <p>
      The substances below are placeholders (Alpha, Beta, and so on) used to
      build and check this page before a real dataset is in place. The statuses
      are illustrative. Nothing here describes an actual pairing, so there is
      nothing here to act on.
    </p>
  </aside>
{/if}

<section class="lookup" aria-labelledby="lookup-heading">
  <h2 id="lookup-heading">Look up a pairing</h2>
  <p class="help">
    Two substances, in either order. If a pairing is not in the data, it comes
    back as unknown rather than as safe.
  </p>

  <div class="pair">
    <div class="field">
      <label for="combo-a">One</label>
      <select id="combo-a" bind:value={aId}>
        <option value="">Choose…</option>
        {#each substances as s (s.id)}
          <option value={s.id}>{s.name}</option>
        {/each}
      </select>
    </div>

    <div class="field">
      <label for="combo-b">The other</label>
      <select id="combo-b" bind:value={bId}>
        <option value="">Choose…</option>
        {#each substances as s (s.id)}
          <option value={s.id}>{s.name}</option>
        {/each}
      </select>
    </div>
  </div>

  <div class="actions">
    <button type="button" onclick={swap} disabled={!aId && !bId}>
      Swap
    </button>
    <button type="button" onclick={clear} disabled={!aId && !bId}>
      Clear
    </button>
  </div>

  <div class="result-region" role="status" aria-live="polite">
    {#if !result}
      <p class="awaiting">
        Two choices above will show what the data says about that pairing.
      </p>
    {:else if result.sameSubstance}
      <p class="awaiting">
        That is {result.a.name} on both sides. Two different substances will
        show a pairing.
      </p>
    {:else}
      <article class="result" data-status={result.status}>
        <p class="pairing">{result.a.name} + {result.b.name}</p>
        <p class="status">
          <span class="status-glyph" aria-hidden="true"
            >{result.definition.glyph}</span
          >
          <span class="status-label">{result.definition.label}</span>
        </p>
        <p class="definition">{result.definition.definition}</p>
        {#if result.note}
          <p class="note">{result.note}</p>
        {/if}
      </article>
    {/if}
  </div>
</section>

<section class="legend" aria-labelledby="legend-heading">
  <h2 id="legend-heading">What the statuses mean</h2>
  <p class="help">
    Seven statuses, from most to least severe. The wording is ours; the
    categories follow the common harm-reduction taxonomy.
  </p>
  <dl>
    {#each STATUS_DEFINITIONS as d (d.id)}
      <div class="legend-row" data-status={d.id}>
        <dt>
          <span class="status-glyph" aria-hidden="true">{d.glyph}</span>
          <span class="status-label">{d.label}</span>
        </dt>
        <dd>{d.definition}</dd>
      </div>
    {/each}
  </dl>
</section>

<p class="provenance">
  {sourceLabel} · snapshot {sourceSnapshotDate} ·
  {#if sourceUrl}
    <a href={sourceUrl} rel="noreferrer">taxonomy reference</a>
  {/if}
</p>

<style>
  h2 {
    font-family: var(--font-display);
    font-size: var(--size-lg);
    line-height: var(--leading-tight);
    margin: 0 0 var(--space-2);
  }

  .help {
    color: var(--ink-soft);
    font-size: var(--size-sm);
    margin: 0 0 var(--space-4);
    max-width: var(--measure);
  }

  /* --- Sample-data notice ---
     Deliberately the loudest thing on the page while the dataset is
     a placeholder. Magenta is the threshold register. */
  .sample-notice {
    border: 1px solid var(--magenta);
    border-left-width: 3px;
    border-radius: var(--radius);
    background: var(--paper-raised);
    padding: var(--space-3);
    margin-bottom: var(--space-5);
    max-width: var(--measure);
  }
  .sample-head {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    margin: 0 0 var(--space-2);
    font-family: var(--font-meta);
    font-size: var(--size-meta);
    letter-spacing: var(--meta-tracking);
    text-transform: uppercase;
    color: var(--magenta);
    text-shadow: var(--glow-magenta);
  }
  .sample-glyph {
    font-size: 1rem;
    line-height: 1;
  }
  .sample-notice p:last-child {
    margin: 0;
    color: var(--ink-soft);
    font-size: var(--size-sm);
  }

  .lookup {
    margin-bottom: var(--space-6);
  }

  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
    max-width: var(--measure);
  }
  @media (max-width: 30rem) {
    .pair {
      grid-template-columns: 1fr;
    }
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  label {
    font-family: var(--font-meta);
    font-size: var(--size-meta);
    letter-spacing: var(--meta-tracking);
    text-transform: uppercase;
    color: var(--ink-soft);
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
    min-height: var(--tap-min);
    transition: border-color 160ms var(--ease-expand);
  }
  select:hover {
    border-color: var(--ink-faint);
  }
  select:focus-visible {
    outline: 3px solid var(--focus-ring);
    outline-offset: 2px;
  }

  .actions {
    display: flex;
    gap: var(--space-2);
    margin-top: var(--space-3);
  }

  button {
    border-radius: var(--radius);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--rule);
    background: transparent;
    color: var(--ink);
    font-family: var(--font-meta);
    font-size: var(--size-meta);
    letter-spacing: var(--meta-tracking);
    text-transform: uppercase;
    cursor: pointer;
    min-height: var(--tap-min);
    transition:
      border-color 160ms var(--ease-expand),
      color 160ms var(--ease-expand);
  }
  button:hover:not(:disabled) {
    border-color: var(--uv);
    color: var(--uv);
  }
  /* Press state is the half of the story hover leaves out: a button
     that lights on hover but not on press reads as decorative. */
  button:active:not(:disabled) {
    border-color: var(--gold);
    color: var(--gold-bright);
    transform: translateY(1px);
  }
  button:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  .result-region {
    margin-top: var(--space-4);
    max-width: var(--measure);
  }

  .awaiting {
    color: var(--ink-faint);
    font-size: var(--size-sm);
    margin: 0;
    padding: var(--space-3);
    border: 1px dashed var(--rule);
    border-radius: var(--radius);
  }

  /* --- Result panel ---
     `--status-ink` is set per status below; the panel reads it so the
     colour logic lives in one place per status rather than being
     repeated for border, glyph, and label. */
  .result {
    border: 1px solid var(--status-ink, var(--rule));
    border-left-width: 3px;
    border-radius: var(--radius);
    background: var(--paper-raised);
    padding: var(--space-3);
    /* A pairing is a finding, not a state — it earns a beat rather
       than snapping into place. 220ms, expand curve, no overshoot. */
    animation: result-in 220ms var(--ease-expand) both;
  }
  @keyframes result-in {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  .pairing {
    font-family: var(--font-meta);
    font-size: var(--size-meta);
    letter-spacing: var(--meta-tracking);
    text-transform: uppercase;
    color: var(--ink-soft);
    margin: 0 0 var(--space-2);
  }

  .status {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    margin: 0 0 var(--space-2);
  }
  .status-glyph {
    font-family: var(--font-meta);
    color: var(--status-ink, var(--ink));
    font-size: var(--size-lg);
    line-height: 1;
  }
  .status-label {
    font-family: var(--font-display);
    font-size: var(--size-lg);
    line-height: var(--leading-tight);
    color: var(--status-ink, var(--ink));
  }

  .definition {
    margin: 0;
    color: var(--ink);
    max-width: var(--measure);
  }

  .note {
    margin: var(--space-3) 0 0;
    padding-left: var(--space-3);
    border-left: 2px solid var(--rule);
    color: var(--ink-soft);
    font-size: var(--size-sm);
  }

  /* Status registers. Colour is never the only carrier — glyph and
     label are always present — so these are an accent, not the
     information itself. `dangerous` additionally gets a filled
     glyph treatment so it separates from `unsafe` without relying
     on the hue difference. */
  [data-status="dangerous"] {
    --status-ink: var(--magenta);
  }
  [data-status="dangerous"] .status-glyph {
    background: var(--magenta);
    color: var(--signal-ink);
    padding: 0 0.28em;
    border-radius: var(--radius);
  }
  [data-status="unsafe"] {
    --status-ink: var(--magenta);
  }
  [data-status="caution"] {
    --status-ink: var(--amber);
  }
  [data-status="low-risk-decrease"],
  [data-status="low-risk-no-synergy"],
  [data-status="low-risk-synergy"] {
    --status-ink: var(--indigo);
  }
  [data-status="unknown"] {
    --status-ink: var(--dim);
  }

  /* --- Legend --- */
  .legend dl {
    margin: 0;
    max-width: var(--measure);
  }
  .legend-row {
    display: grid;
    grid-template-columns: minmax(11rem, auto) 1fr;
    gap: var(--space-3);
    padding: var(--space-3) 0;
    border-top: 1px solid var(--rule);
  }
  @media (max-width: 34rem) {
    .legend-row {
      grid-template-columns: 1fr;
      gap: var(--space-1);
    }
  }
  .legend-row dt {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
  }
  /* A legend row is a lookup key, not a definition — hovering one
     re-states the pairing that produced it, so the legend earns the
     same hover treatment the result panel gives its status. */
  .legend-row:hover dt .status-glyph {
    color: var(--gold-bright);
  }
  .legend-row:hover dt .status-label {
    color: var(--gold-bright);
  }
  .legend-row .status-label {
    font-size: var(--size-base);
  }
  .legend-row .status-glyph {
    font-size: var(--size-base);
  }
  .legend-row dd {
    margin: 0;
    color: var(--ink-soft);
    font-size: var(--size-sm);
  }

  .provenance {
    margin-top: var(--space-5);
    padding-top: var(--space-3);
    border-top: 1px solid var(--rule);
    font-family: var(--font-meta);
    font-size: var(--size-meta);
    letter-spacing: 0.08em;
    color: var(--ink-faint);
  }
  .provenance a {
    color: var(--ink-soft);
  }

  @media (prefers-reduced-motion: reduce) {
    select,
    button {
      transition: none;
    }
  }
</style>
