// seed.ts — the SyntheticConnector. ONE job: pre-load ONE demo user with a
// believable 7-day OBJECTIVE record that IS the demo's counter-evidence — the
// facts the mirror reflects a subjective spiral against ("you feel everyone
// pulled away; the record shows your friends reached out 19 times this week").
//
// PORT-MEMORY-DB §5: "Synthetic seeding is the actual product risk, not the
// schema." This is where the demo-path polish goes. SCOPE-LOCK: say synthetic
// out loud — every row is source='synthetic'.
//
// Idempotent: every row has a STABLE id (`seed_<demoUser>_<n>`), so re-running
// seedDemoUser() overwrites in place and never duplicates. The window is anchored
// to a FIXED SEED_NOW so countEvents(...) is reproducible regardless of when the
// seed runs — the gate must print the same numbers every time.
//
// This is the `Connector { name; pull(userId, window) → Event[] }` chokepoint
// (PORT-MEMORY-DB §4): a real iMessage/Calendar connector implements the same
// shape later; the reflect step only ever reads `events`, never the source.

import type { Event } from './types.js';
import { store } from './store.js';

// ── Editable demo consts (tune the story here; the skeleton runs regardless) ──
// Leave COPY in clearly-marked consts so Johnny tunes content after it runs.

/** The one demo user. */
export const DEMO_USER_ID = 'demo';
export const DEMO_USER_NAME = 'Demo Patient';

/**
 * The anchor "now" for the seeded week. FIXED so the 7-day window is
 * deterministic — day 0 of the demo. (A Sunday; "Tuesday" below is SEED_NOW-5d.)
 */
export const SEED_NOW = '2026-06-13T18:00:00.000Z';

/** Friends who reach out (so labels read like real texts). */
const FRIENDS = ['Sam', 'Maya', 'Priya', 'Jordan', 'Leah', 'Theo'] as const;

// The counter-evidence shape, named so the gate can assert against it.
export const SEED_COUNTS = {
  messageReceived: 48, // ~47-50 texts received across the week
  initiatedByFriend: 19, // "who reached out" — friends
  initiatedByYou: 12, // "who reached out" — you
  call: 7,
  inPerson: 1, // the Tuesday (saw two friends)
  coworkerThanks: 1,
  physicalSymptom: 3, // chest tight / racing heart
} as const;

// ── Deterministic helpers (no RNG, no implicit Date.now) ──────────────────────

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const SEED_NOW_MS = Date.parse(SEED_NOW);

/** A timestamp `daysAgo` days + `hour` (UTC) back from SEED_NOW, as ISO. */
function at(daysAgo: number, hour: number): string {
  // Floor SEED_NOW to its day, step back daysAgo, set the hour-of-day.
  const dayStart = Math.floor(SEED_NOW_MS / DAY_MS) * DAY_MS;
  return new Date(dayStart - daysAgo * DAY_MS + hour * HOUR_MS).toISOString();
}

// ── The connector ─────────────────────────────────────────────────────────────

/**
 * SyntheticConnector — emits the pre-seeded week. Implements the data-ingest
 * chokepoint shape. `name` becomes events.source.
 */
class SyntheticConnector {
  readonly name = 'synthetic' as const;

  /** Build the full week of events (pure — same input → same rows). */
  build(userId: string): Event[] {
    const rows: Event[] = [];
    let n = 0;
    const push = (e: Omit<Event, 'id' | 'userId' | 'source'>): void => {
      rows.push({
        id: `seed_${userId}_${n++}`,
        userId,
        source: this.name,
        ...e,
      });
    };

    // 48 texts received, spread Sun..Sat with a believable daily rhythm.
    // Per-day counts sum to 48; the heavier days are mid-week.
    const perDay = [5, 8, 9, 7, 8, 6, 5]; // index 0 = 6 days ago ... 6 = today
    for (let d = 0; d < perDay.length; d++) {
      const daysAgo = 6 - d;
      const count = perDay[d] ?? 0;
      for (let i = 0; i < count; i++) {
        const friend = FRIENDS[(d + i) % FRIENDS.length] ?? 'a friend';
        push({
          kind: 'message_received',
          label: `text from ${friend}`,
          ts: at(daysAgo, 8 + ((i * 2) % 12)), // 08:00–20:00 spread
        });
      }
    }

    // Who reached out: 19 friend-initiated vs 12 you-initiated conversations.
    for (let i = 0; i < SEED_COUNTS.initiatedByFriend; i++) {
      const friend = FRIENDS[i % FRIENDS.length] ?? 'a friend';
      push({
        kind: 'conversation_initiated',
        label: `${friend} reached out`,
        value: 'friend',
        ts: at(6 - (i % 7), 9 + (i % 10)),
      });
    }
    for (let i = 0; i < SEED_COUNTS.initiatedByYou; i++) {
      push({
        kind: 'conversation_initiated',
        label: 'you reached out',
        value: 'you',
        ts: at(6 - (i % 7), 10 + (i % 9)),
      });
    }

    // 7 calls across the week.
    for (let i = 0; i < SEED_COUNTS.call; i++) {
      const friend = FRIENDS[i % FRIENDS.length] ?? 'a friend';
      push({
        kind: 'call',
        label: `call with ${friend}`,
        value: 1,
        ts: at(6 - i, 19),
      });
    }

    // The Tuesday in-person (SEED_NOW is a Sunday → Tuesday = 5 days ago).
    push({
      kind: 'in_person',
      label: 'saw Maya and Priya in person',
      value: 2,
      ts: at(5, 13),
    });

    // One coworker thanks (an objective positive the spiral overlooks).
    push({
      kind: 'coworker_thanks',
      label: 'a coworker thanked you for your help',
      ts: at(3, 16),
    });

    // 3 logged physical symptoms (chest tight / racing heart).
    const symptoms = ['chest tight', 'racing heart', 'chest tight'];
    for (let i = 0; i < SEED_COUNTS.physicalSymptom; i++) {
      push({
        kind: 'physical_symptom',
        label: symptoms[i] ?? 'racing heart',
        ts: at(i * 2, 22),
      });
    }

    return rows;
  }

  /** The connector contract: pull the seeded events for a user. */
  pull(userId: string): Event[] {
    return this.build(userId);
  }
}

export const syntheticConnector = new SyntheticConnector();

/**
 * Seed (or re-seed, idempotently) the one demo user + the week of events.
 * Stable ids mean re-running overwrites in place — no duplicates. Returns the
 * userId so callers can chain straight into the store.
 */
export function seedDemoUser(): { userId: string } {
  if (!store.getUser(DEMO_USER_ID)) {
    store.createUser({ id: DEMO_USER_ID, name: DEMO_USER_NAME, createdAt: at(7, 0) });
  }
  for (const e of syntheticConnector.pull(DEMO_USER_ID)) {
    // addEvent keys on the stable id; re-seeding replaces, never appends.
    store.addEvent(e);
  }
  return { userId: DEMO_USER_ID };
}
