# USER-JOURNEY — the e2e frontend flow (verbatim) + demo scope

> Johnny's e2e user-journey vision, preserved verbatim, then mapped to stages, then scoped to what's reasonable to
> build as the DEMO sample-frontend (mostly hardcoded/simulated, to combine with the real engine later). Pairs with
> `STORY-BEATS.md`, `FLOWCHART.html`, `SCOPE-LOCK.md`.

## Verbatim (Johnny, 2026-06-13)
> i just like the glass dot. so lets save that and work on scaffolding what i imgaien the fornt end flow to feel
> like. Lets build it out as a sample run while the main one runs and we can combine later. but this should be like
> a next.js tsx project with front end that uses gsap motion and whaetver tailwind css and motion.div and anything
> needed to create movoement and user interactions. i want it to start with like an entering phase. It has a welcome
> screen like the headspace motion design lanague. With just a simple. entering and it shows the dot appear as its
> popping up and morphing together. and then the dot in the center is a lighter tone lighteer saturaitno more matte
> matierla that has some transparnecy to it. THe idea is that it turns on and blinks insdie the glass morph dot thing
> and people can interact with it. But it basically says hi this is dot!. with like using the grok voice. so when you
> click him. he says why are you poking me. and there is a button pill shaped ocontainer thing that just says. begin.
> when it starts, it asks whatever necceseary quesiton and overall you trasnscribe eveyrthing. For the demo sake. i
> will have a paste in the entire trasncript thing because its meant to be a 15 min process and get into it. But
> showing a practice stage where it does get me and feel what im daying for like 2-3 turns. finally once i paste i end
> it and dot says. Hey bud, ill check in with ya on imessage so dont leave me hanging! Then have a button that
> simulates the time that would connect to hte backend to show hard coded if its been certain timer do what agent to
> prompt hwat through the covnerstaion and keep chatting until it gets its objective within 2-3 turns so its super
> easy adn simple. then antoher ehck in. when finally you think youve been very vocal about what happenes athen you
> just go into the ui page and you see all your logs. this includes the intial yap node. which is the biggest branch
> out into all the different ideas through like a knoweldge graph style process. and then once you do so. clikc.
> connect the dots. and the metadata in each chunked log should save and show what is objective that can go to a
> provider and the sotry which is subjective as like a visual of watching each dot connect and hte ones that dont are
> the facts and eveyrhting else that is just the story is connected. then you click complete which takes you to a new
> page where its a summarized card of the timeline story and little stat cards of eveyrthing youve felt thats
> necceseary for a clear diagnosis of hte problem. and its keyp short adn simple with the extended version avaiable on
> see detailed. but it just has easy way to see all the main infomraiont and a reccomendation on what hte provider
> looks for when you talk to them.

## The glass dot (SAVED — the signature element)
The dot is the brand. Two layers: the **glass-morph shell** (translucent sphere, soft refraction, the deck's
radial-gradient + inset-light look) and, inside it, a **lighter, lower-saturation, matte translucent core** that
**turns on and blinks** — alive, pokeable. Interactive: click → it reacts ("why are you poking me"), speaks via Grok
Voice. Calm, Headspace-soft, breathing. (Starting point: the `.dot` in `PITCH-DECK.html` — refine toward matte+core.)

## The journey, mapped (8 stages)
1. **ENTER** — Headspace-style welcome; the dot pops up and morphs together. Calm, simple, "entering."
2. **MEET DOT** — the inner core turns on + blinks; "hi, this is DOT!" (Grok Voice). Click it → "why are you poking
   me?" A pill button: **Begin.**
3. **CONVERSE (practice)** — it asks what's needed; transcribes everything. Show a real 2–3-turn practice where it
   *gets* you. Demo shortcut: a **paste-the-full-transcript** box (real flow is ~15 min). You **End** it.
4. **HANDOFF** — DOT: *"Hey bud, I'll check in with ya on iMessage so don't leave me hanging!"*
5. **SIMULATE TIME** — a button that fakes the elapsed time / backend; hardcoded: after a timer, the agent chats
   through iMessage-style check-ins, getting its objective in 2–3 turns. Then **another check-in.** Super simple.
6. **LOGS** — go to the UI page, see all your logs. The **initial yap node** is the biggest branch → it fans out into
   all the ideas, **knowledge-graph style.**
7. **CONNECT THE DOTS** — each chunked log carries metadata: **objective** (provider-bound) vs the **subjective
   story.** Visual: watch the dots connect — the **story** dots connect into the narrative; the ones that **don't
   connect are the facts.** (Objective stands apart; subjective weaves together.)
8. **COMPLETE → SUMMARY** — new page: a **summarized timeline-story card** + small **stat cards** of everything you've
   felt that's necessary for a clear diagnosis. Short + simple, with **See detailed** for the long version. Plus a
   **recommendation of what the provider looks for** when you talk to them.

## Demo scope — what's reasonable to build FIRST (the sample frontend)
Build the **whole flow front-to-back on SAMPLE/HARDCODED data**, focused on the FEEL — no backend dependency, so it
runs standalone and **combines with the real engine later** (match the `Story`/`Event` contracts so swap is clean).

| Stage | Demo build | Real vs faked |
|---|---|---|
| Enter + Meet DOT | the glass-dot morph-in + core blink + Begin pill | **real** motion; voice = Grok TTS (real) or simulated |
| Converse | 2–3 scripted "it gets you" turns + a paste-transcript textarea + End | **faked** (scripted turns + paste); textarea is the 15-min shortcut |
| Handoff | the "I'll check in on iMessage" line | real copy, no real iMessage in the sample |
| Simulate time | a **Simulate** button → advances a hardcoded timeline of check-ins | **hardcoded** (no live backend in the sample) |
| Logs / knowledge graph | the yap node fanning into idea-nodes, graph style, on sample data | **faked** data, **real** visual |
| Connect the dots | animate objective-vs-subjective dots connecting | **faked** data, **real** visual (the hero moment) |
| Summary | timeline card + stat cards + See detailed + provider rec | **faked** sample, real layout |

**Sample data shape (so it swaps with the real engine):** one `sampleStory.json` =
`{ yap, logs:[{ chunk, objective:string[], subjective:string[] }], timeline, stats:[{label,value}], providerRec }`.
The real `extract`/director output fills the same shape later. **Keep it isolated** (its own package, e.g.
`packages/sample` or `sample/`) so it never collides with the main build; combine when both are green.
