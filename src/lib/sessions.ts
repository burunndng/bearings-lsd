/* ============================================================
   Bearings — Session inference (pure functions, no storage I/O)

   Sessions are INFERRED, not declared. Nobody clicks "start a
   session" and nobody clicks "end" one — that would ask a person
   to administer their own record-keeping at the exact moments
   (right before, hours after) when that is the least reasonable
   thing to ask. Instead: notes that land close together in time
   are treated as one session, full stop.

   A Session record (src/lib/storage.ts) exists only to carry a
   held question. It is matched to whichever cluster of notes
   started near when the question was written — matching is
   forgiving on purpose, because a missed match (question shown
   with the wrong cluster, or not shown at all) is a much smaller
   harm than a system that visibly gets confused about "sessions"
   in front of someone reading their own history.
   ============================================================ */

import type { LedgerEntry, Note, Session } from "./storage.ts";

/** Notes more than this far apart start a new inferred session.
    96 hours is deliberately wide: the interview stage alone runs
    to 4 days, and a same-session note written on day 3 should not
    accidentally spawn a second "session" next to the first. */
export const SESSION_GAP_MS = 96 * 60 * 60 * 1000;

/** How long each stage of the session flow stays current, measured
    from the first note in the cluster. Advisory only — SessionTracker
    always lets a person pick a different stage by hand; these are
    what it opens to by default. */
export const RAW_WINDOW_MS = 18 * 60 * 60 * 1000; // first ~18 hours
export const INTERVIEW_WINDOW_MS = 4 * 24 * 60 * 60 * 1000; // days 1–4

export type SessionStage = "raw" | "interview" | "integration";

export interface InferredSession {
  /** Stable across reloads: the matched Session's id if one exists,
      else the id of the cluster's first note. Either way this does
      not change as more notes are added to the same cluster. */
  id: string;
  startedAt: string;
  endedAt: string;
  notes: Note[];
  question?: string;
}

/** Groups notes into sessions by time proximity, then attaches a
    held question to whichever cluster started nearest to when that
    question was written. Clusters are returned oldest first, and
    each cluster's notes are in chronological order (they are built
    from the chronologically sorted copy below) — so notes[0] is
    always a session's oldest note, which is what SessionTracker's
    tag carrier relies on. */
export function inferSessions(
  notes: Note[],
  sessions: Session[],
): InferredSession[] {
  if (notes.length === 0) return [];

  const chronological = [...notes].sort(
    (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt),
  );

  const clusters: Note[][] = [];
  let current: Note[] = [chronological[0]];
  for (let i = 1; i < chronological.length; i++) {
    const gap =
      +new Date(chronological[i].createdAt) -
      +new Date(current[current.length - 1].createdAt);
    if (gap > SESSION_GAP_MS) {
      clusters.push(current);
      current = [chronological[i]];
    } else {
      current.push(chronological[i]);
    }
  }
  clusters.push(current);

  const byId = new Map(sessions.map((s) => [s.id, s]));
  const claimedClusters = new Set<number>();
  const claimedSessions = new Set<string>();
  const matched = new Map<number, Session>();

  /* Pass 1 — explicit links. A note written through the session flow
     records the id of the question it was written against, and that
     stated fact outranks any guess made from timestamps. Without this
     pass the sessionId field was dead data: a note written five days
     after the question was saved fell outside SESSION_GAP_MS and
     orphaned into its own cluster, leaving the question unmatched
     forever while its own answers sat next to it unattached. */
  clusters.forEach((cluster, idx) => {
    for (const note of cluster) {
      if (!note.sessionId) continue;
      const session = byId.get(note.sessionId);
      if (!session || claimedSessions.has(session.id)) continue;
      matched.set(idx, session);
      claimedClusters.add(idx);
      claimedSessions.add(session.id);
      break;
    }
  });

  /* Pass 2 — time proximity, for questions never written against and
     clusters with no stated link (ordinary Journal or card notes that
     happen to sit near a question). Sorting candidates by distance
     before assigning stops two questions both drifting onto the same
     cluster while a closer, unclaimed cluster sits next to them.
     claimedSessions is checked as well as claimedClusters: tracking
     only clusters let a single question be attached to several. */
  const candidates = sessions
    .filter((s) => !claimedSessions.has(s.id))
    .flatMap((s) =>
      clusters.map((cluster, idx) => ({
        session: s,
        idx,
        distance: Math.abs(
          +new Date(s.createdAt) - +new Date(cluster[0].createdAt),
        ),
      })),
    )
    .filter((c) => !claimedClusters.has(c.idx) && c.distance <= SESSION_GAP_MS)
    .sort((a, b) => a.distance - b.distance);

  for (const c of candidates) {
    if (claimedClusters.has(c.idx) || claimedSessions.has(c.session.id)) {
      continue;
    }
    matched.set(c.idx, c.session);
    claimedClusters.add(c.idx);
    claimedSessions.add(c.session.id);
  }

  return clusters.map((cluster, idx) => {
    const session = matched.get(idx);
    return {
      id: session?.id ?? cluster[0].id,
      startedAt: cluster[0].createdAt,
      endedAt: cluster[cluster.length - 1].createdAt,
      notes: cluster,
      question: session?.question,
    };
  });
}

/** Questions that exist but have no notes attached to them yet,
    newest first.

    Sessions are inferred from notes, so a question saved before an
    experience matches nothing until the first note is written — which
    meant it rendered nowhere at all. Someone who sharpened a question
    on Tuesday and opened this page on Wednesday to reread it found it
    gone. This is the list that fixes that: it is derived by asking
    which Session records inferSessions did NOT account for, rather
    than by re-implementing the matching rules, so the two can never
    disagree about what "unmatched" means. */
export function pendingQuestions(
  notes: Note[],
  sessions: Session[],
): Session[] {
  const accounted = new Set(
    inferSessions(notes, sessions)
      .map((s) => s.id)
      .filter((id) => sessions.some((session) => session.id === id)),
  );
  return sessions
    .filter((s) => !accounted.has(s.id))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

/** Which stage a session opens to by default, given when it
    started. Always overridable in the UI — this is a starting
    point, not a gate. */
export function defaultStage(startedAt: string): SessionStage {
  const elapsed = Date.now() - +new Date(startedAt);
  if (elapsed <= RAW_WINDOW_MS) return "raw";
  if (elapsed <= INTERVIEW_WINDOW_MS) return "interview";
  return "integration";
}

/** How long an inferred session stays eligible for the capture UI
    (raw / interview / integration) before it is read as history
    instead. `defaultStage` alone cannot mark a session "over" —
    "integration" is its own terminal state with no exit — so this
    is the boundary SessionTracker uses to decide which single
    session, if any, gets the active treatment. Wider than
    INTERVIEW_WINDOW_MS on purpose: someone may want to add a late
    integration note or a tag weeks out. Does not affect whether
    older notes can still be read — only which session is offered
    the capture UI by default. */
export const OPEN_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function isOpen(
  session: InferredSession,
  now: number = Date.now(),
): boolean {
  return now - +new Date(session.startedAt) <= OPEN_WINDOW_MS;
}

/** The four questions asked in the interview stage (days 1–4).
    Fixed order, fixed wording — these are asked the same way every
    time on purpose, the way a good interviewer has a small set of
    questions they trust rather than improvising each time. */
export const INTERVIEW_PROMPTS: { id: string; text: string }[] = [
  { id: "surprised", text: "What surprised you?" },
  { id: "avoided", text: "What did you move away from, or avoid?" },
  {
    id: "already-knew",
    text: "What did you already know, but felt differently this time?",
  },
  { id: "stayed", text: "What was still there once the effects were gone?" },
];

/** Entries whose review date has passed and have not yet been
    marked with an outcome — the only thing CoolingLedger surfaces
    as "due". Pull-only: nothing schedules a notification for these,
    they just wait here until the page is opened. */
export function dueForReview(entries: LedgerEntry[]): LedgerEntry[] {
  const now = Date.now();
  return entries.filter((e) => !e.outcome && +new Date(e.reviewAt) <= now);
}

/** Tags used in more than one inferred session, with a count. Pure
    recognition, no clustering or inferred meaning: a person wrote
    the same word on two different occasions, and this says so. */
export function recurringTags(
  sessions: InferredSession[],
): { tag: string; count: number }[] {
  const perTagSessions = new Map<string, Set<string>>();
  for (const session of sessions) {
    const tagsInSession = new Set<string>();
    for (const note of session.notes) {
      for (const tag of note.tags ?? []) tagsInSession.add(tag);
    }
    for (const tag of tagsInSession) {
      if (!perTagSessions.has(tag)) perTagSessions.set(tag, new Set());
      perTagSessions.get(tag)!.add(session.id);
    }
  }
  return [...perTagSessions.entries()]
    .map(([tag, ids]) => ({ tag, count: ids.size }))
    .filter((t) => t.count > 1)
    .sort((a, b) => b.count - a.count);
}
