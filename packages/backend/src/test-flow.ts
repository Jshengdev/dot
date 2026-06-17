// test-flow.ts — THE END-TO-END LIVE PROOF. ONE job: drive the WHOLE live engine
// on REAL Grok, no mocks, no seed, and assert the objective mirror actually forms
// from a conversation alone. This is the gate that proves the live modules wire
// together: converse → graph → plan → report → scheduler.
//
// The shape of the proof (the live demo path, headless):
//   1. a FRESH user (createUser — NOT seedDemoUser; the objective record must be
//      DERIVED from what's said, not seeded as counter-evidence).
//   2. a multi-turn intake: a scripted anxious-student yap, split into ~5 realistic
//      turns (daily panic minimized, chest pain, arm-scratching, "sleep forever"
//      exhaustion). converseTurn per turn until shouldClose, updateGraph after each
//      user turn so the graph builds incrementally, then closeConversation.
//   3. buildPlan — the forward check-ins anchored to real graph nodes.
//   4. buildLiveReport — the provider S/O record assembled from the live graph.
//   5. tick the scheduler once at a `now` past the first check-in's scheduledFor
//      (DOT_CHECKIN_SCALE compresses the wait) — a real check-in must fire.
//   6. ASSERT the mirror formed: a symptom node, a fact_objective node, a
//      minimizes/contradicts edge, a risk_signal node; panic_attack events COUNTED
//      FROM THE CONVERSATION; plan length >= 2; report S + O both non-empty; >= 1
//      check-in fired. A failure THROWS (no silent green); a pass prints PASS lines.
//
// Run:  pnpm --filter @dot/backend test:flow
//   (set DOT_CHECKIN_SCALE high to compress the forward timer — this file sets a
//    default so the scheduled check-in is due at the advanced `now` below.)
//
// Determinism: a fixed base `now`, advanced per turn (no Date.now in the flow).
// Fail loud: every model/parse error throws straight up — this is a REAL Grok run,
// a dead path must be visible, never masked.

// Compress the forward timer BEFORE the modules read it: a 24h offset at scale=1440
// becomes 60s, so the first check-in is comfortably due at the +2h advanced `now`
// we tick at. (Env-respecting: if the runner already set a scale, keep it.)
if (!process.env.DOT_CHECKIN_SCALE) process.env.DOT_CHECKIN_SCALE = '1440';

import { store } from './store.js';
import { converseTurn, closeConversation } from './converse.js';
import { updateGraph } from './graph.js';
import { buildPlan } from './plan.js';
import { buildLiveReport } from './report.js';
import { tick } from './scheduler.js';
import { REASONING_MODEL } from './grok.js';
import type { Graph } from './types.js';

// ── The scripted intake (EDITABLE demo COPY) ──────────────────────────────────
// One anxious student's story, split into ~5 realistic turns. Each turn MINIMIZES
// while describing the objective facts in the same breath — the two-truths gap is
// baked in (she calls it "fine" while listing daily panic, chest pain, scratching,
// and wanting to sleep forever). The graph should surface all four panels from this.
const INTAKE_TURNS: string[] = [
  "hey. honestly i'm fine, just been a normal busy week with finals. lowkey chilling. " +
    "i guess my chest gets kind of tight before my study group every morning but it's nothing.",
  "ok it's not really nothing. it's been every single day this week, like 6 days now. " +
    "right before group my heart races and i can't breathe and my hands go numb. it passes though, " +
    "i just wait it out in the bathroom. everyone else seems totally fine so it's probably just me being dramatic.",
  "the chest pain is the worst part, it actually hurts, like a real ache, not just in my head. " +
    "and when it gets bad i scratch my arm until it calms down. there are some marks now. " +
    "i'm not like, doing anything serious, it just helps me come back to my body.",
  "i haven't really slept. maybe 3 hours a night for the last week? i'm so tired that honestly " +
    "some nights i just want to sleep forever and not wake up for a while. not in a scary way. " +
    "i don't have a plan or anything, i just want the tiredness to stop.",
  "i don't know why i'm telling you all this. it's really not a big deal, other people have it way " +
    "worse. i'm handling it. i just needed to get it out i guess. thanks for listening.",
];

// ── timing: a fixed base now, advanced per turn so each ts is distinct + ordered ──
const BASE_NOW = '2026-06-14T09:00:00.000Z';
const TURN_GAP_MS = 60_000; // 1 minute between turns (keeps message ts strictly increasing)
const CLOSE_GAP_MS = 60_000; // close lands one beat after the last turn
const TICK_OFFSET_MS = 2 * 3_600_000; // tick 2h after close — past the (compressed) first check-in

function isoAfter(base: string, ms: number): string {
  return new Date(Date.parse(base) + ms).toISOString();
}

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FLOW FAILED: ${msg}`);
}

// ── readable graph summary (counts by node type + by edge type) ───────────────
function graphShape(graph: Graph): { nodes: Record<string, number>; edges: Record<string, number> } {
  const nodes: Record<string, number> = {};
  for (const n of graph.nodes) nodes[n.type] = (nodes[n.type] ?? 0) + 1;
  const edges: Record<string, number> = {};
  for (const e of graph.edges) edges[e.type] = (edges[e.type] ?? 0) + 1;
  return { nodes, edges };
}

async function main(): Promise<void> {
  console.log(`model: ${REASONING_MODEL}`);
  console.log(`checkin scale: ${process.env.DOT_CHECKIN_SCALE} (forward timer compression)\n`);

  // ── 1. a FRESH user (no seed — the objective record must come from the talk) ──
  const user = store.createUser({ name: 'Flow Patient', createdAt: BASE_NOW });
  const userId = user.id;
  console.log(`user: ${userId}  (fresh, NOT seeded)\n`);

  // ── 2. the multi-turn live intake ────────────────────────────────────────────
  console.log('── LIVE INTAKE (converseTurn per turn, updateGraph after each) ──');
  let closed = false;
  let lastTurnNow = BASE_NOW;
  for (let i = 0; i < INTAKE_TURNS.length; i++) {
    const turnNow = isoAfter(BASE_NOW, i * TURN_GAP_MS);
    lastTurnNow = turnNow;
    const text = INTAKE_TURNS[i]!;

    const turn = await converseTurn({ userId, text, now: turnNow });
    console.log(`\n[turn ${i + 1}] user: ${text.slice(0, 72)}${text.length > 72 ? '…' : ''}`);
    console.log(`         dot:  ${turn.reply.slice(0, 110)}${turn.reply.length > 110 ? '…' : ''}`);
    console.log(
      `         coverage=${turn.coverage.toFixed(2)} shouldClose=${turn.shouldClose}` +
        (turn.missing.length ? ` missing=[${turn.missing.slice(0, 3).join(', ')}]` : ''),
    );

    // fold THIS user turn (+ DOT's reply) into the graph before the next probe.
    await updateGraph({ userId, now: turnNow });

    if (turn.shouldClose) {
      closed = true;
      break;
    }
  }

  // DOT closes the conversation herself (the two-truths reflection said back).
  const closeNow = isoAfter(lastTurnNow, CLOSE_GAP_MS);
  const close = await closeConversation({ userId, now: closeNow });
  console.log(`\n── CLOSE (DOT wraps it herself) ────────────────────────────────`);
  console.log(`  ${close.closing.slice(0, 200)}${close.closing.length > 200 ? '…' : ''}`);
  // a final graph pass so the closing turn is chunked too (idempotent).
  await updateGraph({ userId, now: closeNow });
  console.log(`\n  (director ${closed ? 'chose to close' : 'hit the turn cap'})`);

  // ── 3. the forward check-in plan (anchored to real graph nodes) ──────────────
  const plan = await buildPlan({ userId, now: closeNow });
  console.log(`\n── PLAN (${plan.length} forward check-ins) ─────────────────────────────`);
  for (const c of plan) {
    console.log(`  • watching=${c.watching}  due=${c.scheduledFor}`);
    console.log(`    "${c.prompt.slice(0, 100)}${c.prompt.length > 100 ? '…' : ''}"`);
  }

  // ── 4. the provider report assembled from the live graph (pure reads) ────────
  const report = buildLiveReport({ userId, now: closeNow });

  // ── 5. tick the scheduler once, past the first check-in's (compressed) due ────
  const tickNow = isoAfter(closeNow, TICK_OFFSET_MS);
  const due = store.getDueCheckIns(tickNow);
  console.log(`\n── SCHEDULER (tick at ${tickNow}; ${due.length} due) ──`);
  const fired = await tick({ now: tickNow });
  for (const f of fired) {
    const msg = store.getMessages(userId, 1)[0];
    console.log(`  fired ${f.id} (watching ${f.watching}) → "${(msg?.content ?? '').slice(0, 100)}"`);
  }

  // ── the resulting graph, plan, report — readable JSON ────────────────────────
  const graph = store.getGraph(userId);
  const shape = graphShape(graph);
  console.log(`\n── GRAPH SHAPE ─────────────────────────────────────────────────`);
  console.log(`  nodes by type: ${JSON.stringify(shape.nodes)}`);
  console.log(`  edges by type: ${JSON.stringify(shape.edges)}`);
  console.log(`  total: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);

  console.log(`\n── PLAN (json) ─────────────────────────────────────────────────`);
  console.log(
    JSON.stringify(
      plan.map((c) => ({ watching: c.watching, prompt: c.prompt, scheduledFor: c.scheduledFor })),
      null,
      2,
    ),
  );

  console.log(`\n── REPORT (json) ───────────────────────────────────────────────`);
  console.log(
    JSON.stringify(
      {
        header: report.header,
        preparedFor: report.preparedFor,
        date: report.date,
        subjective: report.subjective,
        objective: report.objective,
        gap: report.gap,
        risk: report.risk,
        symptoms: report.symptoms.map((s) => `${s.name}: ${s.summary}`),
        timeline: report.timeline.map((t) => `${t.name}: ${t.summary}`),
      },
      null,
      2,
    ),
  );

  // ── 6. THE ASSERTIONS (a failure throws; a pass prints a PASS line) ──────────
  console.log(`\n── ASSERTIONS ──────────────────────────────────────────────────`);

  const symptomCount = graph.nodes.filter((n) => n.type === 'symptom').length;
  assert(symptomCount >= 1, `expected >=1 symptom node, got ${symptomCount}`);
  console.log(`  PASS  symptom nodes: ${symptomCount} (>=1)`);

  const factCount = graph.nodes.filter((n) => n.type === 'fact_objective').length;
  assert(factCount >= 1, `expected >=1 fact_objective node, got ${factCount}`);
  console.log(`  PASS  fact_objective nodes: ${factCount} (>=1)`);

  const gapEdges = graph.edges.filter((e) => e.type === 'minimizes' || e.type === 'contradicts');
  assert(
    gapEdges.length >= 1,
    `expected >=1 minimizes/contradicts edge (the two-truths signal), got ${gapEdges.length}`,
  );
  console.log(`  PASS  two-truths edges (minimizes|contradicts): ${gapEdges.length} (>=1)`);

  const riskCount = graph.nodes.filter((n) => n.type === 'risk_signal').length;
  assert(riskCount >= 1, `expected >=1 risk_signal node, got ${riskCount}`);
  console.log(`  PASS  risk_signal nodes: ${riskCount} (>=1)`);

  // the OBJECTIVE RECORD is now the classified clinical signals (the validated meta
  // format) — derived from the talk, not seeded, each count justified by its basis.
  const signals = store.getSignals(userId);
  const panic = signals.find((s) => s.kind === 'panic_attack');
  assert(!!panic && panic.count > 0, `expected a panic_attack signal with count>0, got ${JSON.stringify(panic)}`);
  console.log(`  PASS  panic signal: count ${panic!.count} · ${panic!.countBasis} · ${panic!.confidence} confidence`);
  // every signal carries the full meta (a reader can classify it without guessing)…
  for (const s of signals) {
    assert(
      typeof s.count === 'number' && !!s.status && !!s.countBasis && !!s.confidence && !!s.basis,
      `signal ${s.id} is missing meta fields: ${JSON.stringify(s)}`,
    );
    // …and the NO-INFLATION contract holds: a single mention can never exceed count 1.
    assert(
      s.countBasis !== 'single-mention' || s.count <= 1,
      `INFLATION: ${s.id} is 'single-mention' but count=${s.count}`,
    );
  }
  console.log(`  PASS  ${signals.length} signals — full meta on each, no single-mention inflation`);

  assert(plan.length >= 2, `expected plan length >=2, got ${plan.length}`);
  console.log(`  PASS  plan length: ${plan.length} (>=2)`);

  assert(report.subjective.length > 0, 'report.subjective is empty (no felt claims in the S column)');
  assert(report.objective.length > 0, 'report.objective is empty (no facts/counts in the O column)');
  console.log(
    `  PASS  report S/O non-empty: subjective=${report.subjective.length}, objective=${report.objective.length}`,
  );

  assert(fired.length >= 1, `expected >=1 check-in to fire at the advanced now, got ${fired.length}`);
  console.log(`  PASS  check-ins fired: ${fired.length} (>=1)`);

  console.log(`\nALL FLOW ASSERTIONS GREEN.  (the mirror formed from the conversation alone.)`);
}

main().catch((err) => {
  console.error('\nFLOW GATE FAILED:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
