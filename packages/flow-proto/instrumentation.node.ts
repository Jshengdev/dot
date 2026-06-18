// instrumentation.node.ts — NODE-ONLY. Imported by register() only when
// NEXT_RUNTIME==='nodejs' (the edge build DCE's that branch, so this file + its
// node-only deps never hit the edge compiler). The top-level IIFE runs once when
// the node server boots.
//
// THE 24/7 SCHEDULER: on a persistent host the process stays alive, so this
// setInterval is a real background scheduler — every tick it scans the global
// pending-check-in index (Neon dot_pending), fires every user who's due, and texts
// them via the bridge. No page open, no external cron. Gated on DOT_SCHEDULER_INLINE
// so it's inert unless explicitly turned on (Railway sets it to 1). The loop never
// overlaps itself; a thrown tick is logged, not fatal.

export {}; // make this a module (top-level imports are all dynamic, inside the IIFE)

(async () => {
  if (process.env.DOT_SCHEDULER_INLINE !== '1') {
    console.log('[scheduler] inline loop OFF (set DOT_SCHEDULER_INLINE=1 to enable)');
    return;
  }

  const { ensureEnv } = await import('./lib/server-env');
  ensureEnv(); // no-op when the host injects vars directly; loads .env only if present
  const { getDuePending, hydrate, tick, persist, markPendingSent, pendingKeyFor } =
    await import('@dot/backend');

  const INTERVAL_MS = Number(process.env.DOT_TICK_MS || 30_000);
  let running = false;

  async function loop() {
    if (running) return; // never let a slow tick overlap the next
    running = true;
    try {
      const now = new Date().toISOString();
      const due = await getDuePending(now);
      if (due.length === 0) return;
      const userIds = [...new Set(due.map((d) => d.userId))];
      let firedCount = 0;
      for (const uid of userIds) {
        await hydrate(uid);
        const f = await tick({ now, userId: uid });
        if (f.length > 0) {
          await persist(uid);
          await markPendingSent(f.map((c) => pendingKeyFor(uid, c.id)));
          firedCount += f.length;
        }
      }
      if (firedCount > 0) {
        console.log(`[scheduler] fired ${firedCount} check-in(s) across ${userIds.length} user(s)`);
      }
    } catch (err) {
      console.error('[scheduler] tick FAILED:', err instanceof Error ? err.message : String(err));
    } finally {
      running = false;
    }
  }

  console.log(`[scheduler] inline 24/7 loop ON — ticking every ${INTERVAL_MS}ms`);
  setInterval(loop, INTERVAL_MS);
  void loop(); // fire one immediately on boot
})();
