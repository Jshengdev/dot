// test-e2e.ts — validate the backend EXPERIENCE end to end:
//   a few chat turns (mode-routed + varied, through Grok) → the full grounded
//   reflection (the catch) → the provider report. One run, real output.
// `pnpm --filter @dot/backend exec tsx src/test-e2e.ts`
import { store } from './store.js';
import { seedDemoUser, DEMO_USER_ID } from './seed.js';
import { chatReply, routeMode } from './imessage/chat.js';
import { runStory } from './run.js';

// The real demo journal, told over turns (data/demo-story.md).
const TURNS = [
  "I think I've had at least one panic attack a day this week haha. After every club event. My chest hurts like hell, I can't breathe, I end up scratching my arms during meetings to keep calm. all I want to do is sleep forever.",
  "honestly though i'd just tell a therapist it was a long week but not too bad. i'm just a nervous person, we're lowkey chilling.",
  'I spent the whole day yapping in IYA lol. kept kidnapping people to talk about everything. it was fun, might go the beach saturday?',
  "lowkey though i'm not likeable enough. other people get along so easily and it feels like there's a wall between me and them.",
];

function firstWords(s: string, n = 3): string {
  return s.split(/\s+/).slice(0, n).join(' ').toLowerCase();
}

async function main(): Promise<void> {
  store.reset(DEMO_USER_ID);
  seedDemoUser();

  console.log('════════ E2E · the chat (mode-routed, varied, through Grok) ════════\n');
  const openers: string[] = [];
  for (const t of TURNS) {
    const mode = routeMode(t);
    const reply = await chatReply({ userId: DEMO_USER_ID, text: t });
    openers.push(firstWords(reply));
    console.log(`[user · ${mode}] ${t.slice(0, 78)}…`);
    console.log(`[dot]  ${reply}\n`);
  }
  const distinct = new Set(openers).size;
  console.log(`variety: ${distinct}/${openers.length} distinct reply openers ${distinct >= 3 ? '✓' : '⚠ (samey)'}\n`);

  console.log('════════ E2E · the grounded reflection (the catch) ════════\n');
  const r = await runStory({ userId: DEMO_USER_ID, transcript: TURNS.join(' ') });
  console.log('feelingValidation:', r.feelingValidation);
  console.log('subjective      :', JSON.stringify(r.story.subjective));
  console.log('objective       :', JSON.stringify(r.story.objective));
  console.log('delta           :', r.story.delta);
  console.log('stats           :', r.stats.map((s) => `${s.label}=${s.count}`).join(' · '));
  console.log('report          : S', r.report.subjective.length, '· O', r.report.objective.length, '·', r.report.header);

  // assertions — the reflection must be grounded in the seeded record (48/19/12/7)
  const groundedRe = /\b(48|19|12|7|50)\b/;
  const grounded = groundedRe.test(r.story.delta + ' ' + r.story.objective.join(' '));
  const ok = !!r.feelingValidation && !!r.story.delta && grounded && r.report.objective.length > 0 && distinct >= 3;

  console.log('\n── gates ──');
  console.log('  chat varied (≥3 distinct openers):', distinct >= 3 ? '✓' : '✗');
  console.log('  reflection grounded in the record:', grounded ? '✓' : '✗');
  console.log('  provider report built (S + O)    :', r.report.objective.length > 0 ? '✓' : '✗');
  console.log('\n' + (ok ? '✅ E2E FLOW OK — chat → reflection → report, end to end, grounded.' : '✗ E2E gaps (see gates).'));
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error('E2E FAILED:', e instanceof Error ? e.message : e);
  process.exit(1);
});
