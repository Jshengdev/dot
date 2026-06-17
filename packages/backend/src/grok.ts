// grok.ts — the thin Grok client. One job: read XAI_API_KEY from the repo-root
// .env, wire @ai-sdk/xai to the xAI OpenAI-compatible base, and export the
// reasoning model the extractor/turn-loop call. No model is hard-coded anywhere
// else — every Grok call resolves through here.
//
// Fail loud (CONSTRAINTS): a missing key throws at import, it does not silently
// fall back to an unauthenticated client.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createXai } from '@ai-sdk/xai';
import { createCerebras } from '@ai-sdk/cerebras';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Minimal .env loader — no dotenv dep. Reads repo-root .env (../../.. from
// packages/backend/src) into process.env without overwriting an already-set var.
// Kept tiny on purpose: one purpose, no parsing surprises.
function loadEnv(): void {
  // src -> backend -> packages -> dot (repo root)
  const envPath = resolve(__dirname, '..', '..', '..', '.env');
  let raw: string;
  try {
    raw = readFileSync(envPath, 'utf8');
  } catch {
    return; // no .env file: rely on whatever is already in process.env
  }
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    // strip surrounding quotes if present
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

loadEnv();

export const XAI_API_KEY = process.env.XAI_API_KEY;
export const XAI_BASE_URL = 'https://api.x.ai/v1';

// The reasoning model slug (the fact/feeling/delta split). VERIFIED live on this
// account per docs/KEYS.md (2026-06-13). Env-overridable for per-process control.
export const REASONING_MODEL = process.env.DOT_REASONING_MODEL ?? 'grok-4.20-0309-reasoning';

if (!XAI_API_KEY) {
  // Fail loud — never construct an unauthenticated client and pretend it works.
  throw new Error(
    'XAI_API_KEY is not set. Add it to dot/.env (gitignored). ' +
      'See docs/KEYS.md. The Grok client cannot be created without it.',
  );
}

// The provider, pinned to the xAI OpenAI-compatible base.
export const xai = createXai({
  apiKey: XAI_API_KEY,
  baseURL: XAI_BASE_URL,
});

// The exported reasoning model — the PROCESSING brain (graph chunking + the plan).
export const reasoningModel = xai(REASONING_MODEL);

// ── The FAST model — Cerebras, for DOT's conversational RESPONSES ─────────────
// Split per the product: Cerebras (very fast inference) writes the back-and-forth
// reply / the close / the check-in (snappy chat), while Grok above does the heavier
// PROCESSING (the knowledge-graph extraction + the plan). Env-gated: with no
// CEREBRAS_API_KEY it transparently falls back to the Grok reasoning model — it never
// breaks, it just isn't fast until the key is set.
export const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;
// Cerebras model for DOT's fast responses. Env-overridable (DOT_FAST_MODEL). This
// account exposes zai-glm-4.7 + gpt-oss-120b; gpt-oss-120b follows the structured
// reply schema reliably and is fast on Cerebras.
export const FAST_MODEL = process.env.DOT_FAST_MODEL ?? 'gpt-oss-120b';
export const usingCerebras = !!CEREBRAS_API_KEY;
export const fastModel = CEREBRAS_API_KEY
  ? createCerebras({ apiKey: CEREBRAS_API_KEY })(FAST_MODEL)
  : reasoningModel;
