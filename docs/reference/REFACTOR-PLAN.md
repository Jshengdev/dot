# REFACTOR PLAN — DOT engine + surfaces

> Single prioritized plan synthesized from three audits (backend engine, dead/legacy, frontend).
> Ordering law: **impact-per-effort**, demo-path-safe first. Nothing here invents product. Anything
> tagged NEEDS-REVIEW is a Johnny product decision, not a mechanical edit.
>
> Verified at write time (2026-06-15): root `dev` → `@dot/frontend` (the dead app); `plan.ts:227`
> re-exports `REASONING_MODEL` with no external importer; `test-e2e.ts` has zero references; `SALIENCE_RANK`
> is defined twice (`report.ts:85`, `store.ts:455`); `/api/record` has zero flow-proto consumers.

---

## 1. STATE OF THE CODE

The live product is **`@dot/flow-proto`** (Next, `next dev -p 5175`) on a clean new engine
(`converse · graph · plan · report · scheduler · store · persistence` + the live `/api/{turn,close,graph,report,plan,scheduler/tick,tts}` routes). That engine is healthy and demoable. The debt is almost
entirely **stratigraphic, not structural**: an older pipeline (`run/extract/seed/turn`), a second prototype app
(`@dot/frontend`), an Inngest durability experiment (`director` cluster), and a separate iMessage channel
(`imessage/*`) all still sit in the tree, statically re-exported through the backend barrel, so every live
`await import('@dot/backend')` drags the whole archaeology into the bundle even though flow-proto consumes a
narrow slice. The single sharpest hazard is the **root `dev` script launching the dead `@dot/frontend` app**, not the live product. On top of that sit cheap, behavior-preserving dedupes (the DOT em-dash voice rule lives in 4 places, the recent-thread→model-message map in 3, `SALIENCE_RANK` in 2) and a pile of genuinely-dead exports/props. None of it threatens the demo today; left alone it guarantees fixes get applied to the wrong copy and the wrong app gets shipped.

---

## 2. THE BIG ROCKS

Five load-bearing decisions. Four are **product calls only Johnny makes** (keep vs archive a whole channel);
one is a pure footgun fix.

### ROCK 0 — Root `dev` launches the DEAD app  · risk: HIGH footgun · effort: S · **DO NOW**
`package.json` root `dev` = `pnpm --filter @dot/frontend dev`. `@dot/frontend` is the superseded old-pipeline
prototype; the live product is `@dot/flow-proto`. **`pnpm dev` today boots the wrong app.** This is independent
of every keep/archive decision below — fix it regardless.
**Call: repoint now →** `"dev": "pnpm --filter @dot/flow-proto dev"`. One line, unblocks everything, zero risk to the live path.

### ROCK 1 — `@dot/frontend`: keep or archive?  · risk: HIGH · effort: M · **NEEDS-REVIEW**
`@dot/frontend` is the only live consumer of the old `runStory()/Reflection/ReportSO` chain (via its
`/api/run` route). It is the *entire reason* `run.ts/extract.ts/seed.ts/turn.ts` still have a non-test consumer,
and it owns a third (drifted) copy of the R3F glass system.
**Recommended call: ARCHIVE.** flow-proto supersedes it. Deleting `packages/frontend` (a) kills one glass copy
for free, (b) unblocks pruning the old pipeline from the barrel (Rock 4), (c) removes a whole drift surface.
Gate: confirm no demo/tooling points at `@dot/frontend` or `/api/run`. Do Rock 0 first so the default dev command is already correct when this lands.

### ROCK 2 — iMessage channel (`imessage/*` + `chat.ts`): keep or archive?  · risk: HIGH · effort: M · **NEEDS-REVIEW**
A separate product channel (10+ modules) dead on the live web, dragging heavy deps (`@photon-ai/advanced-imessage-kit`, `ws`). The live engine reaches in for **exactly one string** — `DOT_CHAT_SYSTEM`.
**Recommended call: KEEP the channel, SEVER the accidental dependency.** Regardless of keep/archive, first extract
`DOT_CHAT_SYSTEM` into a tiny dependency-free `voice-system.ts` (Rock 3 / row B1) so the live bundle stops
pulling `imessage/* + seed.ts` to read a personality string. Only after that, if Johnny drops the channel, the whole `imessage/*` tree + `imessage` script + those two deps come out as one clean block.

### ROCK 3 — Inngest `director` cluster: keep or archive?  · risk: HIGH · effort: M · **NEEDS-REVIEW**
`director.ts` (269L) + `serve-director.ts` (55L) + `test-director.ts` (255L) form **one closed cluster** —
they reference only each other, are not in the barrel, and are reachable only via the `serve` / `test:director`
scripts. Fully dead on the live web.
**Recommended call: ARCHIVE as a unit.** If the durability path is abandoned, remove all three files together
plus the `serve` + `test:director` scripts and the `inngest` + `@inngest/test` deps. **Do not remove
piecemeal** — partial removal breaks the cluster's internal refs.

### ROCK 4 — Biggest files: `PanelsPhase.tsx` (863L) · `graph.ts` (386L)  · risk: HIGH · effort: M · NEEDS-REVIEW
The two densest units. **`PanelsPhase.tsx`** carries five concerns: mirrored backend types, data/poll effects,
layout, two near-identical inline modals, and five sub-components (TruthColumn≈ReportColumn). Extract a shared
`<BloomModal>` shell + merge the two columns into one `<SOColumn>` → drops well under 400L. **`graph.ts`**
bolts a deterministic objective-count NLP backstop (`COUNTED_KINDS/KIND_PATTERNS/FREQ_RE/occurrenceCount/deriveObjectiveRecord`, ~80L) onto the windowed chunker; split into `objective-count.ts` so the regexes can be
unit-tested in isolation. Both are live-path file-boundary moves → schedule deliberately, run `tsc` + a live turn after each.

---

## 3. PRIORITIZED TABLE (every finding, impact-per-effort order)

Impact legend: **demo-safety** > **footgun removal** > **drift elimination** > **dead-weight** > **readability**.

| # | File | Issue | Fix | Risk | Effort | Impact |
|---|------|-------|-----|------|--------|--------|
| 1 | `package.json` (root) | `dev` script launches dead `@dot/frontend`, not live flow-proto | Repoint `dev` → `pnpm --filter @dot/flow-proto dev` | HIGH-footgun | S | **Highest** — stops shipping/demoing the wrong app |
| 2 | `backend/src/test-e2e.ts` | True orphan: no script, no barrel, no importer (verified) | Delete the file | low | S | High — removes the only non-chat consumer of `chatReply/routeMode`, zero behavior change |
| 3 | `backend/src/plan.ts` | Dead trailing `export { REASONING_MODEL }` (L227); only self-imports it (verified) | Delete L227; drop `REASONING_MODEL` from import L27 (keep `reasoningModel`) | low | S | High — pure dead-code, no behavior change |
| 4 | `flow-proto/components/GlassDot.tsx` | Inert `pokeRef` plumbing (Orb never reads it) + unused `PALETTE` import | Remove `pokeRef` prop/ref/assign/pass-through (keep `onPoke?.()`); delete `PALETTE` import | low | S | High — 4 dead sites + dead import gone |
| 5 | `flow-proto/components/glass/sim/damp.ts` | `VSpring` class + `acc` scratch vector unused in flow-proto | Delete `VSpring` + `acc`; keep `expDamp` | low | S | High — dead class out of live package |
| 6 | `flow-proto/lib/script.ts` | `DOT.beginPrompt` exported + documented, never read (CTA hardcodes its own string) | Remove `beginPrompt` field + its comment block | low | S | Med — dead field + misleading doc gone |
| 7 | `flow-proto/components/ui/atoms.tsx` | `PillButton.variant`/`pill--ghost` + `Bubble.delay` never passed | Drop unused props; verify `.pill--ghost` CSS unused before removing it | low | S | Med — dead API surface trimmed |
| 8 | `backend/src/converse.ts` | recent-thread→model-message map duplicated (L136-139, L228-231; 3rd copy in `imessage/chat.ts:90`) | Extract `toModelMessages(msgs)` once; call from `converseTurn` + `closeConversation` | low | S | Med — single source for the transform |
| 9 | `backend/src/converse.ts` + `scheduler.ts` | DOT em-dash rule `replace(/\s*—\s*/g, ', ')` in 4 places (converse L163/L251, scheduler L106, chat L123) | Hoist `stripEmDashes()` into shared `voice.ts`/`grok.ts`; call from live sites | low | S | Med — load-bearing voice rule can't drift |
| 10 | `backend/src/store.ts` + `report.ts` | `SALIENCE_RANK` defined twice (store L455, report L85), each w/ own comparator (verified) | Define `SALIENCE_RANK` once in `types.ts` by `SalienceSchema`; import both sites | low | S | Med — ordinal can't drift if scale changes |
| 11 | `backend/src/report.ts` | `phraseGap` ends with bare `// contradicts` + unguarded fallthrough | Make explicit `if (e.type === 'contradicts')`; self-documenting, future-proof | low | S | Med — removes silent-wrong-phrasing trap |
| 12 | `backend/src/store.ts` | Equal-`ts` messages tie-break to 0 → order depends on Map insertion; user+dot reply share same `now` | Add stable secondary sort on numeric `msg_<n>` id | med | S | Med — cheap insurance vs a scrambled turn pair |
| 13 | `flow-proto/app/api/tts/route.ts` | Reads `process.env.XAI_API_KEY` directly; other 6 routes call `ensureEnv()` | Call idempotent `ensureEnv()` atop the POST handler | med | S | Med — kills a split-failure mode (tts 500s while turn works) |
| 14 | `flow-proto/app/page.tsx` | `as unknown as` double-casts on the 3 phase comps *defeat* type-checking, don't enforce a contract | Delete the casts; render components directly (inline prop types already check); run `tsc` | med | S | Med — restores real type safety on live render path |
| 15 | `backend/src/imessage/chat.ts` | Live engine imports only `DOT_CHAT_SYSTEM` but drags `imessage/* + seed.ts` into live bundle | Extract `DOT_CHAT_SYSTEM` → dep-free `voice-system.ts`; repoint converse/scheduler/chat | med | S | High-leverage — severs live→imessage/seed dep (gates Rock 2) |
| 16 | `flow-proto/app/api/record/route.ts` | `/api/record` has zero live consumers (verified); sole `buildStats()` caller → keeps `run.ts` reachable | Confirm unused, then delete route dir | med | S | High-leverage — drops last flow-proto ref to `run.ts` |
| 17 | `backend/src/index.ts` | Barrel statically re-exports whole old pipeline (`extract/seed/run/turn`); zero flow-proto consumers | After Rocks 1+16, prune those 4 barrel re-exports (tests import deep files directly) | med | S | High — shrinks live engine surface to the new modules |
| 18 | `backend/src/grok.ts` | Hand-rolled `.env` loader redundant on web path (server-env pre-sets vars) but load-bearing for tsx runners | KEEP; add 1-line note it's a no-op on web + confirm no-overwrite vs server-env. No code change | low | S | Low — prevents a wrong "fix"-by-deletion |
| 19 | `flow-proto/components/phases/PanelsPhase.tsx` (PANEL_MORPH) | Earlier "duplicated across packages" concern — false; single-sourced here | No action; close the loop | low | S | Low — confirmation only |
| 20 | `backend/src/*.ts` headers | 15-30L prose headers in 6 engine files restate "now injected / fail loud" 5× | Trim each to ~5-8L (one-job + file gotcha); state shared contract once in CONSTRAINTS | low | M | Low — readability; comment-only |
| 21 | `backend/src/converse.ts` + `plan.ts` | `summarizeGraph` ≈ `renderGraph` byPanel grouper (2 near-identical) | Optional: extract `groupNodesByPanel(nodes)`; each formats per its own need | low | M | Low — lower priority (formatting differs) |
| 22 | `flow-proto/app/api/*` | 6 routes repeat userId-parse + dynamic import + try/catch→structured-500 boilerplate | Add `parseUserId(req)` + `withRoute(node, handler)` wrapper; verify 400/500 shapes unchanged | HIGH | M | Med — touches every live route's error path |
| 23 | `backend/src/graph.ts` | Deterministic objective-count NLP (~80L) bolted onto windowed chunker | Split into `objective-count.ts`; unit-test regexes in isolation | HIGH | M | Med — readability + testability on live path |
| 24 | `backend/src/store.ts` | `getMessages/getEvents` re-scan + sort the process-wide Map per call (O(all users)) | No change for demo. If it leaves single-user-sequential, key by `userId` like graphNodes/Edges | med | M | Low — latent scaling note, not a demo bug |
| 25 | `flow-proto/components/phases/PanelsPhase.tsx` | 863L / 5 concerns; 2 near-identical modals + TruthColumn≈ReportColumn | Extract `<BloomModal>` shell + merge into `<SOColumn>`; → <400L | HIGH | M | Med — big readability win, live behavior |
| 26 | `backend/src/{director,serve-director,test-director}.ts` | Inngest cluster fully dead on web; refs only each other | **NEEDS-REVIEW (Rock 3):** if abandoned, remove all 3 + scripts + `inngest`/`@inngest/test` deps as one unit | HIGH | M | High dead-weight — only as a block, after decision |
| 27 | `packages/frontend` | Superseded old-pipeline app; only live consumer of old `run/extract/seed` chain | **NEEDS-REVIEW (Rock 1):** archive → frees old pipeline + one glass copy | HIGH | M | High — unblocks rows 17, 28 |
| 28 | `backend/src/imessage/*` | Dead-on-web channel + heavy deps (`@photon-ai/advanced-imessage-kit`, `ws`) | **NEEDS-REVIEW (Rock 2):** if channel dropped, remove tree + `imessage` script + deps — *only after* row 15 | HIGH | M | High dead-weight — gated on row 15 |
| 29 | `flow-proto/components/glass/*` | 8-file glass system duplicated flow-proto↔lab (5 byte-identical, 3 drifted); 3rd copy in frontend | Promote to shared `@dot/glass` workspace pkg OR import lab's entrypoint; min: re-sync the 5 identical | HIGH | L | Med — largest dup, but cross-pkg + bundling; row 27 deletes one copy free |

---

## 4. SAFE-NOW vs NEEDS-REVIEW

### SAFE-NOW — mechanical, behavior-preserving, no product decision
Do these in roughly this order; each is independently shippable. Run `tsc` after the ones that touch types/render
(13, 14) and a live turn after engine edits.

- **Row 1** — repoint root `dev` to flow-proto *(do first; fixes the footgun)*
- **Row 2** — delete `backend/src/test-e2e.ts`
- **Row 3** — delete dead `REASONING_MODEL` re-export in `plan.ts`
- **Row 4** — strip inert `pokeRef` + unused `PALETTE` in `GlassDot.tsx`
- **Row 5** — delete `VSpring`/`acc` in flow-proto `damp.ts`
- **Row 6** — remove dead `DOT.beginPrompt` in `script.ts`
- **Row 7** — drop unused `variant`/`delay` props in `atoms.tsx` (verify `.pill--ghost` CSS first)
- **Row 8** — extract `toModelMessages()` in `converse.ts`
- **Row 9** — hoist `stripEmDashes()` shared across converse/scheduler
- **Row 10** — single `SALIENCE_RANK` in `types.ts`
- **Row 11** — explicit `contradicts` guard in `report.ts:phraseGap`
- **Row 12** — stable secondary sort on `msg_<n>` id (cheap insurance)
- **Row 13** — `ensureEnv()` in `tts/route.ts`
- **Row 14** — delete `as unknown as` casts in `page.tsx` (run `tsc`)
- **Row 18** — documentation-only note in `grok.ts` (no code change)
- **Row 19** — none (PANEL_MORPH confirmation)
- **Row 20** — trim engine file headers (comment-only)

### NEEDS-REVIEW — Johnny's product call or larger blast radius
Sequence matters: **Rock 1 (frontend) gates rows 17, 27, 29-free-copy; row 15 gates Rock 2 / row 28.**

- **Row 15** — extract `DOT_CHAT_SYSTEM` → `voice-system.ts` *(do this even if iMessage is kept; it severs the live→imessage/seed dep and gates row 28)*
- **Row 16** — delete `/api/record` route *(confirm no demo tooling hits it; drops last `run.ts` ref)*
- **Row 17** — prune old-pipeline barrel re-exports *(after rows 1 + 16)*
- **Row 21** — optional `groupNodesByPanel` extraction
- **Row 22** — `withRoute()` wrapper across all 6 routes *(verify 400/500 shapes)*
- **Row 23** — split `objective-count.ts` out of `graph.ts`
- **Row 24** — userId-partition the store Maps *(only if it leaves single-user-sequential)*
- **Row 25** — refactor `PanelsPhase.tsx` (`<BloomModal>` + `<SOColumn>`)
- **Row 26 / ROCK 3** — archive the `director` Inngest cluster as one unit (files + scripts + deps)
- **Row 27 / ROCK 1** — archive `packages/frontend`
- **Row 28 / ROCK 2** — archive `imessage/*` channel *(only after row 15)*
- **Row 29** — consolidate the triplicated glass system into a shared package

---

## 5. RECOMMENDED EXECUTION ORDER

1. **Row 1** (footgun) — repoint `dev`. Standalone, do immediately.
2. **SAFE-NOW batch** (rows 2-14, 18, 20) — one PR or a few small ones; pure cleanup, demo-safe.
3. **Row 15** — extract `voice-system.ts`. Unblocks the iMessage decision.
4. **Johnny decisions** — Rock 1 (frontend), Rock 2 (iMessage), Rock 3 (director).
5. **Post-decision pruning** — rows 16 → 17 → 26/27/28 in dependency order.
6. **Deliberate refactors** (rows 22, 23, 25, 29) — schedule with `tsc` + a live turn after each.
