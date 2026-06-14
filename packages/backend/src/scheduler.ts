// scheduler.ts — the REAL check-in timer. ONE job: when a scheduled check-in
// comes due, fire it — ONE Grok call writes DOT's check-in message in her voice,
// grounded in the node she's WATCHING + that user's record, persisted as a 'dot'
// message so it lands in the thread like any other turn.
//
// This is REAL scheduled time, not a button. On close, the intake schedules
// forward CheckIns (a prompt to send later, the node it's watching, why). This
// module is the wall clock that drives them: startScheduler() ticks on an interval
// and fires whatever store.getDueCheckIns(now) returns.
//
// Determinism (CONSTRAINTS): the core (fireDueCheckIns/tick) takes `now` as a
// param and never reads the clock — a test passes a fixed ISO and gets a
// reproducible fire. The ONLY place new Date() is allowed is startScheduler's
// setInterval body: that's the live wall clock, by design, and it's logged each
// tick so the real-time path is observable.
//
// Fail loud (CONSTRAINTS / MEMORY): fireDueCheckIns lets a model error throw —
// no canned fallback message masks a dead Grok path. The interval wrapper catches
// per-tick so one bad tick doesn't kill the timer, and logs it structurally.

import { generateText } from 'ai';
import { reasoningModel } from './grok.js';
import { store } from './store.js';
import { DOT_CHAT_SYSTEM } from './imessage/chat.js';
import type { CheckIn, GraphNode } from './types.js';

// ── The check-in framing (EDITABLE — tune the timer voice here) ───────────────
// A check-in is NOT "are you ok / how are you feeling" comfort-bait (MEMORY: the
// product thesis). It's DOT objectively coming back to the ONE thing she said
// she'd watch — naming it, and asking for the data point that tells the real
// story. Objective without going cold or clinical. This rides ON TOP of
// DOT_CHAT_SYSTEM (her whole personality), so it stays in voice.
export const CHECKIN_INSTRUCTION = `THIS IS A SCHEDULED CHECK-IN, not a fresh reply to something they just said. Earlier you told them you'd circle back on ONE specific thing. The time has come, so you're reaching out first.

Do NOT open with "are you ok?", "how are you feeling?", "just checking in", or any soft comfort-bait. Come back to the SPECIFIC thing you said you'd watch (named in WATCHING / REASON below), name it plainly, and ask for the one concrete data point that tells you how it actually went, the objective beside the felt. One short, warm text. lowercase, no em-dashes, no lists. Sound like a friend who remembered, not a bot running a reminder.`;

// ── Grounding (what DOT reads before she writes the check-in) ─────────────────
// Two things ground the message: the NODE she's watching (pulled from the user's
// graph by the check-in's `watching` id) and that user's RECORD (the stat sheet
// over the recent window + her last reply, so she doesn't repeat herself). Both
// are real store reads — no invented context.

const RECORD_WINDOW_DAYS = 7;

/** Find the watched node in the user's graph (by id). The check-in's `watching`
 *  is a node id / concern; if it resolves we feed DOT the node's name + summary. */
function watchedNode(userId: string, watching: string): GraphNode | undefined {
  return store.getGraph(userId).nodes.find((n) => n.id === watching);
}

/** The grounding block injected into the prompt for ONE check-in: what DOT is
 *  watching + why, the live node if it resolved, and a short objective record so
 *  the ask is concrete (not generic). `now` is injected (determinism). */
function buildCheckInContext(checkin: CheckIn, now: string): string {
  const node = watchedNode(checkin.userId, checkin.watching);
  const stats = store.statSheet(checkin.userId, { sinceDays: RECORD_WINDOW_DAYS, now });

  const lines: string[] = [
    `WATCHING: ${checkin.watching}`,
    `REASON YOU SCHEDULED THIS: ${checkin.reason}`,
    `THE NOTE YOU LEFT YOURSELF: ${checkin.prompt}`,
  ];
  if (node) {
    lines.push(`THE THING ITSELF: ${node.name} — ${node.summary}`);
  }
  if (stats.length > 0) {
    const recap = stats.map((s) => `${s.count}x ${s.kind} (${s.window})`).join(', ');
    lines.push(`THEIR LOGGED RECORD lately: ${recap}.`);
  }
  return lines.join('\n');
}

// ── The core: fire whatever is due ────────────────────────────────────────────

export interface FireInput {
  /** Injected "now" (ISO). Determinism: the core never reads the wall clock. */
  now: string;
}

/**
 * fireDueCheckIns — for each due check-in (across all users; getDueCheckIns spans
 * users, each CheckIn carries its own userId), make ONE Grok call to write DOT's
 * check-in message in her voice grounded in the watched node + the user's record,
 * persist it as a 'dot' message (it lands in the thread), and mark the check-in
 * sent. Returns the CheckIns that fired (now status='sent').
 *
 * Fail loud: a model error throws (no canned fallback). The check-in is only
 * marked sent AFTER the message persists, so a thrown call leaves it 'pending'
 * and the next tick retries it.
 */
export async function fireDueCheckIns(input: FireInput): Promise<CheckIn[]> {
  const { now } = input;
  const due = store.getDueCheckIns(now);
  const fired: CheckIn[] = [];

  for (const checkin of due) {
    const context = buildCheckInContext(checkin, now);
    const system = `${DOT_CHAT_SYSTEM}\n\n${CHECKIN_INSTRUCTION}\n\n# WHAT YOU'RE CHECKING IN ABOUT\n${context}`;

    // ONE Grok call — DOT's check-in message, grounded, in her voice.
    const { text } = await generateText({
      model: reasoningModel,
      system,
      prompt: `Write the check-in text now. Just the message, nothing else.`,
    });
    const message = text.trim().replace(/\s*—\s*/g, ', '); // no em-dashes (DOT voice)

    // Persist as a 'dot' message — it arrives in the thread like any other turn.
    store.addMessage({ userId: checkin.userId, role: 'dot', content: message, ts: now });

    // Mark sent AFTER the write lands (so a thrown call above leaves it pending).
    const updated = store.updateCheckIn(checkin.id, { status: 'sent', sentAt: now });
    if (updated) fired.push(updated);
  }

  return fired;
}

/** tick — the deterministic entry point (an alias of fireDueCheckIns). Tests call
 *  this with a fixed `now`; the interval wrapper calls it with the wall clock. */
export async function tick(input: FireInput): Promise<CheckIn[]> {
  return fireDueCheckIns(input);
}

// ── The real timer (the ONLY place the wall clock is read) ────────────────────

export interface SchedulerOptions {
  /** How often to check for due check-ins (ms). Default 30s. */
  intervalMs?: number;
}

/** A handle to stop the running scheduler. */
export interface SchedulerHandle {
  stop(): void;
}

/**
 * startScheduler — start the real-time timer. Every `intervalMs` it reads the wall
 * clock and fires whatever is due. This setInterval body is the ONLY sanctioned
 * use of new Date() in the codebase (the live clock that drives real time); every
 * tick logs so the path is observable, and a failed tick is caught + logged so one
 * bad tick never kills the timer. Returns { stop } to clear the interval.
 */
export function startScheduler(opts: SchedulerOptions = {}): SchedulerHandle {
  const intervalMs = opts.intervalMs ?? 30_000;

  const handle = setInterval(() => {
    const now = new Date().toISOString(); // ← the live wall clock (sanctioned here only)
    console.log('scheduler_tick', now);
    fireDueCheckIns({ now })
      .then((fired) => {
        if (fired.length > 0) {
          console.log('scheduler_fired', fired.length, fired.map((c) => c.id));
        }
      })
      .catch((err) => console.error('scheduler_tick_failed', err));
  }, intervalMs);

  // Don't keep the process alive just for the timer (it's a side-channel, not the
  // main loop). No-op if unref isn't available (e.g. some test runners).
  handle.unref?.();

  return {
    stop() {
      clearInterval(handle);
    },
  };
}
