// app/api/plan/route.ts — THE CHECK-IN PLAN READ. ONE job: return the user's
// scheduled forward check-ins (the timer DOT built on close) so the surface can
// show "what DOT is watching, and when". Pure read, no model call.

import { NextResponse } from 'next/server';
import { ensureEnv } from '@/lib/server-env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    ensureEnv();
    const { store } = await import('@dot/backend');
    const { searchParams } = new URL(request.url);
    const userId = (searchParams.get('userId') ?? 'demo').trim() || 'demo';

    const checkins = store.getCheckIns(userId);
    return NextResponse.json({ checkins });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/plan] FAILED:', message);
    return NextResponse.json({ error: message, node: 'plan' }, { status: 500 });
  }
}
