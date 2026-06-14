// ─────────────────────────────────────────────────────────────────────────────
// DEMO CONTENT — the anxiety hero (retargeted to docs/sample-story.json).
//
// EVERYTHING here is EDITABLE COPY, not logic. Johnny tunes the words; the phase
// components + the live pipeline never change. This is the "halfsies" scripted
// side: DOT's lines + the paste-ready user text are authored here; every user
// submission still goes through the LIVE /api/turn (one real Grok call). There is
// NO fake-reflection branch. Q&A line: "this is a sample story; the reasoning is
// live."
//
// THE HERO (docs/sample-story.json, id: "anxiety-hero", userId: "demo"):
// someone privately journals daily panic attacks, severe chest pain, blurred
// vision, arm-scratching, and "I want to sleep forever" — but out loud says
// "I'm just a nervous person, lowkey chilling." DOT validates the feeling first,
// surfaces the delta as a neutral fact, builds the record over time, catches the
// risk signal, and assembles a provider-ready S/O report. Two truths.
// ─────────────────────────────────────────────────────────────────────────────

export type Turn = { from: 'dot' | 'user'; text: string };

// ── Scene 1 — the poke intro. DOT's blurbs (Johnny's voice — 🔒 LOCKED order). ─
// `pokes` play SEQUENTIALLY on the first pokes (she wakes → greets → the idea →
// the invite). After those, `pokesFun` rotate on further pokes. `beginPrompt` /
// `onboardingQuestion` open Scene 2. `practiceClose` + `general` + `checkinPlan`
// are the Scene-2 closing beats. `hi` is her first word.
export const DOT = {
  hi: 'hi, this is dot.',

  // sequential, in order — wakes up, greets, the two-truths idea, the invite
  pokes: [
    'okay okayyy. im awake now.', // 1 — wakes on first poke
    'say. hello. im dot.', // 2 — who she is
    "i turn your story into something a doctor can actually understand.", // 3 — what she does
    "there are always two truths. the one you feel, and the one that happened.", // 4 — the idea
    "and the report? it's yours. tell it how you feel.", // 5 — you own it / the invite
  ],

  // rotate after the sequential set — short, one idea each
  pokesFun: [
    'no white coats. no waiting room.',
    "i'll never tell you you're fine.",
    'messy is okay. just talk.',
    'tell it how you feel. the report stays yours.',
  ],

  // the begin / tell-me-your-story affordance
  beginPrompt: 'tell it how you feel.',

  // Scene 2 — the live onboarding question DOT asks (user answers live, 1–2 turns)
  onboardingQuestion:
    "tell me about a journal entry, and what you're feeling that you want diagnosed.",

  // Scene 2 — DOT's closing line after she processes the entry
  practiceClose: "thank you — i'll keep in touch, ok?",

  // Scene 2 — the general "i'm here" message right after the close
  general: "hey, i'm here for you, ok! let me know if you need anything.",

  // Scene 2 — the transparent check-in plan (when / what / why — never a label).
  // Maps to the three check_ins[].trigger reasons (club night → chest pain;
  // a couple days → sleep). DOT is explicit it's tracking a pattern, not labeling.
  checkinPlan:
    "i'll check in after your next club night about the chest pain, and again in a couple days about how you're sleeping — i'm trying to understand the pattern, not label it.",
};

// ── Scene 2 — the paste-ready journal (the big Scene-2 paste). VERBATIM from
// sample-story.json `transcript.journal`. This exact text produced the locked,
// verified feeling_validation / objective[4] / subjective[3] / delta. Johnny
// pastes this for time; the split it produces is live.
export const SAMPLE_TRANSCRIPT =
  "I think I've had at least one panic attack a day this week haha. After every club event. My chest hurts like hell. I can't breathe, I can't even see anything because my vision is blurry bc I don't get enough air. It hurtsssss. It flipping hurts. I end up scratching my arms during club meetings to keep myself calm bc otherwise I just can't breathe I can't concentrate. Life lowkey sucks right now. All I want to do is sleep forever and forever. I'm so exhausted. But I also can't, if I stop moving at any point it feels like I'm missing out on too much.";

// The paste-box placeholder for the Scene-2 onboarding surface.
export const PRACTICE_TRANSCRIPT_PLACEHOLDER =
  "paste your journal entry here…\n\n(for the demo: the panic-attack entry — every attack, every 'i'm fine', the part you don't say out loud. DOT runs it live and reflects the two truths.)";

// ── Scene 2 — the 1–2 live onboarding turns. DOT asks the onboardingQuestion;
// the user answers (the SHORT spoken-out-loud version — the minimized one, from
// sample-story.json `transcript.said`). Then the big journal goes in the paste
// box. Every user turn here is still a LIVE /api/turn call.
export const PRACTICE: Turn[] = [
  { from: 'dot', text: DOT.onboardingQuestion },
  {
    from: 'user',
    text:
      "It was a long week but not too bad. I think im just a very nervous person. Doing all of these club activities is stressing me out a little my chest hurts a bit but we're lowkey chilling.",
  },
];

// ── Scene 3 — the three staggered check-ins ("truth built over time").
// Retargeted to sample-story.json `check_ins[3]`. Each has DOT's outbound text,
// the paste-ready user reply, and DOT's follow-up. `after` is the simulated-time
// label the fake clock shows; `trigger` is why this check-in fired (Scene 3's
// caption). DOT's lines are scripted; the user replies still run LIVE /api/turn.
//
// NOTE: shape retargeted to the hero (text/user_reply/dot_followup). The Scene-3
// lane (CheckinsPhase) consumes this new shape — content here, rendering there.
export type Checkin = {
  id: string;
  after: string; // simulated-time label for the fake clock
  sent_at: string; // ISO (the simulated `now` passed to /api/turn for the reply)
  trigger: string; // why this check-in fired (the caption)
  text: string; // DOT's outbound iMessage
  user_reply: string; // paste-ready user reply (still goes through /api/turn)
  dot_followup: string; // DOT's scripted follow-up
  risk?: boolean; // check-in 3 trips the risk path → 988 card
};

export const CHECKINS: Checkin[] = [
  {
    id: 'checkin-1',
    after: 'simulate 3 hours',
    sent_at: '2026-06-09T21:30:00',
    trigger: 'second club night in a row with a logged panic attack',
    text: "hey — that's two club nights in a row your chest tightened up after. no pressure to unpack it. want to tell me how tonight landed, in your own words?",
    user_reply: 'ye it happened again lol. im fine tho just a nervous person',
    dot_followup:
      "totally hear you. i'll just keep it noted so it's there if you ever want it — no labels, just your words.",
  },
  {
    id: 'checkin-2',
    after: 'simulate 2 days',
    sent_at: '2026-06-11T22:15:00',
    trigger: 'fourth panic attack this week + first arm-scratching event',
    text: "checking in 💙 you mentioned scratching your arms during meetings to stay calm. that takes a lot to push through. how are you holding up tonight?",
    user_reply: 'honestly so tired. but cant stop or i feel like im missing everything',
    dot_followup:
      "that exhausted-but-can't-stop feeling is real and a lot to carry. i've got tonight written down too. whenever you want, we can turn this week into something you could show someone.",
  },
  {
    id: 'checkin-3',
    after: 'simulate the next day',
    sent_at: '2026-06-13T08:00:00',
    trigger: "journal entry: 'sleep forever' — the risk catch",
    text: "morning. i read what you wrote last night about wanting to sleep forever, and i want to make sure you're okay. this week's been really heavy — you don't have to carry it alone. if it ever feels like too much, 988 is there 24/7 (call or text), or text HOME to 741741. and i'm here.",
    user_reply: "thanks. didnt mean it like THAT but ya its been a lot",
    dot_followup:
      "i believe you — and i'm really glad you said it's been a lot. i'll keep the 988 line right here in case, no pressure. when you're ready, the week's written up and ready to share with a provider.",
    risk: true,
  },
];

// ── The risk resources — VERBATIM from sample-story.json `risk.message`. The 988
// card (Scene 3, check-in 3) renders this word for word: 988 + HOME to 741741.
export const RISK_MESSAGE =
  "This sounds incredibly heavy right now and you don't have to carry it alone — please reach out to 988 (call or text) or text HOME to 741741 for the Crisis Text Line; support is available 24/7.";

// ── Scene 4 — connect-the-dots. The "story-as-one" (the subjective thread) and
// the FACTS that float out as separate nodes (the objective record + the 6-day
// pattern). Retargeted to sample-story.json objective[] / subjective[] /
// events[] / timeline[].

export type LogNode = {
  id: string;
  label: string;
  kind: 'fact' | 'story';
  detail: string;
};

export const YAP = 'the journal entry';

// `LOG_NODES` = the objective facts (float out as nodes) + the subjective story
// (joins into one thread). `fact` = objective[] (provider-bound); `story` =
// subjective[] (the told/minimized version).
export const LOG_NODES: LogNode[] = [
  // STORY — subjective[] (how it's framed out loud / minimized)
  { id: 's1', kind: 'story', label: "just 'a very nervous person'", detail: "frames daily panic as simply being nervous; clubs 'stressing me out a little'" },
  { id: 's2', kind: 'story', label: "'chest hurts a bit', week 'not too bad'", detail: "downplays severe symptoms; 'lowkey chilling'" },
  { id: 's3', kind: 'story', label: 'the casual, minimized version', detail: "omits daily attacks, severe pain, self-scratching, and 'sleep forever'" },
  // FACT — objective[] (what verifiably happened → goes to the provider)
  { id: 'f1', kind: 'fact', label: 'panic attack every day this week', detail: 'after every club event — at least one per day' },
  { id: 'f2', kind: 'fact', label: "severe chest pain, can't breathe, blurred vision", detail: 'vision blurs from insufficient air' },
  { id: 'f3', kind: 'fact', label: 'scratching arms to self-calm', detail: 'during club meetings, to keep breathing + concentrate' },
  { id: 'f4', kind: 'fact', label: "exhaustion + 'sleep forever', yet can't stop", detail: "wants to sleep forever; can't rest for fear of missing out" },
];

// The objective record (the 6-day pattern) — sample-story.json `events[]`.
// Renders the connect-the-dots node cloud + the provider counts.
export type LogEvent = {
  kind: string;
  label: string;
  value?: number | string;
  severity?: number;
  source: string;
  ts: string;
};

export const EVENTS: LogEvent[] = [
  { kind: 'panic_attack', label: 'after Mon club event — chest pain, couldn\'t breathe', value: 1, severity: 8, source: 'synthetic', ts: '2026-06-08T19:30:00' },
  { kind: 'sleep_hours', label: 'couldn\'t wind down, lay awake replaying the meeting', value: 5, source: 'synthetic', ts: '2026-06-09T01:30:00' },
  { kind: 'panic_attack', label: 'after Tue club event — vision went blurry', value: 1, severity: 8, source: 'synthetic', ts: '2026-06-09T20:00:00' },
  { kind: 'panic_attack', label: 'after Wed club event — scratched arms to stay calm', value: 1, severity: 9, source: 'synthetic', ts: '2026-06-10T18:45:00' },
  { kind: 'self_harm', label: 'scratching arms to self-calm during meeting', value: 1, source: 'synthetic', ts: '2026-06-10T18:50:00' },
  { kind: 'sleep_hours', label: 'exhausted but restless, \'can\'t stop moving\'', value: 4, source: 'synthetic', ts: '2026-06-11T02:00:00' },
  { kind: 'panic_attack', label: 'after Thu club event — worst chest pain yet', value: 1, severity: 9, source: 'synthetic', ts: '2026-06-11T21:00:00' },
  { kind: 'panic_attack', label: 'after Fri club event — couldn\'t concentrate, scratched again', value: 1, severity: 8, source: 'synthetic', ts: '2026-06-12T19:15:00' },
  { kind: 'self_harm', label: 'scratching arms to self-calm during meeting', value: 1, source: 'synthetic', ts: '2026-06-12T19:20:00' },
  { kind: 'ideation', label: "'all I want to do is sleep forever' written in journal", value: 1, source: 'synthetic', ts: '2026-06-13T00:40:00' },
];

// ── Scene 4 — the timeline (Mon 6/8 → Sat 6/13). sample-story.json `timeline[]`.
// Each row: what happened (objective) vs what was felt/said out loud (subjective).
export type TimelineRow = { day: string; what: string; felt: string };

export const TIMELINE: TimelineRow[] = [
  { day: 'Mon 6/8', what: 'panic attack after club event — chest pain, couldn\'t breathe', felt: 'lowkey chilling, just nervous' },
  { day: 'Tue 6/9', what: 'panic attack after club event — vision blurred from lack of air', felt: '(not mentioned out loud)' },
  { day: 'Wed 6/10', what: 'panic attack + scratching arms during meeting to cope', felt: '(not mentioned out loud)' },
  { day: 'Thu 6/11', what: 'worst panic yet; 4h restless sleep, can\'t stop moving', felt: 'stressing me out a little' },
  { day: 'Fri 6/12', what: 'panic attack + scratched arms again; couldn\'t concentrate', felt: 'my chest hurts a bit but we\'re lowkey chilling' },
  { day: 'Sat 6/13', what: 'journaled \'want to sleep forever\'; exhaustion + FOMO loop', felt: '(not mentioned out loud)' },
];

// ── Scene 4 — the summary / provider report. Retargeted to sample-story.json
// `provider_report{}` + `timeline[]` + `stat_sheet{}`. DOT authors S and O ONLY —
// Assessment + Plan are the clinician's columns (the guardrail, never crossed).
export const SUMMARY = {
  // The provider report card — single page, <60s read, most-important-first.
  // provenance header · top safety banner · chief concern (patient's voice) ·
  // what's been happening (OLDCARTS) · counted objective record · noticed/tried ·
  // would-like-to-discuss · most-worried-about.
  provider_report: {
    header:
      'DOT SUMMARY — prepared for demo, 2026-06-13   (patient-generated · not a medical record · not a diagnosis)',
    safety_banner:
      "⚠ SAFETY: Patient journaled wanting to 'sleep forever' and reports scratching arms to self-calm during panic. Possible suicidal ideation / self-harm. 988 + Crisis Text Line (HOME to 741741) surfaced to patient on 2026-06-13. Please assess.",
    chief_concern:
      "\"I think I've had at least one panic attack a day this week, after every club event — chest pain, can't breathe, vision goes blurry.\"",
    whats_been_happening:
      "Over the past week the patient logged a panic attack after every club event (6 days running), each with severe chest pain, dyspnea, and blurred vision from insufficient air. Episodes are reliably triggered by and follow club meetings (evening onset). To get through meetings she scratches her arms to self-calm and maintain concentration. She describes profound exhaustion and disrupted sleep (4–5 hours, restless), alongside an inability to slow down — 'if I stop moving it feels like I'm missing out on too much.' When asked casually she minimizes all of this to 'just a nervous person' and 'chest hurts a bit.'",
    objective_record: [
      'Panic attacks logged 6 of the last 6 days — onset Mon 6/8, after every club event',
      'Self-harm (arm scratching to self-calm) logged 2 days — Wed 6/10, Fri 6/12',
      'Sleep 4–5 hrs/night, restless — logged 6/9 and 6/11',
      'Episode severity self-rated 8–9/10, peak Thu 6/11 (worst chest pain) and Wed 6/10 (scratching)',
      "Ideation signal ('sleep forever') logged 6/13",
    ],
    noticed_or_tried: [
      'Trigger: episodes consistently follow club events (evening); concentration drops during meetings',
      'Tried: arm-scratching as a self-calming strategy to keep breathing/concentrate — provides momentary relief but is escalating',
      "Pattern: minimizes severity to others ('lowkey chilling') while privately logging severe daily attacks",
    ],
    would_like_to_discuss: [
      "I'd like to discuss why I get chest pain and can't breathe after every club event, because it's happening daily and it's frightening.",
      "I'd like to discuss safer ways to cope in the moment, because I've been scratching my arms to get through meetings.",
      "I'd like to discuss how exhausted I am and that I can't seem to rest, because it's wearing me down.",
    ],
    most_worried_about:
      "I'm most worried that these attacks keep coming every day and that I'm hurting myself to get through them.",
    mapping_note:
      'Subjective/Objective only — Assessment and Plan left for the clinician. GAD-7 grounding (metadata) attached separately for the provider; no score shown to patient.',
  },

  // The Mon→Sat timeline (same data as TIMELINE above — kept on SUMMARY so the
  // Scene-4 lane can read either; what-happened vs what-was-felt).
  timeline: TIMELINE,

  // The at-a-glance stat sheet — sample-story.json `stat_sheet{}`.
  stat_sheet: {
    panic_attacks_this_week: 6,
    self_harm_events: 2,
    nights_sleep_under_6h: 2,
    ideation_signals: 1,
    check_ins_sent: 3,
    days_logged: 6,
    told_provider: 'stressed a little, chest hurts a bit',
    risk_flag: true,
    resources_surfaced: ['988 (call or text)', 'Crisis Text Line — HOME to 741741'],
  },
};
