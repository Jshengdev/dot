// ── DEMO CONTENT (all editable — content ≠ structure) ────────────────────────
// DOT = the objective mirror for anxiety. The thread: someone who feels unreachable
// and alone, while the record shows people reaching for them (50 texts, calls). DOT
// validates the feeling, never invalidates, and surfaces the delta as a neutral fact.

export type Turn = { from: 'dot' | 'user'; text: string };

export const DOT = {
  hi: 'hi, this is dot.',
  pokes: [
    'hey — why are you poking me?',
    'ow. quit it.',
    "okay okay, i'm awake.",
    'you again? hi.',
  ],
  beginPrompt: "so — tell me how you've actually been. no clean version.",
  practiceClose:
    "hey bud — i'll check in with ya on imessage. so don't leave me hanging, okay?",
};

// Phase 2 — practice: 2–3 turns where DOT "gets" you before the real thing.
export const PRACTICE: Turn[] = [
  { from: 'dot', text: 'heavy how — tired-heavy, or everything-is-too-much heavy?' },
  { from: 'user', text: "like no one would notice if i disappeared for a week." },
  { from: 'dot', text: "that's a lonely thought. i won't tell you it's wrong. when did someone last reach for you?" },
  { from: 'user', text: '...sam texted me yesterday. and the day before, i think.' },
  { from: 'dot', text: "noted. i'm keeping count — not judging. keep going." },
];

export const PRACTICE_TRANSCRIPT_PLACEHOLDER =
  "paste your full session transcript here…\n\n(for the demo: the 15-minute unload — every thread, every spiral, every 'i'm fine'. DOT chunks it into the graph later.)";

export const SAMPLE_TRANSCRIPT =
  "i keep telling everyone i'm fine. i'm not fine. it feels like everyone's slowly backing away and i'm the only one who notices. my chest gets tight every sunday night before the week starts. i didn't reply to sam for three days because what's the point. my sister called twice and i let it ring. i think i'm a burden. i logged another panic thing on tuesday. that's like the third sunday in a row. nobody would notice if i just went quiet for a while.";

// Phase 3 — check-ins. VOICE (locked, see memory dot-checkin-voice): objective
// reminders + body/contact data prompts — NOT "are you ok", not comfort, not
// counseling (that rings empty). Warm in tone, factual in substance.
export const CHECKINS: { after: string; objective: string; turns: Turn[] }[] = [
  {
    after: '1 day later',
    objective: 'log the body — water, panic',
    turns: [
      { from: 'dot', text: 'quick one. did you drink water today?' },
      { from: 'user', text: '...barely. mostly coffee.' },
      { from: 'dot', text: 'logged. and the chest — any panic today? yes or no.' },
      { from: 'user', text: 'no. today was actually okay.' },
      { from: 'dot', text: 'noted — a day without one. that goes in the record too.' },
    ],
  },
  {
    after: '4 days later',
    objective: 'the record — contact, factual',
    turns: [
      { from: 'dot', text: 'reminder, not a question: people reached for you this week. sam twice, your sister called.' },
      { from: 'user', text: "i didn't reply to any of them." },
      { from: 'dot', text: "okay — not grading you. if today's heavy, you could send one of them a single word. just leaving that here." },
    ],
  },
];

// Phase 4 — logs / knowledge graph. The "yap node" branches into chunks. Each chunk
// is a FACT (objective → goes to the provider, stays its own point) or STORY
// (subjective → connects into the narrative thread).
export type LogNode = {
  id: string;
  label: string;
  kind: 'fact' | 'story';
  detail: string;
};

export const YAP = 'the unload';
export const LOG_NODES: LogNode[] = [
  { id: 's1', kind: 'story', label: 'no one would notice if i vanished', detail: 'core belief — perceived unreachability' },
  { id: 'f1', kind: 'fact', label: '50 texts received / 7 days', detail: 'from 7 distinct people' },
  { id: 's2', kind: 'story', label: "everyone's pulling away", detail: 'mind-reading distortion' },
  { id: 'f2', kind: 'fact', label: '21 panic logs / 21 days', detail: 'self-reported, daily' },
  { id: 's3', kind: 'story', label: "i'm a burden", detail: 'discounting-the-positive' },
  { id: 'f3', kind: 'fact', label: '3 episodes — sunday night', detail: 'anticipatory, pre-work-week' },
  { id: 's4', kind: 'story', label: "i'm fine, it's nothing", detail: 'minimization / masking' },
  { id: 'f4', kind: 'fact', label: 'sister called 2×, unanswered', detail: 'avoidance behavior' },
];

// Phase 5 — summary
export const SUMMARY = {
  headline: 'a three-week gap between how alone you felt and how reached-for you were.',
  timeline:
    "you came in certain no one would notice if you disappeared. over three weeks the record told a different story: fifty texts from seven people, two calls from your sister you let ring, and a tight chest that shows up every sunday night before the work week. the feeling was real. so was the reaching.",
  stats: [
    { metric: 'perceived contact', value: '~0', unit: 'felt' },
    { metric: 'actual contact', value: '50', unit: 'texts / wk' },
    { metric: 'panic logs', value: '21', unit: 'in 21 days' },
    { metric: 'sunday cluster', value: '3', unit: 'weeks running' },
  ],
  recommendation:
    'a provider will look for the gap itself — perceived isolation far below actual contact points to cognitive distortion (mind-reading, discounting the positive). The daily panic logs + the Sunday-night cluster suggest generalized + anticipatory anxiety. Bring the dates; lead with the gap.',
  detailed: [
    'Distortions present: mind-reading ("everyone\'s pulling away"), discounting-the-positive ("i\'m a burden"), minimization ("i\'m fine").',
    'Avoidance: 3-day reply gap to a friend; 2 unanswered calls from a sibling.',
    'Somatic: chest tightness, 21 self-logged episodes in 21 days, clustering Sunday evenings.',
    'Protective: still logging, still showing up, still talking to DOT — engagement is intact.',
  ],

  // the shareable, clearly-defined provider report — specific logs of what happened
  report: {
    title: 'DOT — objective summary',
    window: 'may 25 – jun 13, 2026 · 3 weeks',
    oneLine:
      'Persistent gap between perceived isolation and actual social contact, plus a daily-logged panic pattern clustering Sunday evenings. Engagement intact.',
    objectiveLogs: [
      { date: 'jun 1 · sun', note: 'panic episode logged — evening, pre-work-week' },
      { date: 'jun 2 · mon', note: '8 texts received from 3 people · 0 replies sent' },
      { date: 'jun 4 · wed', note: 'sister called · unanswered' },
      { date: 'jun 8 · sun', note: 'panic episode logged — evening' },
      { date: 'jun 9 · mon', note: 'sister called again · unanswered' },
      { date: 'jun 9–13', note: '50 texts received / 7 days, from 7 distinct people' },
      { date: '21-day total', note: '21 panic episodes self-logged (≈daily)' },
    ],
    subjectiveClaims: [
      '“no one would notice if i vanished”',
      '“everyone’s pulling away”',
      '“i’m a burden”',
      '“i’m fine, it’s nothing”',
    ],
    impression:
      'Perceived unreachability (felt ≈0 contact) contradicted by the record (50 texts/wk, 7 people, 2 sibling calls). Cognitive distortions: mind-reading, discounting-the-positive, minimization. Somatic anxiety with a Sunday-evening anticipatory cluster (3 weeks running).',
    screenFor: ['generalized anxiety (GAD)', 'panic disorder', 'anticipatory / anticipatory-cluster anxiety'],
    note: 'All event data is patient-logged via DOT. Lead with the perceived-vs-actual gap; the dated logs above are the evidence.',
  },
};
