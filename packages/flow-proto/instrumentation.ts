// instrumentation.ts — Next runs register() ONCE on server boot, in BOTH the node
// and edge runtimes. The 24/7 scheduler needs node-only modules (the engine, the
// iMessage kit, fs), so it lives in instrumentation.node.ts and is imported ONLY in
// the node runtime. The `=== 'nodejs'` guard is statically folded away in the edge
// build (Next's DefinePlugin), so that node-only file + its deps never reach the edge
// compiler — which is what broke the build when everything was imported here.
//
// On a persistent host (Railway) this boot happens once and the loop lives forever.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation.node');
  }
}
