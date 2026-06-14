# DEMO RUNBOOK — the 5 minutes on stage

> 3-min demo + 2-min Q&A. Structure: **deck (~90s) → live product (~90s) → close (~10s) → Q&A.**
> The whole "is it real?" answer rests on ONE thing: the **two-truths split fires live** on the anxiety journal.
> Everything else is a labeled seed or polish. Honesty line you say out loud: **"This is a sample story; the reasoning is live."**
> Demo subject = your own story (anxiety) — the founder-fit is the point.

---

## 0) BEFORE YOU GO UP (setup — 2 min of prep)

- [ ] **Backend running**, `XAI_API_KEY` loaded, seed aligned to the anxiety hero (`sample-story.json` events). Confirm the gate is green: `pnpm --filter @dot/backend exec tsx src/test-e2e.ts` → exit 0.
- [ ] **Three things open:** (1) the **deck** fullscreen on beat 1 (`deck/index.html`, press `f`); (2) the **product** on Scene 1 (the poke); (3) the **backup video** queued (in case wifi/build flakes).
- [ ] **Paste-ready text in a notes app** (so you can paste fast):
  - the **anxiety journal** (`sample-story.json` → `transcript.journal`)
  - **check-in reply 2** (`check_ins[1].user_reply`)
  - **check-in reply 3 / the risk one** (`check_ins[2].user_reply`)
- [ ] **iMessage/phone ready** if you're showing the texts live.
- [ ] Tone sign-off done (you've read a live `feeling_validation` + `delta` and it validates, never invalidates).

---

## 1) THE DECK — the pitch (~90s)

Fullscreen, arrow through the 15 beats. You **narrate the full line**; the screen holds the short anchor. (Full script: `DECK-SCRIPT.md`.)

| | you SAY (the spine) | screen |
|--|--|--|
| 1 | "Six months ago I had a homework assignment — cold-call strangers, find their pain, pitch a fix." | *i cold-called strangers* |
| 2 | "People facing health problems — as young as 20, as old as 50." | *as young as 20 · as old as 50* |
| 3 | "I expected they wanted the obvious fix. Something else held them back, far more." | *i expected a fix* |
| 4 | "They all wanted the same thing." | *something held them back* |
| 5 | "To feel normal again." | **to feel normal again** |
| 6 | "Then I saw it everywhere. There's a stigma around even asking for help." | *then i saw it everywhere* |
| 7 | "There are always two truths — the story you feel, and what actually happened." | **two truths** |
| 8 | "So you turn to ChatGPT." | *so you turn to AI* |
| 9 | "But AI is built to agree with you. You say 'I'm just being dramatic, right?' — it says 'you're absolutely right.'" | *it just agrees with you* |
| 10 | "That's why I built DOT." | **so i built DOT** |
| 11 | "You tell your story — and DOT holds both truths." | *it holds both* |
| 12 | "It checks in over time — so the truth isn't one loud moment." | *it checks in, over time* |
| 13 | "DOT isn't another AI you talk to instead of a person — it's the one that helps a person finally understand you." | **a bridge — not a replacement** |
| 14 | "DOT. Tell it how you feel." → **"Let me show you."** | *DOT — tell it how you feel* |

→ switch to the product.

---

## 2) THE LIVE PRODUCT — the 4 scenes (~90s)

This is the "halfsies": **you answer 1–2 things live, paste the rest for time, and the split is ALWAYS live.**

### Scene 1 — poke (10s)
- **DO:** poke the dot 3–4 times; she wakes up and introduces herself ("okay okayyy. im awake now." → "say. hello. im dot." → "there are always 2 truths…" → "chat with me. i dont bite."). Hit **begin**.

### Scene 2 — the onboarding + ⭐ THE CATCH (40s — slow down here)
- **DO:** the dot grows; DOT asks "tell me about a journal entry, and what you're feeling." **Type one short answer live** (proves it's live), then **paste the anxiety journal** into the box and send.
- **SEE (the hero moment):** DOT reflects back, in order — **validates the feeling first** ("the chest pain is real"), then the **objective facts** vs the **story you told** ("just a nervous person, lowkey chilling"), then the **delta** as a neutral gap. *Say: "this is a sample story — but that reasoning is live."*
- **DO:** DOT says "thank you — I'll keep in touch, ok?" + the general message + the check-in plan ("I'll check in after your next club night about the chest pain, and again about your sleep").

### Scene 3 — check-ins over time (25s)
- **DO:** click **"simulate 3 hours."** DOT's first check-in appears → **reply live** (one line) → DOT follows up.
- **DO:** click **"simulate next day."** DOT's check-in fires off "sleep forever" → **paste reply 3** → the **988 card** appears (DOT surfaces 988 + Crisis Text Line, stays present, doesn't dismiss the walk-back). *This is the safety beat — let it land.*

### Scene 4 — view my story (15s)
- **DO:** open **"view my story"** → click **"connect the dots"**: the told story pulls into one, the **facts float out**. → click **"see report"**: the **at-a-glance objective vs subjective**, then the **provider report** (clean, S/O only), then the **timeline** of the week.
- **Line:** "You walk out owning this — a story your doctor can finally understand."

---

## 3) THE CLOSE (~10s)
- "Everyone else is building the replacement. We built the bridge." → **"DOT. Tell it how you feel."** → stop.

---

## 4) Q&A — pre-baked answers (2 min)
- **"Is it real or scripted?"** → "The two-truths split is one live `generateObject` call to Grok reasoning through the Vercel AI SDK — on a real journal. The story and the behavioral data are synthetic (PHI); the reasoning is live. Say it plainly."
- **"How is it safe / not a diagnosis?"** → "It produces a *story*, never a diagnosis — validate-first, never sycophantic. A self-harm signal hits a **deterministic** crisis scan → 988 + a human. The model is never the gate on safety."
- **"Built with Inngest / Vercel how?"** → "The split runs through the **Vercel AI SDK** (`@ai-sdk/xai` + `generateObject` + Zod). The durable director — including the **human-on-risk pause** — runs on **Inngest** (`waitForSignal`); you can watch the run pause in the Inngest dashboard."
- **"Why will people use it?"** → "It feels like texting, not a clinical form. The stigma barrier is the channel — dissolved."
- **"What's next?"** → "One engine, output adapts — anxiety today; depression, chronic pain, women's health, the symptoms you can't name."

---

## 5) FALLBACKS (fail loud, on brand)
- If a live scene flakes → switch to the **recorded backup video** (record it before you freeze).
- If the split call errors on stage → it renders a visible **FAILED** badge (no silent fake) → cut to the cached run / the recorded video.
- Voice flakes → type instead (voice is optional; the split doesn't depend on it).

---

## WHAT YOU SHOULD DO NOW (priority order)

**Ready:** the deck (your 15 beats + words). The Devpost draft. The story/messaging.

**Depends on the builder finishing `GOAL-FRONTEND.md`** — the live 4-scene flow. The build order is: ① flow-proto can import the backend (next.config), ② align the seed to the anxiety hero, ③ `POST /api/turn` + `GET /api/record`, ④ Scenes 2→3→4 wired, ⑤ Scene 1 poke. The one gate that means "the demo works": `test-e2e.ts` green + a typed/pasted answer returns a live split on screen.

**Your action items:**
1. **Rehearse the deck** twice at ~90s (so the live demo gets its time).
2. **Record a backup video** of the full run once the build is green (your safety net).
3. **Tone sign-off** — read one live `feeling_validation` + `delta` out loud; confirm it validates, never invalidates.
4. **Fill the Devpost gaps** — team list, live Vercel URL, repo link (+ stat citations if you want them defensible).
5. **Decide the Inngest claim** — leave it as "durable layer / dashboard pause," or have the frontend `inngest.send('dot/run.requested')` so the demo literally runs through Inngest.
6. **Rotate `XAI_API_KEY`** after the event.
