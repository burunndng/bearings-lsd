<script lang="ts">
  /* ============================================================
     Bearings — Shelf filter (real, client-side, URL-param driven)
     MotivationChooser.svelte previously said "Showing things that
     might fit" without doing anything. This makes that statement
     true, and only true — everything it does is visible, reversible,
     and degrades to showing everything.

     Mechanism: reads ?m=<id> from the current URL (set by the
     chooser as a plain link — no JS required to arrive here
     filtered). Toggles [hidden] on <li data-motivations> elements
     already rendered server-side by ShelfList.astro.

     Hard constraints (PRODUCT_BOUNDARY.md, Phase 4.1):
     - JS off -> nothing in this file runs -> everything stays
       visible. This IS the progressive-enhancement default; there
       is no separate no-JS code path to maintain.
     - data-unfilterable="true" (tone: risk, or a safetyRoute) is
       never hidden, regardless of motivation match.
     - Cards with no motivations (data-motivations="") always show —
       they were written for everyone.
     - Zero matches never means an empty shelf: falls back to
       showing everything with a plain note.
     - No persisted identity label: the param is transient, visible
       in the URL, and revocable by removing it or clicking
       "show everything".
     ============================================================ */
  import { onMount } from "svelte";
  import { MOTIVATION_LABELS, type Motivation } from "../lib/shelves.ts";

  function motivationLabel(id: string): string {
    return MOTIVATION_LABELS[id as Motivation] ?? id;
  }

  let activeMotivation: string | null = $state(null);
  let totalCount = $state(0);
  let shownCount = $state(0);
  let ready = $state(false);

  function apply() {
    const items = Array.from(
      document.querySelectorAll<HTMLElement>("li[data-motivations]"),
    );
    totalCount = items.length;

    if (!activeMotivation) {
      items.forEach((el) => el.removeAttribute("hidden"));
      shownCount = totalCount;
      return;
    }

    let matched = 0;
    for (const el of items) {
      const list = (el.dataset.motivations ?? "")
        .split(",")
        .filter(Boolean);
      const unfilterable = el.dataset.unfilterable === "true";
      const noMotivations = list.length === 0;
      const matches = list.includes(activeMotivation);
      const show = unfilterable || noMotivations || matches;
      if (show) {
        el.removeAttribute("hidden");
        matched++;
      } else {
        el.setAttribute("hidden", "");
      }
    }

    // Never an empty shelf: zero matches falls back to showing
    // everything, with the note below explaining why.
    if (matched === 0) {
      items.forEach((el) => el.removeAttribute("hidden"));
      shownCount = totalCount;
    } else {
      shownCount = matched;
    }
  }

  function clear() {
    activeMotivation = null;
    const url = new URL(window.location.href);
    url.searchParams.delete("m");
    history.replaceState(null, "", url);
    apply();
  }

  onMount(() => {
    const url = new URL(window.location.href);
    activeMotivation = url.searchParams.get("m");
    apply();
    ready = true;
  });
</script>

{#if ready && activeMotivation}
  <p class="filter-status" role="status">
    {#if shownCount === totalCount}
      Showing everything — nothing matched "{motivationLabel(activeMotivation)}" exactly, so nothing is hidden.
    {:else}
      Showing {shownCount} of {totalCount} for "{motivationLabel(activeMotivation)}".
    {/if}
    <button type="button" class="clear" onclick={clear}>Show everything</button>
  </p>
{/if}

<style>
  .filter-status {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;
    color: var(--ink-soft);
    font-size: var(--size-sm);
    margin-bottom: var(--space-4);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    background: var(--paper-raised);
  }
  .clear {
    position: relative;
    min-height: auto;
    padding: 0;
    border: 0;
    background: none;
    color: var(--gold);
    text-decoration: underline;
    text-decoration-color: var(--gold);
    text-underline-offset: 0.15em;
    font-size: var(--size-sm);
  }
  /* Invisible hit-area expansion to meet the 44px tap target without
     adding visible padding to what is meant to read as inline text. */
  .clear::before {
    content: "";
    position: absolute;
    inset: calc(-1 * var(--space-3)) calc(-1 * var(--space-2));
  }
</style>
