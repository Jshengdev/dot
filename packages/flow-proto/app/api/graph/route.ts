// app/api/graph/route.ts — THE LIVE GRAPH READ. ONE job: return the user's current
// knowledge graph (nodes + edges) so each UI panel can filter it by node type
// (symptoms / timeline / two-truths / risk / context). Pure read, no model call.

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

    const graph = store.getGraph(userId);
    const conversation = store.getConversation(userId) ?? null;
    return NextResponse.json({ graph, conversation });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/graph] FAILED:', message);
    return NextResponse.json({ error: message, node: 'graph' }, { status: 500 });
  }
}
