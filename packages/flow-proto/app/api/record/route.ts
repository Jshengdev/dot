// app/api/record/route.ts — THE READ-BACK SEAM (Scene 4 "view my story"). ONE job:
// read the persisted record that Scenes 2–3 + the seed wrote, and return it for the
// story page (connect-the-dots, at-a-glance O/S, provider report, timeline).
//
// PURE READS — NO model call (GOAL §1.5 #3 / Lane D): getStories + getEvents +
// buildStats (a GROUP BY over events). The validate-first line is NOT in the store;
// Scene 4 renders it from the cached onboarding reflection (captured live in Scene 2),
// not from here. Net: this returns only what was actually persisted — nothing invented.
//
// Boilerplate mirrors app/api/turn/route.ts: ensureEnv() loads repo-root .env BEFORE
// the backend import, runtime='nodejs', dynamic='force-dynamic', dynamic import after
// env load. (No Grok call is made here, but the backend import still needs the env so
// grok.ts's import-time key check passes.)
//
// Fail loud (CONSTRAINTS): a store error returns a structured 500.

import { NextResponse } from 'next/server';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function ensureEnv(): void {
  if (process.env.XAI_API_KEY) return;
  for (const candidate of [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '..', '..', '.env'),
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

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    ensureEnv();
    const { store, buildStats, seedDemoUser, SEED_NOW } = await import('@dot/backend');

    const { searchParams } = new URL(request.url);
    const userId = (searchParams.get('userId') ?? 'demo').trim() || 'demo';
    const now = searchParams.get('now') ?? SEED_NOW;

    // Seed-on-boot: if Scene 4 is opened before any turn ran (e.g. a fresh reload),
    // the seeded anxiety record still exists so connect-the-dots + the counts render.
    if (userId === 'demo') seedDemoUser();

    // PURE reads — the persisted record. No model call.
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
