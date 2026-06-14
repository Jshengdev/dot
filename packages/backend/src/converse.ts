// converse.ts — the LIVE intake director (web chat). ONE job: across multiple
// turns, DOT pulls the WHOLE story out of the user, then closes the conversation
// HERSELF (the user doesn't have to know when they're "done"). Each turn is ONE
// Grok call that does double duty: it writes DOT's short reflective reply (her
// voice, validate-first, one gentle probe) AND grades how complete the story is
// (coverage / what's still missing / whether to close). On close, a second call
// reflects the TWO TRUTHS back so the user sees how much DOT actually captured.
//
// This is the conversational sibling of extract.ts: extract.ts reflects ONE told
// story against the seeded record; converse.ts runs the back-and-forth that GETS
// the story out in the first place, building the conversation toward a close.
//
// Determinism: the caller passes `now` (ISO); we never call Date.now() in here.
// Fail loud (CONSTRAINTS): a model/parse error throws — no canned fallback reply
// masks a dead path.
//
// Voice: lifted from imessage/chat.ts (DOT_CHAT_SYSTEM) — lowercase, short, no
// em-dashes, validate-first, never a verdict, route risk to a real person.

import { z } from 'zod';
import { generateObject, generateText } from 'ai';
import { reasoningModel } from './grok.js';
import { store } from './store.js';
import { DOT_CHAT_SYSTEM } from './imessage/chat.js';
import type { ConversationMeta, Graph } from './types.js';

// ── Tuning knobs (EDITABLE — the close thresholds the director enforces) ──────
// DOT closes the conversation herself once the story is full ENOUGH or the chat
// has run long enough — a real friend doesn't keep interrogating forever.
const COVERAGE_TO_CLOSE = 0.8; // story this complete → wrap it up
const MAX_TURNS = 6; // and never drag past this many user turns
const CONTEXT_TURNS = 24; // how much of the thread the turn call reads

// ── The per-turn boundary (the ONE generateObject schema) ─────────────────────
// One Zod boundary for the turn call. `reply` is what DOT says back (her voice);
// the rest is the director's read on the story so it knows when to close.
const TurnSchema = z.object({
  reply: z
    .string()
    .describe(
      "DOT's reply in her voice: lowercase, short, one thought at a time, no " +
        'em-dashes. validate-first. give a SHORT reflective read of what they ' +
        'just shared, then a single gentle probe for the MOST IMPORTANT missing ' +
        'piece of the story. one question, never two, never a checklist.',
    ),
  coverage: z
    .number()
    .min(0)
    .max(1)
    .describe(
      'How complete the whole story is now, 0..1. 0 = barely started, 1 = you ' +
        'have the full picture (what happened, when, who, how it felt, how bad). ' +
        'Be honest — high only when little of consequence is still unknown.',
    ),
  missing: z
    .array(z.string())
    .describe(
      "What's still unknown about the story — the threads not yet pulled (e.g. " +
        '"how long this has been going on", "what set it off", "the body / ' +
        'physical side", "how bad it gets"). empty when the story is whole.',
    ),
  shouldClose: z
    .boolean()
    .describe(
      'True when you have enough of the story to wrap up gently. The director ' +
        'will also force this once coverage is high or the chat has run long.',
    ),
});
type TurnResult = z.infer<typeof TurnSchema>;

// ── Graph coverage summary (so the turn call knows what it already has) ────────
// A tiny, cheap summary of the current graph — grouped by panel — so DOT's probe
// targets a REAL gap instead of re-asking something already captured. Not the
// whole graph: just enough for the model to see the shape of what it has.

function summarizeGraph(graph: Graph): string {
  if (graph.nodes.length === 0) {
    return 'Nothing captured yet — this is the start of the story.';
  }
  const byPanel = new Map<string, string[]>();
  for (const n of graph.nodes) {
    if (n.type === 'turn') continue; // turns are the spine, not captured content
    const list = byPanel.get(n.panel) ?? [];
    list.push(n.name);
    byPanel.set(n.panel, list);
  }
  if (byPanel.size === 0) {
    return 'Nothing captured yet — this is the start of the story.';
  }
  const lines: string[] = ['So far you have captured (by area):'];
  for (const [panel, names] of byPanel) {
    lines.push(`- ${panel}: ${[...new Set(names)].slice(0, 8).join(', ')}`);
  }
  return lines.join('\n');
}

// ── One conversational turn ───────────────────────────────────────────────────

export interface ConverseInput {
  userId: string;
  text: string;
  /** Injected "now" (ISO) — every persisted ts + the openedAt come from this. */
  now: string;
}

export type ConverseResult = TurnResult;

/**
 * converseTurn — one back-and-forth of the live intake. Persists the inbound
 * user message, runs ONE Grok call over the recent thread + the current graph
 * coverage to produce DOT's reply AND her read on the story, persists DOT's
 * reply, advances the conversation meta, and returns the struct.
 *
 * The director closes on its own terms: shouldClose is FORCED true once coverage
 * crosses the threshold or the chat hits MAX_TURNS — the model can ask to close
 * sooner, but it can never keep the user talking past the cap.
 *
 * Fail loud: a model/parse error throws (no canned reply).
 */
export async function converseTurn(input: ConverseInput): Promise<ConverseResult> {
  const { userId, text, now } = input;

  // 1. persist the inbound user message (the thread IS the memory).
  store.addMessage({ userId, role: 'user', content: text, ts: now });

  // 2. open the conversation on the first turn / bump turnCount on every turn.
  const existing = store.getConversation(userId);
  const turnCount = (existing?.turnCount ?? 0) + 1;
  const meta: ConversationMeta = existing
    ? { ...existing, status: existing.status === 'closed' ? existing.status : 'open', turnCount }
    : { userId, status: 'open', openedAt: now, turnCount };
  store.upsertConversation(meta);

  // 3. build the context: the recent thread + a summary of what's captured.
  const recent = store.getMessages(userId, CONTEXT_TURNS);
  const messages = recent.map((m) => ({
    role: m.role === 'dot' ? ('assistant' as const) : ('user' as const),
    content: m.content,
  }));
  const coverageSummary = summarizeGraph(store.getGraph(userId));

  const system =
    `${DOT_CHAT_SYSTEM}\n\n` +
    `# THIS IS A LIVE INTAKE\n` +
    `You are pulling the WHOLE story out of them across this conversation. Each ` +
    `turn: give a short reflective read of what they just said (validate first, ` +
    `in your voice), then ask ONE gentle question for the most important MISSING ` +
    `piece. You also quietly grade how complete the story is so you know when to ` +
    `wrap up — you close the conversation yourself when you have enough.\n\n` +
    `# WHAT YOU'VE CAPTURED SO FAR\n${coverageSummary}\n\n` +
    `Use this to avoid re-asking what you already have, and to aim your probe at ` +
    `a real gap. This turn is #${turnCount} of at most ${MAX_TURNS}.`;

  // 4. THE ONE GROK CALL — reply + the director's read on the story.
  const { object } = await generateObject({
    model: reasoningModel,
    schema: TurnSchema,
    system,
    messages,
  });

  // 5. normalize DOT's reply (no em-dashes — the Poke voice rule from chat.ts).
  const reply = object.reply.replace(/\s*—\s*/g, ', ').trim();

  // 6. the director's close decision: the model can ask to close, but coverage
  //    crossing the bar or hitting the turn cap FORCES it.
  const shouldClose =
    object.shouldClose || object.coverage >= COVERAGE_TO_CLOSE || turnCount >= MAX_TURNS;

  // 7. persist DOT's reply (the conversation continues from here).
  store.addMessage({ userId, role: 'dot', content: reply, ts: now });

  return {
    reply,
    coverage: object.coverage,
    missing: object.missing,
    shouldClose,
  };
}

// ── Closing the conversation ──────────────────────────────────────────────────

export interface CloseInput {
  userId: string;
  /** Injected "now" (ISO) — the closedAt + the close-message ts come from this. */
  now: string;
}

export interface CloseResult {
  /** DOT's closing message (the two-truths reflection she says back). */
  closing: string;
}

/**
 * closeConversation — DOT ends the intake herself. Sets the meta to 'closing',
 * runs ONE Grok call that produces her close in her voice — an "ok, our time's
 * almost up" beat plus the STORY SAID BACK (the two truths she captured, drawn
 * from the graph + the thread) so the user sees how much she got — persists it
 * as a DOT message, then marks the conversation 'closed'.
 *
 * Fail loud: a model/parse error throws — and the meta is left 'closing' so a
 * failed close is visible, not silently marked done.
 */
export async function closeConversation(input: CloseInput): Promise<CloseResult> {
  const { userId, now } = input;

  // 1. flip to 'closing' so a mid-close failure is visible (not silently 'closed').
  const existing = store.getConversation(userId);
  const opening: ConversationMeta = existing
    ? { ...existing, status: 'closing' }
    : { userId, status: 'closing', openedAt: now, turnCount: 0 };
  store.upsertConversation(opening);

  // 2. gather the two truths to say back: the graph (what she captured) + the
  //    thread (so the close lands in the actual conversation).
  const graph = store.getGraph(userId);
  const subjective = graph.nodes
    .filter((n) => n.type === 'claim_subjective')
    .map((n) => `- ${n.name}: ${n.summary}`);
  const objective = graph.nodes
    .filter((n) => n.type === 'fact_objective' || n.type === 'event' || n.type === 'symptom')
    .map((n) => `- ${n.name}: ${n.summary}`);
  const twoTruths =
    `WHAT THEY FELT (the story they carried):\n${subjective.join('\n') || '- (nothing distinct captured)'}\n\n` +
    `WHAT ACTUALLY HAPPENED (what you noted from them):\n${objective.join('\n') || '- (nothing distinct captured)'}`;

  const recent = store.getMessages(userId, CONTEXT_TURNS);
  const messages = recent.map((m) => ({
    role: m.role === 'dot' ? ('assistant' as const) : ('user' as const),
    content: m.content,
  }));

  const system =
    `${DOT_CHAT_SYSTEM}\n\n` +
    `# YOU ARE CLOSING THIS CONVERSATION NOW\n` +
    `Wrap it up gently, in your voice. Two beats, short:\n` +
    `1. a soft "ok, our time's almost up for now" — you have to step away, but ` +
    `you're not abandoning them.\n` +
    `2. say the STORY BACK to them — reflect the two truths you captured so they ` +
    `SEE how much you held: the story they felt, set gently beside what actually ` +
    `happened. hold both, never argue them out of the feeling, never a verdict.\n` +
    `lowercase, short lines, no em-dashes, no checklist, no markdown. end warm.\n\n` +
    `# THE TWO TRUTHS YOU CAPTURED (reflect THESE back, in your own words)\n${twoTruths}`;

  // 3. THE CLOSE CALL — DOT's two-truths reflection in her voice.
  const { text } = await generateText({
    model: reasoningModel,
    system,
    messages,
  });
  const closing = text.replace(/\s*—\s*/g, ', ').trim();

  // 4. persist the close as a DOT message (it's part of the thread).
  store.addMessage({ userId, role: 'dot', content: closing, ts: now });

  // 5. mark the conversation closed (only after the close message is written).
  store.upsertConversation({
    ...opening,
    status: 'closed',
    closedAt: now,
    closeReason: 'intake complete',
  });

  return { closing };
}
