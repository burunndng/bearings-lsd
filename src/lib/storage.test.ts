import { test, expect } from "bun:test";
import {
  createStore,
  memoryBacking,
  IDB_KEYS,
  LS_KEYS,
  type StoreKey,
} from "./storage.ts";

/* What is and is not tested here: memoryBacking stands in for the real
   stores, so these run without a browser, without Svelte, without a
   mounted component — which is the whole reason the seam exists. The
   prod backing's StorageError normalization (private-mode / quota
   failures) is a thin wrapper over idb-keyval and localStorage and is
   not exercised here; call sites' existing catch blocks cover it at
   runtime, and it could be stressed later by mocking localStorage. */

test("load of an unset key is undefined", async () => {
  const store = createStore(memoryBacking());
  expect(await store.load("bearings-notes")).toBeUndefined();
});

test("save then load round-trips a value", async () => {
  const store = createStore(memoryBacking());
  await store.save("bearings-notes", [{ id: "a", body: "x", createdAt: "t" }]);
  expect(await store.load("bearings-notes")).toEqual([
    { id: "a", body: "x", createdAt: "t" },
  ]);
});

test("a returned value is cloned — mutating it cannot leak into the store", async () => {
  const store = createStore(memoryBacking());
  await store.save("bearings-ledger", [
    { id: "a", decision: "x", certainty: 5, decidedAt: "t", reviewAt: "t" },
  ]);
  const got = await store.load("bearings-ledger");
  got![0].decision = "tampered";
  expect((await store.load("bearings-ledger"))![0].decision).toBe("x");
});

test("clear empties one key without touching the others", async () => {
  const store = createStore(memoryBacking());
  await store.save("bearings-notes", [{ id: "a", body: "x", createdAt: "t" }]);
  await store.save("bearings-anchor", { question: "q", readings: [] });
  await store.clear("bearings-notes");
  expect(await store.load("bearings-notes")).toBeUndefined();
  expect(await store.load("bearings-anchor")).toEqual({
    question: "q",
    readings: [],
  });
});

/* THE privacy-promise test. Before this deepening, "delete everything on
   this device" iterated two arrays inside Settings and was impossible to
   verify without driving the UI. Now it is one function over one
   registry, and this asserts it leaves nothing behind in either store. */
test("wipe clears every registered key in both stores", async () => {
  const store = createStore(memoryBacking());
  await store.save("bearings-notes", [{ id: "a", body: "x", createdAt: "t" }]);
  await store.save("bearings-anchor", { question: "q", readings: [] });
  await store.save("bearings-sessions", [
    { id: "a", question: "q", createdAt: "t" },
  ]);
  await store.save("bearings-ledger", [
    { id: "a", decision: "x", certainty: 5, decidedAt: "t", reviewAt: "t" },
  ]);
  await store.save("bearings-theme", "dark");
  await store.save("bearings-motion", "reduce");
  await store.save("bearings-reminders", "x");

  await store.wipe();

  for (const key of [...IDB_KEYS, ...LS_KEYS] as StoreKey[]) {
    expect(await store.load(key)).toBeUndefined();
  }
});

test("a throwing backing rejects — errors are not swallowed", async () => {
  const throwing = {
    get: async () => {
      throw new Error("boom");
    },
    set: async () => {
      throw new Error("boom");
    },
    del: async () => {
      throw new Error("boom");
    },
  };
  const store = createStore(throwing);
  expect(store.load("bearings-notes")).rejects.toThrow("boom");
});
