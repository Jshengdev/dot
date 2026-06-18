// app/api/scheduler/tick/route.ts — THE WALL-CLOCK TICK. Two modes:
//   • ?userId=… → fire THAT user's due check-ins (the panels page polls this).
//   • no userId → CRON mode: scan the global pending index, fire every user who's due,
//     and text each one. This is what a Vercel Cron hits on a schedule, so follow-ups
//     land even when no one has the app open.
//
// Either way a due check-in fires a real Grok message + texts USER_PHONE via the
// bridge, and the pending→sent flip is persisted so nothing re-fires.
//
// Fail loud: a model/store error returns a structured 500.

import { NextResponse } from 'next/server';
import { ensureEnv, nowIso } from '@/lib/server-env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// per-user fire (the panels page polls this with its own userId)
async function fireForUser(userId: string) {
  ensureEnv();
  const { tick, hydrate, persist } = await import('@dot/backend');
  const now = nowIso();
  await hydrate(userId);
  const fired = await tick({ now, userId });
  if (fired.length > 0) await persist(userId);
  return { now, userId, fired };
}

// cron fire (no userId) — scan the global pending index, fire each due user, text them
async function fireCron() {
  ensureEnv();
  const { getDuePending, hydrate, tick, persist, markPendingSent, pendingKeyFor } =
    await import('@dot/backend');
  const now = nowIso();
  const due = await getDuePending(now);
  const userIds = [...new Set(due.map((d) => d.userId))];
  const fired: { id: string }[] = [];
  for (const uid of userIds) {
    await hydrate(uid);
    const f = await tick({ now, userId: uid });
    if (f.length > 0) {
      await persist(uid);
      await markPendingSent(f.map((c) => pendingKeyFor(uid, c.id)));
      fired.push(...f);
    }
  }
  return { now, mode: 'cron', usersChecked: userIds.length, fired };
}

function userIdParam(request: Request): string | null {
  const u = new URL(request.url).searchParams.get('userId');
  return u && u.trim() ? u.trim() : null;
}

export async function GET(request: Request) {
  try {
    const userId = userIdParam(request);
    return NextResponse.json(userId ? await fireForUser(userId) : await fireCron());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/scheduler/tick] FAILED:', message);
    return NextResponse.json({ error: message, node: 'scheduler' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { userId?: string };
    const userId = (body.userId ?? userIdParam(request) ?? '').trim() || null;
    return NextResponse.json(userId ? await fireForUser(userId) : await fireCron());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/scheduler/tick] FAILED:', message);
    return NextResponse.json({ error: message, node: 'scheduler' }, { status: 500 });
  }
}
