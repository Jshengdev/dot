// test-e2e.ts — validate the backend EXPERIENCE end to end on the ANXIETY HERO:
//   a few chat turns (mode-routed + varied, through Grok) → the full grounded
//   reflection (the catch) → the provider report. One run, real output.
// `pnpm --filter @dot/backend exec tsx src/test-e2e.ts`
//
// LOCKED HERO (docs/sample-story.json, id 'anxiety-hero'): the person privately
// journals daily panic attacks, arm-scratching, "sleep forever", but out loud says
// "just a nervous person, lowkey chilling". The split must validate the feeling
// first, never invalidate, and ground the objective record in the SEEDED anxiety
// events (6 panic_attack · 2 self_harm · 2 sleep · 1 ideation) — NOT the old
// social/loneliness numbers.
import { store } from './store.js';
import { seedDemoUser, DEMO_USER_ID } from './seed.js';
import { chatReply, routeMode } from './imessage/chat.js';
import { runStory } from './run.js';

// The real demo journal (docs/sample-story.json transcript.journal), the exact text
// that produced the locked feeling_validation / objective[4] / subjective[3] / delta.
const JOURNAL =
  "I think I've had at least one panic attack a day this week haha. After every club event. My chest hurts like hell. I can't breathe, I can't even see anything because my vision is blurry bc I don't get enough air. It hurtsssss. It flipping hurts. I end up scratching my arms during club meetings to keep myself calm bc otherwise I just can't breathe I can't concentrate. Life lowkey sucks right now. All I want to do is sleep forever and forever. I'm so exhausted. But I also can't, if I stop moving at any point it feels like I'm missing out on too much.";

// A few turns: the journal, then the minimized out-loud version, plus light chatter
// — so the chat is varied AND the record accumulates before the catch.
const TURNS = [
  JOURNAL,
  'honestly though if a therapist asked i\'d just say it was a long week but not too bad. im just a nervous person, my chest hurts a bit but we\'re lowkey chilling.',
  'i spent the whole day yapping in IYA lol, kept kidnapping people to talk. might go the beach saturday?',
  'lowkey though i\'m not likeable enough. other people get along so easily and it feels like there\'s a wall between me and them.',
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

  console.log('════════ E2E · the grounded reflection (the catch — the anxiety hero) ════════\n');
  // The catch runs on the journal itself — the exact text behind the locked split.
  const r = await runStory({ userId: DEMO_USER_ID, transcript: JOURNAL });
  console.log('feelingValidation:', r.feelingValidation);
  console.log('subjective      :', JSON.stringify(r.story.subjective));
  console.log('objective       :', JSON.stringify(r.story.objective));
  console.log('delta           :', r.story.delta);
  console.log('stats           :', r.stats.map((s) => `${s.label}=${s.count}`).join(' · '));
  console.log('report          : S', r.report.subjective.length, '· O', r.report.objective.length, '·', r.report.header);

  // ── gates ──
  // 1) validate-first: the validation names the feeling/body as real, never invalidates.
  const fv = (r.feelingValidation ?? '').toLowerCase();
  const validatesFirst = !!r.feelingValidation && /real|valid|understandable|makes sense|hear/.test(fv);
  const neverInvalidates = !/(you're fine|you are fine|overreacting|not that bad|it's normal|its normal|calm down)/.test(
    fv + ' ' + r.story.delta.toLowerCase(),
  );

  // 2) grounded in the SEEDED anxiety record — the objective/delta must reference the
  //    real panic-after-club / scratching / 6-day pattern (NOT 48/19/12 social numbers).
  const hay = (r.story.delta + ' ' + r.story.objective.join(' ')).toLowerCase();
  const groundedAnxiety = /panic|club|scratch|breathe|chest/.test(hay) && /\b6\b|every|daily|each/.test(hay);

  // 3) provider report built (S + O).
  const reportBuilt = r.report.subjective.length > 0 && r.report.objective.length > 0;

  const ok =
    distinct >= 3 && validatesFirst && neverInvalidates && groundedAnxiety && reportBuilt;

  console.log('\n── gates ──');
  console.log('  chat varied (≥3 distinct openers)       :', distinct >= 3 ? '✓' : '✗');
  console.log('  validates the feeling first             :', validatesFirst ? '✓' : '✗');
  console.log('  never invalidates (no "you\'re fine")     :', neverInvalidates ? '✓' : '✗');
  console.log('  grounded in the seeded ANXIETY record   :', groundedAnxiety ? '✓' : '✗');
  console.log('  provider report built (S + O)           :', reportBuilt ? '✓' : '✗');
  console.log('\n' + (ok ? '✅ E2E FLOW OK — chat → validate-first reflection → grounded anxiety report.' : '✗ E2E gaps (see gates).'));
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error('E2E FAILED:', e instanceof Error ? e.message : e);
  process.exit(1);
});
