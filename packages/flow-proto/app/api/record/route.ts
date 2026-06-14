// app/api/record/route.ts — THE RAW RECORD READ. ONE job: return what the
// conversation persisted — the told stories, the objective events DOT derived, and
// the GROUP BY stat sheet — for any surface that wants the counted record directly.
// (The panels prefer /api/graph + /api/report; this stays for the raw event view.)
//
// PURE READS — no model call, no seed. The record forms from the live intake.
//
// Fail loud (CONSTRAINTS): a store error returns a structured 500.

import { NextResponse } from 'next/server';
import { ensureEnv, nowIso } from '@/lib/server-env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    ensureEnv();
    const { store, buildStats } = await import('@dot/backend');

    const { searchParams } = new URL(request.url);
    const userId = (searchParams.get('userId') ?? 'demo').trim() || 'demo';
    const now = searchParams.get('now') ?? nowIso();

    const stories = store.getStories(userId); // told stories (newest→oldest)
    const events = store.getEvents(userId); // the objective record (oldest→newest)
    const stats = buildStats(userId, now); // GROUP BY over events (labeled)

    return NextResponse.json({ stories, events, stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/record] FAILED:', message);
    return NextResponse.json({ error: message, node: 'record' }, { status: 500 });
  }
}
