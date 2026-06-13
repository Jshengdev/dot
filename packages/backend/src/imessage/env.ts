// env.ts — load the repo-root .env so the iMessage transport sees its creds
// (IMESSAGE_SERVER_URL / IMESSAGE_API_KEY / USER_PHONE / AGENT_PHONE) even when
// started standalone via tsx. Mirrors packages/backend/src/grok.ts's loader.
// Idempotent; never overwrites an already-set var. Never prints values.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
let loaded = false;

export function loadEnv(): void {
  if (loaded) return;
  loaded = true;
  // src/imessage -> src -> backend -> packages -> dot (repo root)
  const envPath = resolve(here, '..', '..', '..', '..', '.env');
  let raw: string;
  try {
    raw = readFileSync(envPath, 'utf8');
  } catch {
    return; // rely on whatever is already in process.env
  }
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
}
