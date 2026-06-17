// app/api/close/route.ts — DOT ends the intake. ONE job: when the surface sees
// shouldClose (or the user taps "that's everything"), close the conversation —
// chunk the final turns, have DOT reflect the TWO TRUTHS back, and build the
// forward CHECK-IN PLAN from the graph. Returns DOT's closing message + the plan.
//
// Fail loud: a model/store error returns a structured 500.

import { NextResponse } from 'next/server';
import { ensureEnv, nowIso } from '@/lib/server-env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CloseBody {
  userId?: string;
  now?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as CloseBody;
    const userId = (body.userId ?? 'demo').trim() || 'demo';

    ensureEnv();
    const { updateGraph, closeConversation, buildPlan, store, hydrate, persist, indexPending } =
      await import('@dot/backend');

    const now = body.now ?? nowIso();
    await hydrate(userId);
    if (!store.getUser(userId)) store.createUser({ id: userId, name: userId, createdAt: now });

    // 1. chunk the conversation into the graph (close + plan both read the result),
    // then 2. the two-truths close and 3. the check-in plan run CONCURRENTLY — both
    // only READ the post-chunk graph and write to different collections, so running
    // them together takes buildPlan's model call off the critical path.
    await updateGraph({ userId, now });
    const [{ closing }, plan] = await Promise.all([
      closeConversation({ userId, now }),
      buildPlan({ userId, now }),
    ]);

    await persist(userId);
    // Register the scheduled check-ins in the global index so the background cron can
    // find + fire them later (no-op locally; the cron texts the phone at the set time).
    await indexPending(plan.map((c) => ({ userId, id: c.id, scheduledFor: c.scheduledFor })));

    return NextResponse.json({ closing, plan });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/close] FAILED:', message);
    return NextResponse.json({ error: message, node: 'close' }, { status: 500 });
  }
}
