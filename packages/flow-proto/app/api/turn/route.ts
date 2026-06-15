// app/api/turn/route.ts — THE LIVE INTAKE SEAM. ONE job: one user message →
// DOT's next reply in the back-and-forth, and the knowledge graph grows live.
//
// The conversational rebuild: converseTurn() makes the ONE Grok call that writes
// DOT's reply AND grades the story (coverage / what's missing / whether to close);
// then updateGraph() chunks the new turns into the user's knowledge graph (so the
// panels update as they talk). No seed, no script — the record forms from the talk.
//
// shouldClose tells the surface when DOT wants to wrap up; the surface then calls
// POST /api/close (which reflects the two truths back + builds the check-in plan).
//
// Fail loud (CONSTRAINTS): a model/store error returns a structured 500 — the
// surface renders a visible FAILED badge. No canned fallback masks a dead path.

import { NextResponse } from 'next/server';
import { ensureEnv, nowIso } from '@/lib/server-env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── The deterministic risk scan (the 988 handoff gate) ────────────────────────
// A lowercased substring match — lenient by design: safety errs toward the human.
// (The graph also surfaces risk_signal nodes; this is the fast per-message gate the
// surface uses to raise the calm 988 card the moment a cue appears.)
const CRISIS_CUES = [
  'better off dead', 'better off without me', 'kill myself', 'killing myself',
  'end it all', 'end my life', 'hurt myself', 'hurting myself', 'harm myself',
  'self-harm', 'self harm', 'suicide', 'suicidal', "don't want to be here",
  'do not want to be here', "don't want to be alive", 'want to die',
  'no reason to live', 'no point in living', "can't go on", 'cannot go on',
  'sleep forever', 'scratch my arm', 'scratching my arm', 'scratch myself',
  'cut myself', 'cutting myself',
] as const;

function detectRisk(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_CUES.some((cue) => lower.includes(cue));
}

interface TurnBody {
  userId?: string;
  text?: string;
  now?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as TurnBody;
    const userId = (body.userId ?? 'demo').trim() || 'demo';
    const text = (body.text ?? '').trim();
    if (!text) {
      return NextResponse.json({ error: 'text required', node: 'turn' }, { status: 400 });
    }

    ensureEnv();
    const { converseTurn, updateGraph, store, hydrate, persist } = await import('@dot/backend');

    const now = body.now ?? nowIso();

    // Load this user's slice from the shared store (no-op locally) so the engine sees
    // the whole conversation even on a fresh serverless instance.
    await hydrate(userId);

    // Ensure the user exists (no seed — a fresh user, the record comes from the talk).
    if (!store.getUser(userId)) store.createUser({ id: userId, name: userId, createdAt: now });

    // 1. THE ONE GROK CALL — DOT's reply + her read on the story (coverage/close).
    const result = await converseTurn({ userId, text, now });

    // 2. Chunk the new turns into the knowledge graph (the panels read this live).
    const graph = await updateGraph({ userId, now });

    // Write the updated slice back to the shared store (no-op locally).
    await persist(userId);

    return NextResponse.json({
      reply: result.reply,
      coverage: result.coverage,
      missing: result.missing,
      shouldClose: result.shouldClose,
      risk: detectRisk(text),
      // a cheap shape of the live graph so the surface can pulse the panels as they fill
      graphShape: {
        nodes: graph.nodes.filter((n) => n.type !== 'turn').length,
        edges: graph.edges.length,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/turn] FAILED:', message);
    return NextResponse.json({ error: message, node: 'turn' }, { status: 500 });
  }
}
