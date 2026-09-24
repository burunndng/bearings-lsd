<script lang="ts">
  import { onMount } from "svelte";
  import type { Referral } from "../lib/referrals.ts";

  interface Props {
    initialReferrals: Referral[];
    initialLastVerified: string;
    emergencyNote: string;
  }

  const { initialReferrals, initialLastVerified, emergencyNote }: Props = $props();

  let items = $state<Referral[]>(initialReferrals);
  let lastVerified = $state(initialLastVerified);
  let stale = $state(false);

  onMount(async () => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 3500);
    try {
      const response = await fetch("/referrals.json", {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Referral refresh failed");
      const payload = await response.json();
      if (!Array.isArray(payload.referrals) || typeof payload.lastVerified !== "string") {
        throw new Error("Referral refresh returned invalid data");
      }
      items = payload.referrals as Referral[];
      lastVerified = payload.lastVerified;
      stale = false;
    } catch {
      stale = true;
    } finally {
      window.clearTimeout(timeout);
    }
  });
</script>

<section aria-labelledby="referral-heading">
  <h2 id="referral-heading">Where to reach people</h2>
  <ul class="ref-list">
    {#each items as referral (referral.name)}
      <li>
        <span class="ref-name">{referral.name}</span>
        <span class="ref-who">{referral.who}</span>
        <a
          class="ref-detail"
          href={referral.href}
          target={referral.href.startsWith("https:") ? "_blank" : undefined}
          rel={referral.href.startsWith("https:") ? "noopener noreferrer" : undefined}
        >
          {referral.detail}
        </a>
        <span class="ref-region">{referral.region}</span>
      </li>
    {/each}
  </ul>
  <p class="verified">
    {emergencyNote} Last checked {lastVerified}. If a number looks out of date,
    treat local emergency services as the reliable route.
  </p>
  {#if stale}
    <p class="source-status" role="status">
      Showing the copy saved with this page. Reconnect to check for a newer number.
    </p>
  {/if}
</section>

<style>
  section {
    margin-top: var(--space-5);
    margin-bottom: var(--space-5);
  }
  h2 {
    font-size: var(--size-xl);
    margin-bottom: var(--space-3);
  }
  .ref-list {
    list-style: none;
    padding: 0;
    display: grid;
    gap: var(--space-3);
    margin-top: var(--space-3);
  }
  .ref-list li {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--rule);
  }
  .ref-name {
    font-weight: 600;
  }
  .ref-detail,
  .ref-who,
  .ref-region {
    color: var(--ink-soft);
    font-size: var(--size-sm);
  }
  .verified,
  .source-status {
    color: var(--ink-faint);
    font-size: var(--size-sm);
    margin-top: var(--space-3);
  }
  .source-status {
    border-left: 2px solid var(--rule);
    padding-left: var(--space-3);
  }
</style>
