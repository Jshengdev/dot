// index.ts — the @dot/backend public barrel. ONE job: expose the engine surface
// the frontend (L6) consumes through a single import path, so a Next Route Handler
// does `import { runStory, store, seedDemoUser } from '@dot/backend'` and never
// reaches into deep relative files. (The backend stays ESM + loads the repo-root
// .env via grok.ts unchanged — Next treats it as an external server package.)
//
// What L6 needs, and nothing more:
//   - runStory()         the one grounded pipeline call (extract → persist → reflect)
//   - buildReport()      the typed reflection payload the surface renders (Story +
//                        the validate-first line + stat aggregates + provider SOAP)
//   - store / seed       the substrate + the synthetic counter-evidence
//   - the contracts      Story / Event / DotRun / DotEvent (no panel invents a shape)

export { extractStory, EXTRACT_PROMPT, REASONING_MODEL } from './extract.js';
export type { ExtractInput, ExtractOutput, ExtractResult } from './extract.js';

export { store } from './store.js';
export type { DotStore, Message, User, StatLine, UserSnapshot } from './store.js';

// The serverless durability boundary — hydrate() one user from the shared store
// before the engine runs, persist() after. Auto-detects Neon / Upstash / Map.
export { hydrate, persist, isDurable, storeMode } from './persistence.js';
export type { StoreMode } from './persistence.js';

// The cron's pending-check-in index — so a scheduled tick (no userId) can find who's
// due across all users, fire their check-ins, and text them.
export { indexPending, getDuePending, markPendingSent, pendingKeyFor } from './persistence.js';
export type { PendingItem } from './persistence.js';

export {
  seedDemoUser,
  syntheticConnector,
  SEED_NOW,
  SEED_COUNTS,
  DEMO_USER_ID,
  DEMO_USER_NAME,
} from './seed.js';

export type { Story, Event, DotRun, DotEvent, ClassifiedItem, ClassifyResult } from './types.js';

// The L6 reflection payload + the one call that produces it (defined in run.ts).
// buildStats/buildReport are exported so a route can re-assemble the provider report
// over the store WITHOUT a second model call (pure reads).
export { runStory, buildReflection, buildStats, buildReport, DEMO_SPIRAL } from './run.js';
export type { Reflection, ReportSO, StatAggregate } from './run.js';

// The live conversation spine (Scene 2 onboarding + Scene 3 check-in replies):
// one inbound message → one live Grok call → grounded reflection, persisted.
export { runTurn } from './turn.js';
export type { TurnInput, TurnOutput, ContextPacket } from './turn.js';

// ── The LIVE intake engine (the fully-conversational rebuild) ─────────────────
// converse → self-close → knowledge-graph chunking → forward check-in plan →
// real scheduler → live provider report. Everything below assembles from the
// conversation alone (no seed, no scripts); proven headless by src/test-flow.ts.
export { converseTurn, closeConversation } from './converse.js';
export type { ConverseInput, ConverseResult, CloseInput, CloseResult } from './converse.js';
export { updateGraph } from './graph.js';
export type { UpdateGraphInput } from './graph.js';
export { buildPlan } from './plan.js';
export type { CheckInPlan, CheckInPlanItem } from './plan.js';
export { buildLiveReport } from './report.js';
export type { LiveReport, ReportCard } from './report.js';
export { fireDueCheckIns, tick, startScheduler } from './scheduler.js';
export type { FireInput, SchedulerHandle, SchedulerOptions } from './scheduler.js';
export type {
  Graph,
  GraphNode,
  GraphEdge,
  NodeType,
  EdgeType,
  Panel,
  ConversationMeta,
  ConversationStatus,
  CheckIn,
  CheckInStatus,
  ClinicalSignal,
  SignalKind,
} from './types.js';
