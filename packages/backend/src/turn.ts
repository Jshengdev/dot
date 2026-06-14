// turn.ts — THE TEXT TURN LOOP (the spine, before any channel). ONE job: take one
// inbound message and return DOT's grounded reflection, going through a single
// observable pipeline (SKELETON-SPEC §4 / BUILDER-START L3):
//
//   inbound text
//     1. persist inbound to `messages`                 (history = source of truth)
//     2. assemble context (≤2 layers, IN PARALLEL)     → one typed ContextPacket
//          layer1  conversation history  — getMessages last-N
//          layer2  what's-known-so-far   — recent stories + countEvents evidence
//     3. ONE Grok reasoning call (reuse extractStory)  → the reflection reply text
//     4. persist outbound to `messages`
//     5. return { reply, story }
//
// ONE reasoning call per turn — DOT is NOT impersonating anyone, so there is NO
// Thinker/Talker/Critic regen loop (SKELETON-SPEC §4 collapse note). extractStory
// IS that one call: it grounds in the record, splits fact/feeling, reflects the
// delta, and persists the Story. The reply DOT speaks is assembled from that one
// result (feeling_validation + delta) — no second model call.
//
// The two context layers are read CONCURRENTLY via Promise.all even though the
// in-proc store is synchronous: it honors the "assemble in parallel" contract and
// is the swap seam — when a layer becomes an async SQLite/Connector read, the
// shape here does not move.
//
// Fail loud (CONSTRAINTS): a model/store error throws — no canned fallback string
// masks a dead path. Silence is never faked into a reply.

import { extractStory } from './extract.js';
import { store } from './store.js';
import type { Message } from './store.js';
import type { Story } from './types.js';
import { SEED_NOW } from './seed.js';

// ── Editable knobs (tune here; the skeleton runs regardless) ──────────────────
/** How many prior messages we re-read as conversation context (layer 1). */
const HISTORY_LAST_N = 10;
/** Recent stories surfaced as the accumulated slice (layer 2). */
const RECENT_STORIES_N = 3;
/** The window the counter-evidence is counted over (layer 2). Matches the demo's "this week". */
const EVIDENCE_WINDOW_DAYS = 7;

// ── The typed context packet (the ≤2 layers, fanned into one object) ──────────
// One shape the turn loop reasons over. Every field is a REAL read from the store
// — no invented data crosses this boundary.
export interface ContextPacket {
  /** layer 1 — conversation history: the last N messages, oldest→newest. */
  history: Message[];
  /** layer 2 — what's-known-so-far: the most recent told stories (glass dots). */
  recentStories: Story[];
  /**
   * layer 2 — the counter-evidence the new story reflects against. A flat windowed
   * COUNT(*) over `events` (PORT-MEMORY-DB §3 — enough for the demo, no RRF).
   * Anxiety-hero record: the panic / self-harm / ideation counts the minimized
   * story is reflected against.
   */
  evidence: {
    windowDays: number;
    panicAttacks: number;
    selfHarm: number;
    ideation: number;
  };
}

/**
 * assembleContext — fan out the ≤2 layers IN PARALLEL into one ContextPacket.
 * Each layer is wrapped async so the parallel/​swap contract holds even while the
 * store is synchronous (the bodies become DB reads later; the signature stays).
 */
async function assembleContext(userId: string, now: string): Promise<ContextPacket> {
  const [history, recentStories, evidence] = await Promise.all([
    // layer 1 — conversation history
    Promise.resolve(store.getMessages(userId, HISTORY_LAST_N)),
    // layer 2a — the accumulated slice: recent told stories
    Promise.resolve(store.getStories(userId).slice(0, RECENT_STORIES_N)),
    // layer 2b — the counter-evidence (windowed COUNT over events)
    Promise.resolve().then(() => ({
      windowDays: EVIDENCE_WINDOW_DAYS,
      panicAttacks: store.countEvents(
        userId,
        { kind: 'panic_attack', sinceDays: EVIDENCE_WINDOW_DAYS },
        now,
      ),
      selfHarm: store.countEvents(
        userId,
        { kind: 'self_harm', sinceDays: EVIDENCE_WINDOW_DAYS },
        now,
      ),
      ideation: store.countEvents(
        userId,
        { kind: 'ideation', sinceDays: EVIDENCE_WINDOW_DAYS },
        now,
      ),
    })),
  ]);
  return { history, recentStories, evidence };
}

/** A one-line human summary of the assembled context (for the gate / logs). */
export function summarizeContext(ctx: ContextPacket): string {
  return (
    `${ctx.history.length} msgs · ${ctx.recentStories.length} prior stories · ` +
    `evidence[${ctx.evidence.windowDays}d]: ${ctx.evidence.panicAttacks} panic attacks, ` +
    `${ctx.evidence.selfHarm} self-harm, ${ctx.evidence.ideation} ideation`
  );
}

// ── The reply DOT speaks back (assembled from the ONE result — no 2nd call) ────
// The grounded reflection = validate-first, then the neutral delta observation.
// This is DOT's voice on the conversation surface; it is shaped from the single
// ExtractResult, never a second model round-trip.
function buildReply(feelingValidation: string, delta: string): string {
  const v = feelingValidation.trim();
  const d = delta.trim();
  // Two beats: the validation, then the observation. (Bubble-splitting into 1–5
  // bubbles is a transport concern handled by the channel plugin in L5; the turn
  // loop returns the reflection as one reply string.)
  return d ? `${v}\n\n${d}` : v;
}

// ── The turn ──────────────────────────────────────────────────────────────────

export interface TurnInput {
  userId: string;
  text: string;
  /** Injected "now" for deterministic grounding. Defaults to the seeded week. */
  now?: string;
}

export interface TurnOutput {
  /** DOT's grounded reflection — what the channel sends back. */
  reply: string;
  /** The persisted Story (a glass dot), re-read from the store (roundtrip proof). */
  story: Story;
  /** The assembled context (exposed so the gate/logs can show what fed the call). */
  context: ContextPacket;
}

/**
 * runTurn — the spine. One inbound message → one grounded reflection reply,
 * through a single observable pipeline with EXACTLY ONE reasoning call.
 *
 * Note: extractStory already persists the INBOUND story to `messages` (role
 * 'user') and the Story row; runTurn assembles context BEFORE that call (so the
 * context reflects history-up-to-now), runs the one call, then persists the
 * OUTBOUND reply to `messages` (role 'dot'). Fail loud — errors throw.
 */
export async function runTurn(input: TurnInput): Promise<TurnOutput> {
  const { userId, text } = input;
  const now = input.now ?? SEED_NOW;

  if (!store.getUser(userId)) {
    throw new Error(
      `runTurn: no user '${userId}' in the store. Seed first (seedDemoUser()).`,
    );
  }

  // 2. assemble the ≤2 context layers IN PARALLEL (before the call). The inbound
  //    text is the new turn; history is everything up to (not including) it.
  const context = await assembleContext(userId, now);

  // 3. THE ONE GROK REASONING CALL. extractStory grounds in the record, splits
  //    fact/feeling, reflects the delta, persists the inbound message + the Story
  //    + appends source='story' facts to events, and re-reads the Story.
  const { result, story } = await extractStory({ transcript: text, userId, now });

  // 3b. shape the reply from that one result — validate first, then the delta.
  const reply = buildReply(result.feeling_validation, result.delta);

  // 4. persist DOT's outbound reply to the message log (role 'dot').
  store.addMessage({ userId, role: 'dot', content: reply, ts: now });

  // 5. return the reflection + the re-read Story (the glass dot) + the context.
  return { reply, story, context };
}
