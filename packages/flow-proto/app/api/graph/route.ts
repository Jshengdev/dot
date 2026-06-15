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
    const { store, hydrate } = await import('@dot/backend');
    const { searchParams } = new URL(request.url);
    const userId = (searchParams.get('userId') ?? 'demo').trim() || 'demo';

    await hydrate(userId); // load the user's slice from the shared store (no-op locally)
    const graph = store.getGraph(userId);
    const conversation = store.getConversation(userId) ?? null;
    return NextResponse.json({ graph, conversation });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/graph] FAILED:', message);
    return NextResponse.json({ error: message, node: 'graph' }, { status: 500 });
  }
}
