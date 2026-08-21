<script lang="ts">
  /* ============================================================
     Bearings — Motivation chooser (equal-weight)
     Philosophical center of the app. Failure mode A (implied
     hierarchy via ordering) is addressed here: order is SHUFFLED
     per visit so no option reads as the default or the fallback.
     No selection is persisted as an identity label. Selecting
     filters what surfaces; it never gates access or assigns a
     "track". "Not sure yet" is fully functional, not a dead end.
     ============================================================ */

  // Fixed source list — all equal. Shuffled at render (see below).
  const OPTIONS = [
    { id: "curious", label: "Curious or learning" },
    { id: "play", label: "Fun, play, or a change of pace" },
    { id: "close", label: "Feeling close to others" },
    { id: "awe", label: "Wonder, creativity, or awe" },
    { id: "difficult", label: "Working through something difficult" },
    { id: "support", label: "Supporting someone else" },
    { id: "unsure", label: "Not sure yet" },
  ];

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Shuffle once at construction — stable within a visit, varied across.
  const options = shuffle(OPTIONS);

  let selected: string | null = $state(null);

  function choose(id: string) {
    // Toggle: choosing the same one again clears it. No commitment.
    selected = selected === id ? null : id;
  }

  /* The chooser itself never filters — it only links to a shelf with
     ?m=<id> attached. ShelfFilter on that page reads the param and
     does the actual filtering. This keeps the param transient,
     visible in the URL, revocable, and back-button friendly, and
     keeps this component from persisting any identity label. */
  const shelfLinks = [
    { href: "/before", label: "Before" },
    { href: "/integration", label: "Integration" },
  ];
</script>

<div class="grid" role="group" aria-label="What brings you here">
  {#each options as opt}
    <button
      type="button"
      class="opt"
      class:selected={selected === opt.id}
      aria-pressed={selected === opt.id}
      onclick={() => choose(opt.id)}
    >
      {opt.label}
    </button>
  {/each}
</div>

{#if selected}
  <p class="chosen" role="status">
    Showing things that might fit on
    {#each shelfLinks as link, i}
      <a href={`${link.href}?m=${selected}`}>{link.label}</a
      >{i < shelfLinks.length - 1 ? " or " : ""}
    {/each}. You can change this any time, or
    <a href="/before">browse everything</a>.
  </p>
{/if}

<style>
  /* Every option identical: same size, weight, color. Equal dignity
     is enforced visually here — no option is elevated or privileged. */
  .grid {
    display: grid;
    gap: var(--space-2);
    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  }
  .opt {
    position: relative;
    font-family: var(--font-body);
    font-size: var(--size-base);
    text-align: left;
    padding: var(--space-3) var(--space-4) var(--space-3)
      calc(var(--space-4) + 0.9rem);
    min-height: var(--tap-min);
    background: var(--paper-raised);
    color: var(--ink);
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    cursor: pointer;
    transition:
      border-color 160ms var(--ease-expand),
      box-shadow 160ms var(--ease-expand);
  }
  /* Node dot: unlit until chosen — selection shown by shape AND
     color, never color alone. */
  .opt::before {
    content: "";
    position: absolute;
    left: var(--space-4);
    top: 50%;
    transform: translateY(-50%);
    width: 7px;
    height: 7px;
    border-radius: 50%;
    border: 1px solid var(--ink-faint);
    background: transparent;
    transition:
      background-color 160ms var(--ease-expand),
      border-color 160ms var(--ease-expand),
      box-shadow 160ms var(--ease-expand);
  }
  .opt:hover {
    border-color: var(--ink-faint);
  }
  .opt:active:not(:disabled) {
    transform: translateY(1px);
  }
  .opt.selected {
    border-color: var(--gold);
    box-shadow: 0 0 20px var(--gold-glow);
  }
  .opt.selected::before {
    background: var(--gold-bright);
    border-color: var(--gold-bright);
    box-shadow: 0 0 8px var(--gold-glow);
  }
  .chosen {
    margin-top: var(--space-3);
    color: var(--ink-soft);
    font-size: var(--size-sm);
  }
</style>
