# Psychedelic Sessions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A local-first, no-dependency web app with two interactive features: a Preparation (intention journal + guided visualization selector) and an Integration (emotion/insight tracker + decision ledger).

**Architecture:** Vanilla ES-module single-page app served as static files. A single `storage.js` registry owns every persisted key; pure logic modules (`storage`, `ledger`) are unit-tested with bun:test. No build step, no network, no third-party scripts.

**Tech Stack:** HTML + CSS + vanilla JavaScript (ES modules), bun for running tests and a static server. No frameworks, no npm dependencies.

## Global Constraints

- Local-first: no network calls, no analytics, no third-party scripts.
- Calm, adult, non-directive voice; all prompts optional and skippable.
- Single storage registry; "delete everything on this device" clears every key.
- Accessible: keyboard operable, screen-reader friendly, respects reduced motion.
- No build step; plain ES modules loaded via `<script type="module">`.
- Pure logic separated into testable modules; covered by bun:test.

---

### Task 1: Storage registry (single source of truth)

**Files:**
- Create: `src/storage.js`
- Test: `tests/storage.test.js`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `const STORE_KEYS = ["ps-intentions", "ps-checkins", "ps-ledger"]` (exported)
  - `load(key)`, `save(key, value)`, `clear(key)`, `wipe()` — all return promises; throw a single `StorageError` on failure.
  - `memoryBacking()` for tests.

- [ ] **Step 1: Write the failing test**

```js
import { test, expect } from "bun:test";
import { createStore, memoryBacking, STORE_KEYS } from "../src/storage.js";

test("load of an unset key is undefined", async () => {
  const store = createStore(memoryBacking());
  expect(await store.load("ps-intentions")).toBeUndefined();
});

test("save then load round-trips", async () => {
  const store = createStore(memoryBacking());
  await store.save("ps-intentions", [{ id: "a", text: "x", createdAt: "t" }]);
  expect(await store.load("ps-intentions")).toEqual([{ id: "a", text: "x", createdAt: "t" }]);
});

test("wipe clears every registered key", async () => {
  const store = createStore(memoryBacking());
  for (const k of STORE_KEYS) await store.save(k, []);
  await store.wipe();
  for (const k of STORE_KEYS) expect(await store.load(k)).toBeUndefined();
});

test("returned value is cloned (mutation does not leak)", async () => {
  const store = createStore(memoryBacking());
  await store.save("ps-ledger", [{ id: "a", decision: "x" }]);
  const got = await store.load("ps-ledger");
  got[0].decision = "tampered";
  expect((await store.load("ps-ledger"))[0].decision).toBe("x");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /var/home/ansimistrator/Documents/PSYCHEDELICRESEARCH/psychedelic-sessions && bun test`
Expected: FAIL (module not found).

- [ ] **Step 3: Write minimal implementation**

```js
export const STORE_KEYS = ["ps-intentions", "ps-checkins", "ps-ledger"];

export class StorageError extends Error {
  constructor(cause) {
    super("This device could not store your notes.", { cause });
    this.name = "StorageError";
  }
}

export function memoryBacking() {
  const map = new Map();
  return {
    async get(key) {
      if (!map.has(key)) return undefined;
      return structuredClone(map.get(key));
    },
    async set(key, value) {
      map.set(key, structuredClone(value));
    },
    async del(key) {
      map.delete(key);
    },
  };
}

function safe(fn) {
  try {
    return fn();
  } catch (e) {
    throw new StorageError(e);
  }
}

const localBacking = {
  async get(key) {
    return safe(() => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : undefined;
    });
  },
  async set(key, value) {
    return safe(() => localStorage.setItem(key, JSON.stringify(value)));
  },
  async del(key) {
    return safe(() => localStorage.removeItem(key));
  },
};

export function createStore(backing) {
  return {
    load(key) {
      return backing.get(key);
    },
    save(key, value) {
      return backing.set(key, value);
    },
    clear(key) {
      return backing.del(key);
    },
    async wipe() {
      for (const k of STORE_KEYS) await backing.del(k);
    },
  };
}

export const { load, save, clear, wipe } = createStore(localBacking);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/storage.js tests/storage.test.js
git commit -m "feat: single storage registry with wipe"
```

---

### Task 2: Ledger pure logic

**Files:**
- Create: `src/ledger.js`
- Test: `tests/ledger.test.js`

**Interfaces:**
- Consumes: nothing
- Produces: `dueForReview(entries)` (returns entries with `!outcome && reviewAt <= now`), `addOutcome(entry, outcome, refinement?)` (returns new entry with outcome + reviewedAt).

- [ ] **Step 1: Write the failing test**

```js
import { test, expect } from "bun:test";
import { dueForReview, addOutcome } from "../src/ledger.js";

const future = new Date(Date.now() + 86400000).toISOString();
const past = new Date(Date.now() - 86400000).toISOString();

test("dueForReview returns only undecided entries past review date", () => {
  const entries = [
    { id: "1", decision: "x", reviewAt: past },
    { id: "2", decision: "y", reviewAt: future },
    { id: "3", decision: "z", reviewAt: past, outcome: "holds" },
  ];
  const due = dueForReview(entries);
  expect(due.map((e) => e.id)).toEqual(["1"]);
});

test("addOutcome marks holds with reviewedAt", () => {
  const next = addOutcome({ id: "1", decision: "x", reviewAt: past }, "holds");
  expect(next.outcome).toBe("holds");
  expect(next.reviewedAt).toBeDefined();
  expect(next.refinement).toBeUndefined();
});

test("addOutcome refined carries refinement text", () => {
  const next = addOutcome({ id: "1", decision: "x", reviewAt: past }, "refined", "changed shape");
  expect(next.outcome).toBe("refined");
  expect(next.refinement).toBe("changed shape");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```js
export function dueForReview(entries, now = Date.now()) {
  return entries.filter((e) => !e.outcome && new Date(e.reviewAt).getTime() <= now);
}

export function addOutcome(entry, outcome, refinement) {
  return {
    ...entry,
    outcome,
    reviewedAt: new Date().toISOString(),
    ...(outcome === "refined" && refinement ? { refinement } : {}),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ledger.js tests/ledger.test.js
git commit -m "feat: decision ledger pure logic"
```

---

### Task 3: Preparation view (intention journal + visualization selector)

**Files:**
- Create: `src/prep.js`
- Create: `index.html` (shell with `#prep` and `#integrate` sections + nav)
- Create: `styles.css`

**Interfaces:**
- Consumes: `load`, `save`, `clear` from `src/storage.js`
- Produces: Prep UI mounted into `#prep`; starter prompt deck constant.

- [ ] **Step 1: Create `index.html` shell**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Session — prepare & integrate</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <a class="skip" href="#main">Skip to content</a>
    <header>
      <nav aria-label="Primary">
        <button data-view="prep" aria-current="page">Prepare</button>
        <button data-view="integrate">Integrate</button>
        <button id="wipe">Delete everything on this device</button>
      </nav>
    </header>
    <main id="main">
      <section id="prep" aria-labelledby="prep-h"></section>
      <section id="integrate" hidden aria-labelledby="int-h"></section>
    </main>
    <script type="module" src="./src/app.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Implement `src/prep.js`**

```js
import { load, save } from "./storage.js";

const STARTER_PROMPTS = [
  "What do I most want to feel during this?",
  "What am I carrying that I'd like to set down?",
  "Who or what do I want to be kinder to?",
  "What would make this feel less rushed?",
];

const VISUALIZATIONS = [
  { id: "breath", label: "Breath Anchor", seconds: 120, guidance: "In for 4, hold 7, out for 8. Let the breath be slow and even." },
  { id: "body", label: "Body Scan", seconds: 180, guidance: "From feet to head, notice sensation without changing it." },
  { id: "letgo", label: "Letting Go", seconds: 150, guidance: "Imagine each held thing as something you can set on the ground." },
  { id: "ground", label: "Grounding", seconds: 90, guidance: "Name five things you can see, four you can hear, three you can feel." },
];

export function mountPrep(root) {
  root.innerHTML = `
    <h1 id="prep-h">Before</h1>
    <p class="lede">Optional. Nothing here is required. What you write stays on this device.</p>
    <div class="prompts" aria-label="Starter prompts"></div>
    <form id="intent-form" aria-label="Intentions">
      <label for="intent">Set an intention (1–3)</label>
      <textarea id="intent" rows="3" placeholder="A few words are enough"></textarea>
      <button type="submit" class="save">Save intention</button>
    </form>
    <ul id="intent-list" class="list" aria-live="polite"></ul>
    <h2>Guided practice</h2>
    <div class="vis" aria-label="Visualizations"></div>
    <div id="vis-run" hidden aria-live="polite"></div>
  `;

  const promptsEl = root.querySelector(".prompts");
  STARTER_PROMPTS.forEach((p) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "prompt";
    b.textContent = p;
    b.onclick = () => {
      const ta = root.querySelector("#intent");
      ta.value = ta.value ? ta.value + "\n" + p : p;
    };
    promptsEl.appendChild(b);
  });

  const form = root.querySelector("#intent-form");
  const listEl = root.querySelector("#intent-list");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const text = root.querySelector("#intent").value.trim();
    if (!text) return;
    const intentions = (await load("ps-intentions")) ?? [];
    intentions.unshift({ id: crypto.randomUUID(), text, createdAt: new Date().toISOString() });
    await save("ps-intentions", intentions);
    root.querySelector("#intent").value = "";
    renderList(listEl, intentions);
  };

  const visEl = root.querySelector(".vis");
  VISUALIZATIONS.forEach((v) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "vis-opt";
    b.textContent = `${v.label} (${v.seconds / 60} min)`;
    b.onclick = () => runVisualization(root.querySelector("#vis-run"), v);
    visEl.appendChild(b);
  });

  load("ps-intentions").then((i) => renderList(listEl, i ?? []));
}

function renderList(el, items) {
  el.innerHTML = "";
  items.forEach((it) => {
    const li = document.createElement("li");
    li.textContent = it.text;
    el.appendChild(li);
  });
}

function runVisualization(runEl, v) {
  runEl.hidden = false;
  let remaining = v.seconds;
  runEl.innerHTML = `<h3>${v.label}</h3><p>${v.guidance}</p><p class="timer" role="timer">${remaining}s</p>`;
  const timer = runEl.querySelector(".timer");
  const id = setInterval(() => {
    remaining -= 1;
    timer.textContent = `${remaining}s`;
    if (remaining <= 0) {
      clearInterval(id);
      timer.textContent = "Done. Take your time.";
    }
  }, 1000);
}
```

- [ ] **Step 3: Add styles (calm, dark, reduced-motion aware)**

```css
:root { color-scheme: dark; --ink: #e8e6e1; --paper: #0c0c10; --gold: #c9a35b; --rule: #2a2a30; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--paper); color: var(--ink); font: 16px/1.6 system-ui, sans-serif; max-width: 60ch; margin-inline: auto; padding: 1rem; }
.skip { position: absolute; left: -999px; }
.skip:focus { left: 1rem; top: 1rem; background: var(--gold); color: #000; padding: .5rem; }
nav { display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
button { font: inherit; cursor: pointer; border: 1px solid var(--rule); background: transparent; color: var(--ink); padding: .5rem .8rem; border-radius: 8px; }
button[aria-current="page"] { border-color: var(--gold); color: var(--gold); }
.save { border-color: var(--gold); color: var(--gold); }
textarea { width: 100%; background: #111; color: var(--ink); border: 1px solid var(--rule); border-radius: 8px; padding: .6rem; }
.list, .vis { list-style: none; padding: 0; display: grid; gap: .5rem; margin: 1rem 0; }
.prompt, .vis-opt { text-align: left; }
h1 { font-size: 1.6rem; }
.lede { color: #a9a6a0; }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
```

- [ ] **Step 4: Verify prep renders** (open `index.html` via `bun x serve` or any static server; manually confirm prompt buttons populate textarea and intention saves to localStorage).

- [ ] **Step 5: Commit**

```bash
git add src/prep.js index.html styles.css
git commit -m "feat: preparation view (intentions + visualizations)"
```

---

### Task 4: Integration view (check-in tracker + decision ledger)

**Files:**
- Create: `src/integration.js`
- Modify: `index.html` (already has `#integrate`)

**Interfaces:**
- Consumes: `load`, `save`, `clear` from `src/storage.js`; `dueForReview`, `addOutcome` from `src/ledger.js`
- Produces: Integrate UI mounted into `#integrate`.

- [ ] **Step 1: Implement `src/integration.js`**

```js
import { load, save } from "./storage.js";
import { dueForReview, addOutcome } from "./ledger.js";

const GENTLE_QUESTIONS = [
  "What surprised you?",
  "What feels different now than right after?",
  "What would you rather not decide yet?",
];

export function mountIntegrate(root) {
  root.innerHTML = `
    <h1 id="int-h">After</h1>
    <p class="lede">Optional, pull-only. Nothing schedules a notification.</p>
    <form id="check-form" aria-label="Check-in">
      <label for="mood">Where you are (0–10, your own scale)</label>
      <input id="mood" type="range" min="0" max="10" value="5" />
      <label for="note">An insight or feeling</label>
      <textarea id="note" rows="3" placeholder="Optional"></textarea>
      <button type="submit" class="save">Save check-in</button>
    </form>
    <ul id="check-list" class="list" aria-live="polite"></ul>

    <h2>Decision ledger</h2>
    <form id="ledger-form" aria-label="Decision">
      <label for="decision">A decision you made</label>
      <textarea id="decision" rows="2" placeholder="In your own words"></textarea>
      <label for="certainty">How certain it felt (1–10)</label>
      <input id="certainty" type="range" min="1" max="10" value="5" />
      <label for="review">Look at it again on</label>
      <input id="review" type="date" />
      <button type="submit" class="save">Write it down</button>
    </form>
    <div id="due" aria-live="polite"></div>
    <ul id="ledger-list" class="list"></ul>
  `;

  const checkForm = root.querySelector("#check-form");
  const checkList = root.querySelector("#check-list");
  checkForm.onsubmit = async (e) => {
    e.preventDefault();
    const note = root.querySelector("#note").value.trim();
    const mood = Number(root.querySelector("#mood").value);
    const checkins = (await load("ps-checkins")) ?? [];
    checkins.unshift({ id: crypto.randomUUID(), mood, note, createdAt: new Date().toISOString() });
    await save("ps-checkins", checkins);
    root.querySelector("#note").value = "";
    renderCheckins(checkList, checkins);
  };

  const ledgerForm = root.querySelector("#ledger-form");
  const ledgerList = root.querySelector("#ledger-list");
  ledgerForm.onsubmit = async (e) => {
    e.preventDefault();
    const decision = root.querySelector("#decision").value.trim();
    if (!decision) return;
    const d = new Date();
    d.setDate(d.getDate() + 14);
    const reviewAt = (root.querySelector("#review").value || d.toISOString().slice(0, 10));
    const iso = new Date(reviewAt + "T12:00:00").toISOString();
    const ledger = (await load("ps-ledger")) ?? [];
    ledger.unshift({ id: crypto.randomUUID(), decision, certainty: Number(root.querySelector("#certainty").value), decidedAt: new Date().toISOString(), reviewAt: iso });
    await save("ps-ledger", ledger);
    root.querySelector("#decision").value = "";
    renderLedger(root, ledger);
  };

  load("ps-checkins").then((c) => renderCheckins(checkList, c ?? []));
  load("ps-ledger").then((l) => renderLedger(root, l ?? []));
}

function renderCheckins(el, items) {
  el.innerHTML = "";
  items.forEach((c) => {
    const li = document.createElement("li");
    li.textContent = `${new Date(c.createdAt).toLocaleDateString()} · ${c.mood}/10 — ${c.note}`;
    el.appendChild(li);
  });
}

function renderLedger(root, ledger) {
  const dueEl = root.querySelector("#due");
  const listEl = root.querySelector("#ledger-list");
  const due = dueForReview(ledger);
  dueEl.innerHTML = due.length
    ? `<p class="due">Ready when you are (${due.length}): ${GENTLE_QUESTIONS[due.length % GENTLE_QUESTIONS.length]}</p>`
    : "";
  listEl.innerHTML = "";
  ledger.forEach((e) => {
    const li = document.createElement("li");
    li.innerHTML = `<p>${e.decision} — felt ${e.certainty}/10</p>`;
    if (!e.outcome) {
      ["holds", "dropped", "refined"].forEach((o) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = o === "holds" ? "Still holds" : o === "dropped" ? "Let it go" : "Changed shape";
        b.onclick = async () => {
          const next = addOutcome(e, o, o === "refined" ? "Changed shape" : undefined);
          const all = (await load("ps-ledger")) ?? [];
          await save("ps-ledger", all.map((x) => (x.id === e.id ? next : x)));
          renderLedger(root, all.map((x) => (x.id === e.id ? next : x)));
        };
        li.appendChild(b);
      });
    } else {
      const p = document.createElement("p");
      p.textContent = `→ ${e.outcome}`;
      li.appendChild(p);
    }
    listEl.appendChild(li);
  });
}
```

- [ ] **Step 2: Add app shell wiring (`src/app.js`)**

```js
import { mountPrep } from "./prep.js";
import { mountIntegrate } from "./integration.js";
import { wipe } from "./storage.js";

const sections = { prep: document.getElementById("prep"), integrate: document.getElementById("integrate") };
mountPrep(sections.prep);
mountIntegrate(sections.integrate);

document.querySelectorAll("nav button[data-view]").forEach((b) => {
  b.onclick = () => {
    const view = b.dataset.view;
    document.querySelectorAll("nav button[data-view]").forEach((x) => x.removeAttribute("aria-current"));
    b.setAttribute("aria-current", "page");
    sections.prep.hidden = view !== "prep";
    sections.integrate.hidden = view !== "integrate";
  };
});

document.getElementById("wipe").onclick = async () => {
  if (!confirm("Delete all intentions, check-ins, and decisions from this device? Cannot be undone.")) return;
  await wipe();
  location.reload();
};
```

- [ ] **Step 3: Run full tests**

Run: `bun test`
Expected: PASS (storage + ledger).

- [ ] **Step 4: Manual smoke** (serve directory; confirm integration view saves check-ins and ledger entries, due entries show gentle question, wipe clears all).

- [ ] **Step 5: Commit**

```bash
git add src/integration.js src/app.js
git commit -m "feat: integration view (check-ins + decision ledger)"
```

---

### Task 5: Final verify + serve

- [ ] **Step 1: Run tests**

Run: `bun test`
Expected: all pass.

- [ ] **Step 2: Serve statically and open**

Run: `cd /var/home/ansimistrator/Documents/PSYCHEDELICRESEARCH/psychedelic-sessions && bun x --bun serve .` (or any static server)
Expected: app loads, both views work, wipe clears data.

- [ ] **Step 3: Commit nothing new; tag status**

(No code changes; this is verification only.)
