// seed.ts — the SyntheticConnector. ONE job: pre-load ONE demo user with the
// ANXIETY-HERO objective record (docs/sample-story.json) — the facts the mirror
// reflects the subjective minimization against ("you tell people you're 'lowkey
// chilling'; the record shows a panic attack after every club event for 6 days").
//
// LOCKED HERO (ADVISEMENT-2 / GOAL §1.5 #4): the 10 events[] below are copied
// VERBATIM from docs/sample-story.json::events[] (kind/label/value/severity/source/
// ts) so the objective record + the connect-the-dots pattern + the provider counts
// all match the hero exactly: 6 panic_attack · 2 self_harm · 2 sleep_hours · 1
// ideation. (The old social/loneliness seed — 48 message_received etc. — was a
// DIFFERENT story and has been removed.)
//
// PORT-MEMORY-DB §5: "Synthetic seeding is the actual product risk, not the
// schema." SCOPE-LOCK: say synthetic out loud — every row is source='synthetic'.
//
// Idempotent: every row has a STABLE id (`seed_<demoUser>_<n>`), so re-running
// seedDemoUser() overwrites in place and never duplicates. The window is anchored
// to a FIXED SEED_NOW (the hero's week, Sat 6/13) so a 7-day read includes every
// seeded event (6/8 → 6/13) reproducibly — the gate must print the same numbers
// every time.
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
 * The anchor "now" for the seeded week. FIXED so the 7-day window is deterministic.
 * The anxiety hero's events span Mon 6/8 → Sat 6/13; SEED_NOW is the evening of
 * Sat 6/13, so every seeded event falls inside a 7-day read back from here.
 */
export const SEED_NOW = '2026-06-13T18:00:00.000Z';

// ── The anxiety-hero objective record (VERBATIM from sample-story.json::events) ─
// One row per logged behavioral event. `severity` is carried as an extra field on
// the seed rows that have it (panic_attack 8–9/10) — the Event type's `value`
// holds the count (1 per occurrence); severity rides alongside for the provider
// report / connect-the-dots. kind is OPEN vocabulary (no SQL enum).
type SeedEvent = Omit<Event, 'id' | 'userId' | 'source'> & { severity?: number };

/** The 10 hero events — copied field-for-field from docs/sample-story.json. */
export const HERO_EVENTS: SeedEvent[] = [
  { kind: 'panic_attack', label: 'after Mon club event — chest pain, couldn\'t breathe', value: 1, severity: 8, ts: '2026-06-08T19:30:00' },
  { kind: 'sleep_hours', label: 'couldn\'t wind down, lay awake replaying the meeting', value: 5, ts: '2026-06-09T01:30:00' },
  { kind: 'panic_attack', label: 'after Tue club event — vision went blurry', value: 1, severity: 8, ts: '2026-06-09T20:00:00' },
  { kind: 'panic_attack', label: 'after Wed club event — scratched arms to stay calm', value: 1, severity: 9, ts: '2026-06-10T18:45:00' },
  { kind: 'self_harm', label: 'scratching arms to self-calm during meeting', value: 1, ts: '2026-06-10T18:50:00' },
  { kind: 'sleep_hours', label: 'exhausted but restless, \'can\'t stop moving\'', value: 4, ts: '2026-06-11T02:00:00' },
  { kind: 'panic_attack', label: 'after Thu club event — worst chest pain yet', value: 1, severity: 9, ts: '2026-06-11T21:00:00' },
  { kind: 'panic_attack', label: 'after Fri club event — couldn\'t concentrate, scratched again', value: 1, severity: 8, ts: '2026-06-12T19:15:00' },
  { kind: 'self_harm', label: 'scratching arms to self-calm during meeting', value: 1, ts: '2026-06-12T19:20:00' },
  { kind: 'ideation', label: '\'all I want to do is sleep forever\' written in journal', value: 1, ts: '2026-06-13T00:40:00' },
];

// The counter-evidence shape, named so the gate can assert against it. Matches the
// stat_sheet{} in sample-story.json.
export const SEED_COUNTS = {
  panicAttack: 6,
  selfHarm: 2,
  sleepUnder6h: 2, // both seeded sleep_hours rows are < 6h (5h, 4h)
  ideation: 1,
} as const;

// ── The connector ─────────────────────────────────────────────────────────────

/**
 * SyntheticConnector — emits the pre-seeded anxiety-hero week. Implements the
 * data-ingest chokepoint shape. `name` becomes events.source.
 */
class SyntheticConnector {
  readonly name = 'synthetic' as const;

  /** Build the hero week of events (pure — same input → same rows, stable ids). */
  build(userId: string): Event[] {
    return HERO_EVENTS.map((e, n) => {
      const row: Event = {
        id: `seed_${userId}_${n}`,
        userId,
        kind: e.kind,
        label: e.label,
        value: e.value,
        source: this.name,
        ts: e.ts,
      };
      return row;
    });
  }

  /** The connector contract: pull the seeded events for a user. */
  pull(userId: string): Event[] {
    return this.build(userId);
  }
}

export const syntheticConnector = new SyntheticConnector();

/** The earliest seeded event's ts, used to anchor the demo user's createdAt. */
const FIRST_EVENT_TS = HERO_EVENTS.reduce(
  (min, e) => (e.ts < min ? e.ts : min),
  HERO_EVENTS[0]?.ts ?? SEED_NOW,
);

/**
 * Seed (or re-seed, idempotently) the one demo user + the hero week of events.
 * Stable ids mean re-running overwrites in place — no duplicates. Returns the
 * userId so callers can chain straight into the store.
 */
export function seedDemoUser(): { userId: string } {
  if (!store.getUser(DEMO_USER_ID)) {
    store.createUser({ id: DEMO_USER_ID, name: DEMO_USER_NAME, createdAt: FIRST_EVENT_TS });
  }
  for (const e of syntheticConnector.pull(DEMO_USER_ID)) {
    // addEvent keys on the stable id; re-seeding replaces, never appends.
    store.addEvent(e);
  }
  return { userId: DEMO_USER_ID };
}
