/* ============================================================
   Bearings — Storage registry (single source of truth)

   "Delete everything on this device" (Settings.svelte) must clear
   every key this app writes, or the privacy promise is a lie. This
   file is the only place a storage key is allowed to be introduced.
   Any component that persists something imports its key from here and
   reaches the store ONLY through load / save / clear / wipe below —
   never by calling idb-keyval or localStorage itself. The one exception
   is BaseLayout's paint-time theme read, which runs inline before any
   module can load, to avoid a flash. wipe() iterates both registries,
   so the privacy promise is structural: a key not registered here is a
   compile error, not a silent gap discovered at delete time.

   IDB_KEYS: idb-keyval keys (notes, the baseline anchor — larger or
   structured data).
   LS_KEYS: localStorage keys (small preference flags).
   ============================================================ */

import { del as idbDel, get as idbGet, set as idbSet } from "idb-keyval";

export const IDB_KEYS = [
  "bearings-notes",
  "bearings-anchor",
  "bearings-sessions",
  "bearings-ledger",
  "bearings-readings",
] as const;
export const LS_KEYS = [
  "bearings-theme",
  "bearings-motion",
  "bearings-reminders",
] as const;

export type IdbKey = (typeof IDB_KEYS)[number];
export type LsKey = (typeof LS_KEYS)[number];

/* ------------------------------------------------------------
   Shapes of what those keys hold.

   These live here, next to the keys, because they had already
   drifted once: CardNote.svelte declared its own Note without
   revisitLabel, so a note written from a card silently could not
   carry the label the Journal offered. Three components now read
   bearings-notes (Journal, CardNote, Settings' export), and an
   export that misses a field drops user content without saying so
   — the same class of quiet data loss. One declaration, imported
   everywhere, makes adding a field a visible change at every
   reader instead of a silent omission at one.
   ------------------------------------------------------------ */

/** A single note in `bearings-notes`. All optional fields are
    additive: notes stored before a field existed still parse. */
export interface Note {
  id: string;
  body: string;
  createdAt: string;
  /** links a note to the card it was written from (CardNote).
      Absent for notes written directly in the Journal. */
  cardId?: string;
  /** a self-chosen label like "+3 days" — descriptive of intent,
      never a scheduled reminder and never a streak. */
  revisitLabel?: string;
  /** links a note to a Session record (SessionTracker). Sessions
      are otherwise inferred purely from timing — this is only
      present when the note was written through the session flow,
      which is how a held question gets attached to the notes that
      came from holding it. */
  sessionId?: string;
  /** which part of the session flow this note came from. Absent
      for ordinary Journal/CardNote entries — this only exists on
      notes written through SessionTracker. */
  stage?: "raw" | "interview" | "integration";
  /** which interview question this answers, if stage is
      "interview" — lets the UI show the question next to the
      answer without storing the question text on every note. */
  promptId?: string;
  /** user-authored labels, own words, own spelling. The basis for
      a future recurrence view (deferred: needs data to exist
      before it means anything) — not acted on by anything yet. */
  tags?: string[];
}

/** A held question, written through the sharpener in SessionTracker.
    Deliberately thin: the question is the only thing that needs to
    outlive the notes clustered near it. Everything else about "a
    session" — its notes, its span, its stage — is inferred fresh
    each time from note timestamps, not stored here, so there is
    nothing to keep in sync. */
export interface Session {
  id: string;
  question: string;
  createdAt: string;
}

/** One entry in the cooling-off ledger (`bearings-ledger`): a
    decision made at a stated certainty, held until a self-chosen
    date, then marked against what actually happened. Pull-only —
    nothing schedules a notification; it surfaces only when this
    page is opened, which is a real limitation stated in the UI,
    not hidden by it. */
export interface LedgerEntry {
  id: string;
  decision: string;
  /** 1–10, self-defined, same posture as the Anchor's scale. */
  certainty: number;
  decidedAt: string;
  /** self-chosen review date; not a scheduled prompt. */
  reviewAt: string;
  outcome?: "holds" | "dropped" | "refined";
  /** free text, only meaningful when outcome is "refined". */
  refinement?: string;
  reviewedAt?: string;
}

/** One dated marker in `bearings-anchor`. Deliberately not a score:
    the scale's meaning is defined by the person, not by us. */
export interface Reading {
  value: number;
  at: string;
}

/** `bearings-anchor`: one self-authored question and its readings. */
export interface AnchorData {
  question: string;
  readings: Reading[];
}

/** One section of a strategy reading. The five sections (audit, tension,
    lens, check, return) are always present in the same order — this is
    stable layout, not dynamic content. */
export interface StrategistSection {
  id: "audit" | "tension" | "lens" | "check" | "return";
  title: string;
  body: string;
  quiet: boolean;
}

/** One strategy reading in `bearings-readings`. A deterministic,
    on-device reflection: the user's own words, fixed questions, and
    things to check on — never interpreted, never generated. */
export interface StrategistReading {
  id: string;
  createdAt: string;
  sections: StrategistSection[];
}

/* ============================================================
   Bearings — Store access (the deep module)

   The registries above are the only place a key exists; the functions
   below are the only way to touch one. Five components used to each
   import idb-keyval and re-implement load, persist, ready, and error-
   handling — the bugs hid in how each catch differed. Those concerns
   now live here, behind four functions: load, save, clear, wipe.

   wipe() is the privacy promise made into code. "Delete everything on
   this device" calls it; it clears every registered key in both stores,
   and a key not registered here cannot be written in the first place —
   so there is no second list to fall out of sync.

   The interface is the test surface. Prod routes each key to idb-keyval
   or localStorage by registry; tests build a store over memoryBacking()
   and assert against that, without a browser, without Svelte, without a
   mounted component. Two backings behind one seam is what makes the
   seam real rather than ornamental.

   Contract: load / save / clear / wipe reject ONLY with StorageError.
   Any underlying failure — idb unavailable in private mode, a quota
   hit, localStorage disabled — is normalized here. Callers catch once
   and render their own message; they never see the original throw.
   ============================================================ */

/** The one error the store throws. Callers never see anything else
    from load/save/clear/wipe, so they can catch blindly. */
export class StorageError extends Error {
  constructor(cause: unknown) {
    super("Bearings could not reach its local store.", { cause });
    this.name = "StorageError";
  }
}

/** What a backing store must do. Two ship: the prod router (idb +
    localStorage) and an in-memory one for tests. */
export interface BackingStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  del(key: string): Promise<void>;
}

/* Per-key shapes. Lets load/save carry the value's type at compile
   time — save("bearings-notes", aWrongShape) fails the type check,
   not the user. MUST stay aligned with IDB_KEYS and LS_KEYS: every
   registered key appears here exactly once. */
type KeyShape = {
  "bearings-notes": Note[];
  "bearings-anchor": AnchorData;
  "bearings-sessions": Session[];
  "bearings-ledger": LedgerEntry[];
  "bearings-readings": StrategistReading[];
  "bearings-theme": string;
  "bearings-motion": string;
  "bearings-reminders": string;
};

/** Any registered key. Equal to IdbKey | LsKey, derived in one place. */
export type StoreKey = keyof KeyShape;

const IDB_KEY_SET: ReadonlySet<string> = new Set(IDB_KEYS);

function isIdbKey(key: string): key is IdbKey {
  return IDB_KEY_SET.has(key);
}

/* Runs a backing op and normalizes any throw into StorageError, so the
   contract above holds no matter which store failed. */
async function safe<T>(op: () => Promise<T>): Promise<T> {
  try {
    return await op();
  } catch (e) {
    throw new StorageError(e);
  }
}

/* The prod backing. Routes by registry: structured-clone objects
   (notes, anchor, sessions, ledger) go to idb-keyval; the small string
   preferences go to localStorage. localStorage holds strings — a
   non-string is serialized, so a future change to a preference's shape
   does not silently break reads. */
const prodBacking: BackingStore = {
  get<T>(key: string) {
    return safe(async () => {
      if (isIdbKey(key)) return (await idbGet<T>(key)) as T | undefined;
      return (localStorage.getItem(key) ?? undefined) as T | undefined;
    });
  },
  set<T>(key: string, value: T) {
    return safe(async () => {
      if (isIdbKey(key)) {
        await idbSet(key, value);
        return;
      }
      localStorage.setItem(
        key,
        typeof value === "string" ? value : JSON.stringify(value),
      );
    });
  },
  del(key: string) {
    return safe(async () => {
      if (isIdbKey(key)) {
        await idbDel(key);
        return;
      }
      localStorage.removeItem(key);
    });
  },
};

/** An in-memory backing for tests. Clones on set and on get so a test
    mutating a returned value cannot leak into the store or the next
    assertion. */
export function memoryBacking(): BackingStore {
  const map = new Map<string, unknown>();
  return {
    async get<T>(key: string) {
      if (!map.has(key)) return undefined;
      return structuredClone(map.get(key)) as T;
    },
    async set<T>(key: string, value: T) {
      map.set(key, structuredClone(value));
    },
    async del(key: string) {
      map.delete(key);
    },
  };
}

/** Builds a store over a given backing. Components use the default
    (prod); tests build one over memoryBacking(). The logic under test
    is identical — only the backing swaps. */
export function createStore(backing: BackingStore) {
  return {
    load<K extends StoreKey>(key: K): Promise<KeyShape[K] | undefined> {
      return backing.get<KeyShape[K]>(key);
    },
    save<K extends StoreKey>(key: K, value: KeyShape[K]): Promise<void> {
      return backing.set(key, value);
    },
    clear(key: StoreKey): Promise<void> {
      return backing.del(key);
    },
    /** Clears every registered key in both stores. The function behind
        "Delete everything on this device." */
    async wipe(): Promise<void> {
      await Promise.all(
        ([...IDB_KEYS, ...LS_KEYS] as StoreKey[]).map((k) => backing.del(k)),
      );
    },
  };
}

/* The default store, bound to the prod backing. Any component that
   persists imports these and nothing else from idb-keyval. */
export const { load, save, clear, wipe } = createStore(prodBacking);
