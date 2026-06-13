// health.ts — the S0 GATE. GET https://api.x.ai/v1/models with XAI_API_KEY and
// print 'OK' + the count of model ids. Proves the key is live and the base URL
// is right before any reasoning code runs. Fail loud on a non-200 / bad shape.
//
// Run:  npx tsx src/health.ts

import { XAI_API_KEY, XAI_BASE_URL } from './grok.js';

async function main(): Promise<void> {
  // grok.ts already throws on a missing key; this is belt-and-suspenders.
  if (!XAI_API_KEY) throw new Error('XAI_API_KEY missing — cannot run health check.');

  const res = await fetch(`${XAI_BASE_URL}/models`, {
    headers: { Authorization: `Bearer ${XAI_API_KEY}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`xAI /models returned ${res.status} ${res.statusText}: ${body}`);
  }

  const json = (await res.json()) as { data?: Array<{ id: string }> };
  const ids = (json.data ?? []).map((m) => m.id).filter(Boolean);

  if (ids.length === 0) {
    throw new Error('xAI /models returned 200 but no model ids — unexpected shape.');
  }

  console.log('OK');
  console.log(`model ids: ${ids.length}`);
}

main().catch((err) => {
  console.error('HEALTH CHECK FAILED:', err instanceof Error ? err.message : err);
  process.exit(1);
});
