// app/api/scheduler/tick/route.ts — THE WALL-CLOCK TICK. ONE job: fire whatever
// check-ins are due NOW for a user. The real scheduled timer's heartbeat: the open
// panels page (the demo) or a cron hits this on an interval, and any due check-in
// fires a real Grok message into the thread.
//
// Scoped to ?userId — it hydrates that user's slice from the shared store, fires
// only their due check-ins (with DOT_CHECKIN_SCALE compressing the plan's offsets so
// "tomorrow" comes due within the demo), then persists. No-op store calls locally.
//
// Fail loud: a model/store error returns a structured 500.

import { NextResponse } from 'next/server';
import { ensureEnv, nowIso } from '@/lib/server-env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function fire(userId: string) {
  ensureEnv();
  const { tick, hydrate, persist } = await import('@dot/backend');
  const now = nowIso();
  await hydrate(userId);
  // SCOPED to this user — never fire (or leak the risk-signal text of) another user's
  // check-ins, and the pending→sent flip is what we persist back for this user.
  const fired = await tick({ now, userId });
  if (fired.length > 0) await persist(userId);
  return { now, fired };
}

function userIdFrom(request: Request): string {
  const { searchParams } = new URL(request.url);
  return (searchParams.get('userId') ?? 'demo').trim() || 'demo';
}

export async function GET(request: Request) {
  try {
    return NextResponse.json(await fire(userIdFrom(request)));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/scheduler/tick] FAILED:', message);
    return NextResponse.json({ error: message, node: 'scheduler' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { userId?: string };
    const userId = (body.userId ?? userIdFrom(request)).trim() || 'demo';
    return NextResponse.json(await fire(userId));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/scheduler/tick] FAILED:', message);
    return NextResponse.json({ error: message, node: 'scheduler' }, { status: 500 });
  }
}
