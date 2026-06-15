// app/api/report/route.ts — THE LIVE REPORT. ONE job: assemble the unique,
// provider-ready S/O report from the user's live knowledge graph (the connect-the-
// dots payoff). Pure assembly, no model call. Never Assessment/Plan — S/O only.

import { NextResponse } from 'next/server';
import { ensureEnv, nowIso } from '@/lib/server-env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    ensureEnv();
    const { buildLiveReport, hydrate } = await import('@dot/backend');
    const { searchParams } = new URL(request.url);
    const userId = (searchParams.get('userId') ?? 'demo').trim() || 'demo';
    const now = searchParams.get('now') ?? nowIso();

    await hydrate(userId); // load the user's slice from the shared store (no-op locally)
    const report = buildLiveReport({ userId, now });
    return NextResponse.json({ report });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/report] FAILED:', message);
    return NextResponse.json({ error: message, node: 'report' }, { status: 500 });
  }
}
