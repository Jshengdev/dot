// app/api/run/route.ts — the data seam (L6). ONE job: run the REAL grounded Grok
// pipeline from @dot/backend and return the typed Reflection the conversation
// surface renders. No invented data crosses this boundary — every field is a real
// Story/Event/store read (CONTRACTS discipline).
//
// Architecture (decisive): @dot/backend is a TS-only workspace package TRANSPILED
// by Next (next.config.mjs `transpilePackages` + an extensionAlias mapping its '.js'
// specifiers back to '.ts'), so webpack compiles it and resolves its deps
// (ai / @ai-sdk/xai / zod) from the backend's own node_modules. grok.ts's repo-root
// .env loader still runs; and ensureEnv() below loads the same .env BEFORE the
// backend import so the import-time XAI_API_KEY check passes regardless.
//
// The key (XAI_API_KEY) lives in repo-root /.env; grok.ts loads it at import. If a
// process started without that var, we defensively load the same repo-root .env
// here too (never hardcode the key) so the route sees it.
//
// Fail loud (CONSTRAINTS): a model/store error returns a structured 500 — the
// surface renders a visible FAILED badge. No canned fallback masks a dead path.

import { NextResponse } from 'next/server';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Defensive repo-root .env load (idempotent; never overwrites an already-set var).
// Mirrors backend/grok.ts so the route sees XAI_API_KEY even if the dev process
// didn't inherit it. From packages/frontend the repo root is ../../ at runtime cwd.
function ensureEnv(): void {
  if (process.env.XAI_API_KEY) return;
  for (const candidate of [
    resolve(process.cwd(), '.env'), // running from repo root
    resolve(process.cwd(), '..', '..', '.env'), // running from packages/frontend
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

interface RunBody {
  transcript?: string;
  userId?: string;
  now?: string;
}

async function run(body: RunBody) {
  ensureEnv();
  // Import AFTER ensureEnv so grok.ts's import-time key check passes.
  const { runStory } = await import('@dot/backend');
  const reflection = await runStory({
    transcript: body.transcript,
    userId: body.userId,
    now: body.now,
  });
  return NextResponse.json(reflection);
}

/** GET — the demo path: runs the seeded demo spiral (the [1:00] CATCH). */
export async function GET() {
  try {
    return await run({});
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/run] FAILED:', message);
    return NextResponse.json({ error: message, node: 'reflect' }, { status: 500 });
  }
}

/** POST — run a custom transcript (the iMessage thread / a typed story). */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as RunBody;
    return await run(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/run] FAILED:', message);
    return NextResponse.json({ error: message, node: 'reflect' }, { status: 500 });
  }
}
