// lib/server-env.ts — the one repo-root .env loader the API routes share. ONE job:
// make XAI_API_KEY visible to process.env BEFORE the dynamic `@dot/backend` import,
// so grok.ts's import-time key check passes even when the dev process didn't inherit
// the var. Idempotent; never overwrites an already-set var. (Server-only — imported
// by route handlers, which run on the Node runtime.)
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function ensureEnv(): void {
  if (process.env.XAI_API_KEY) return;
  for (const candidate of [
    resolve(process.cwd(), '.env'), // running from repo root
    resolve(process.cwd(), '..', '..', '.env'), // running from packages/flow-proto
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

/** The current wall-clock ISO — the live `now` every route passes into the engine
 *  (the rebuild runs on real time, not a seeded fixture). */
export function nowIso(): string {
  return new Date().toISOString();
}
