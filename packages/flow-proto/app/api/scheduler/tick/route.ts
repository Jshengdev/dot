// app/api/scheduler/tick/route.ts — THE WALL-CLOCK TICK. ONE job: fire whatever
// check-ins are due NOW. This is the real scheduled timer's heartbeat: a Vercel
// cron (production) or the open panels page (the demo) hits this on an interval,
// and any due check-in fires a real Grok message into the thread.
//
// Real time, not a button: tick reads the wall clock and fires store.getDueCheckIns
// — with DOT_CHECKIN_SCALE compressing the plan's offsets, a check-in scheduled for
// "tomorrow" comes due within the demo. Returns the check-ins that fired this tick.
//
// Fail loud: a model/store error returns a structured 500.

import { NextResponse } from 'next/server';
import { ensureEnv, nowIso } from '@/lib/server-env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function fire() {
  ensureEnv();
  const { tick } = await import('@dot/backend');
  const now = nowIso();
  const fired = await tick({ now });
  return { now, fired };
}

export async function GET() {
  try {
    return NextResponse.json(await fire());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/scheduler/tick] FAILED:', message);
    return NextResponse.json({ error: message, node: 'scheduler' }, { status: 500 });
  }
}

// POST behaves identically (a manual demo trigger / a cron that posts).
export const POST = GET;
