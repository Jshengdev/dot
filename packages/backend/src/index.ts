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
export type { DotStore, Message, User, StatLine } from './store.js';

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
export { runStory, buildReflection, DEMO_SPIRAL } from './run.js';
export type { Reflection, ReportSO, StatAggregate } from './run.js';
