// app/api/health/route.ts — diagnostic. Reports which store the ENGINE resolved
// (neon/redis/map) plus whether the key env vars are visible AT RUNTIME inside the
// server process. Lets us see, from outside, whether the durable store is actually on.
import { NextResponse } from 'next/server';
import { ensureEnv } from '@/lib/server-env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  ensureEnv();
  const { storeMode, isDurable } = await import('@dot/backend');
  return NextResponse.json({
    storeMode: storeMode(),
    durable: isDurable(),
    runtimeEnv: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      dbScheme: (process.env.DATABASE_URL || '').slice(0, 11),
      XAI_API_KEY: !!process.env.XAI_API_KEY,
      CEREBRAS_API_KEY: !!process.env.CEREBRAS_API_KEY,
      IMESSAGE_SERVER_URL: !!process.env.IMESSAGE_SERVER_URL,
      USER_PHONE: !!process.env.USER_PHONE,
      DOT_SCHEDULER_INLINE: process.env.DOT_SCHEDULER_INLINE ?? null,
    },
  });
}
