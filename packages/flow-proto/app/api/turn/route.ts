// app/api/turn/route.ts — THE LIVE CONVERSATION SEAM (Scene 2 onboarding + Scene 3
// check-in replies). ONE job: take one user submission (typed OR pasted) and run it
// through the REAL grounded pipeline from @dot/backend — runTurn() makes the single
// live Grok reasoning call, grounds in the seeded anxiety record, validates the
// feeling first, persists the Story + the inbound/outbound messages — then assembles
// the provider report + stats over the store (pure reads, NO extra model call) and a
// deterministic risk flag (a substring scan, NO LLM).
//
// HALFSIES (GOAL §3): EVERY user submission goes through this LIVE Grok call. DOT's
// scripted side + the paste-ready user text live in lib/script.ts — there is no
// fake-reflection branch here. "This is a sample story; the reasoning is live."
//
// Boilerplate copied VERBATIM from packages/frontend/app/api/run/route.ts:
//   ensureEnv() loads repo-root .env BEFORE the backend import (so grok.ts's
//   import-time XAI_API_KEY check passes), runtime='nodejs', dynamic='force-dynamic',
//   and the backend is imported dynamically AFTER ensureEnv().
//
// Fail loud (CONSTRAINTS): a model/store error returns a structured 500 — the surface
// renders a visible FAILED badge. No canned fallback masks a dead path.

import { NextResponse } from 'next/server';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Defensive repo-root .env load (idempotent; never overwrites an already-set var).
// Mirrors backend/grok.ts so the route sees XAI_API_KEY even if the dev process
// didn't inherit it. From packages/flow-proto the repo root is ../../ at runtime cwd.
function ensureEnv(): void {
  if (process.env.XAI_API_KEY) return;
  for (const candidate of [
    resolve(process.cwd(), '.env'), // running from repo root
    resolve(process.cwd(), '..', '..', '.env'), // running from packages/flow-proto
  ]) {
    try {
      const raw = readFileSync(candidate, 'utf8');
      for (const line of raw.split('\n')) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const eq = t.indexOf('=');
        if (eq === -1) continue;
        const k = t.slice(0, eq).trim();
        let v = t.slice(eq + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        if (k && !(k in process.env)) process.env[k] = v;
      }
      if (process.env.XAI_API_KEY) return;
    } catch {
      /* try the next candidate */
    }
  }
}

// The Grok call needs the Node runtime (fs, the AI SDK) — not the Edge runtime.
export const runtime = 'nodejs';
// The reflection is a live model call; never cache it.
export const dynamic = 'force-dynamic';

// ── The deterministic risk scan (the 988 handoff gate) ────────────────────────
// Reimplemented locally (rather than importing detectRisk from director.ts) so the
// route never pulls the Inngest dependency into the Next bundle. The cue list is
// copied from director.ts::CRISIS_CUES; PLUS the hero-specific phrasings the
// imessage chat router catches ("sleep forever", arm-scratching) so check-in 3's
// "sleep forever" reply trips risk. Lowercased substring match — lenient by design:
// safety errs toward the human, never away.
const CRISIS_CUES = [
  'better off dead',
  'better off without me',
  'be better off without me',
  'kill myself',
  'killing myself',
  'end it all',
  'end my life',
  'hurt myself',
  'hurting myself',
  'harm myself',
  'self-harm',
  'self harm',
  'suicide',
  'suicidal',
  "don't want to be here",
  'do not want to be here',
  "don't want to be alive",
  'want to die',
  'no reason to live',
  'no point in living',
  "can't go on",
  'cannot go on',
  // hero-specific (mirrors imessage/chat.ts CRISIS_RE):
  'sleep forever',
  'scratch my arm',
  'scratching my arm',
  'scratch myself',
  'cut myself',
  'cutting myself',
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
  let body: TurnBody = {};
  try {
    body = (await request.json().catch(() => ({}))) as TurnBody;
    const userId = (body.userId ?? 'demo').trim() || 'demo';
    const text = (body.text ?? '').trim();
    if (!text) {
      return NextResponse.json({ error: 'text required', node: 'turn' }, { status: 400 });
    }

    ensureEnv();
    // Import AFTER ensureEnv so grok.ts's import-time key check passes.
    const { runTurn, buildStats, buildReport, seedDemoUser, SEED_NOW } = await import('@dot/backend');

    // Seed-on-boot: ensure the demo user + the seeded anxiety record exist before the
    // first turn (idempotent — stable ids never duplicate).
    if (userId === 'demo') seedDemoUser();

    const now = body.now ?? SEED_NOW;

    // THE LIVE GROK CALL — grounded, validate-first, persisted (one call per turn).
    const { reply, story, context } = await runTurn({ userId, text, now });

    // Assemble the provider report + stats over the store — PURE reads, no extra
    // model call (buildStats = GROUP BY over events; buildReport = SOAP S/O only).
    const stats = buildStats(userId, now);
    const report = buildReport(story, stats);

    // feelingValidation = the validate-first beat. runTurn shapes its `reply` as
    // "validation\n\ndelta"; the validation is the first paragraph (the beat the
    // frontend caches for Scene 4 — §1.5 #3). Fall back to the whole reply.
    const feelingValidation = reply.includes('\n\n') ? reply.split('\n\n')[0].trim() : reply.trim();

    // risk = the deterministic cue scan over the user's text (the 988 gate). The
    // frontend shows the 988 card when risk === true (Scene 3 check-in 3).
    const risk = detectRisk(text);

    return NextResponse.json({
      reply,
      story,
      feelingValidation,
      stats,
      report,
      risk,
      // surfaced for the reasoning trace (Scene 2 shows a real call ran): the grounded
      // counts the call reflected against, in this window.
      context: {
        windowDays: context.evidence.windowDays,
        panicAttacks: context.evidence.panicAttacks,
        selfHarm: context.evidence.selfHarm,
        ideation: context.evidence.ideation,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/turn] FAILED:', message);
    return NextResponse.json({ error: message, node: 'turn' }, { status: 500 });
  }
}
