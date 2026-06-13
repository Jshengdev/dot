# DOT — The Provider Report (template + SOAP mapping + guardrail)

> What shape DOT's output must take so it is *useful to a clinician* — "a story a provider can
> understand," never a diagnosis. Researched 2026-06-13 (web sources at bottom). This pins the exact
> report DOT produces from its data (`stories`, `objective`, `subjective`, `timeline`, `recommendations`).

---

## 1. Why this shape — the clinical documentation it must slot into

Clinicians document in **SOAP** — Subjective, Objective, Assessment, Plan — "a widely used method of
documentation… theorized by Larry Weed almost 50 years ago" (NCBI StatPearls). The load-bearing line for
DOT is the **subjective/objective split**, which maps directly onto DOT's `{subjective, objective}`:

> "Symptoms are the patient's subjective description and should be documented under the subjective
> heading, while a sign is an objective finding… An example… a patient stating he has 'stomach pain,'
> which is a symptom, documented under the subjective heading. Versus 'abdominal tenderness to
> palpation,' an objective sign documented under the objective heading." — NCBI StatPearls, *SOAP Notes*

So: **Subjective = what the patient feels/reports** (chief complaint, HPI, history, worries).
**Objective = measurable, observed, countable** (vitals, exam, labs — and for DOT: counted facts like
"panic episode logged 19 of the last 21 days"). The patient owns the first two letters of SOAP; **DOT
must never author A or P** (Assessment = the diagnosis; Plan = the clinician's treatment plan). That
boundary *is* the guardrail (§4).

The **Subjective** section is structured as a **chief complaint + HPI** (history of present illness),
and the HPI is captured with **OLDCARTS**: Onset, Location, Duration, Characteristics, Aggravating
factors, Relieving factors, Timing, Severity (Osmosis; StatPearls). "Most clinicians weave the answers
into a single short paragraph rather than listing them" — so DOT's `stories` → a tight narrative, not a
form dump. Patient-advocacy guidance says the same to patients: describe **onset, duration, frequency,
severity (1–10), and how it impacts daily life** (U.S. News; PAF).

## 2. What format providers actually read (concise, scannable, timeline-first)

Patient-generated health data (PGHD) is "health-related data created, recorded, or gathered by or from
patients… to help address a health concern," distinct because "patients, not providers, are primarily
responsible for capturing… these data; and… patients decide how to share" them (ONC, via NCBI). Brought
to the visit **before** it, it pays off:

> "Comprehensive pre-visit information saves time allowing clinicians to focus on the most important
> issues while knowing that all areas have been covered." …it "assures that the visit includes the
> patient's own priorities." — MicroMD/CHADIS

Providers read it when it is short and ordered by priority: patients are told "list the most important
first to make sure they get answered" (Patient Advocate Foundation). DOT inherits both rules:
**under-a-minute read, most-important-first, timeline up top.**

---

## 3. The DOT Provider Report — exact template

Single page. ~200–300 words of report body. Plain language. Patient's voice, organized. Tense: present
+ dated past. Read time: **< 60 seconds.**

```
DOT SUMMARY — prepared by [name], [date]   (patient-generated · not a medical record)

CHIEF CONCERN  (1 sentence, the patient's own words)
  → from: recommendations[0] framing + the dominant story

WHAT'S BEEN HAPPENING  (3–5 sentence narrative, OLDCARTS-shaped, chronological)
  → from: stories + subjective

THE OBJECTIVE RECORD  (3–6 bullets: counted, dated, measurable)
  • [symptom] logged [N of M days] — onset [date]
  • severity trending [↑/↓], peak [date]
  → from: objective + timeline

WHAT I'VE NOTICED / TRIED  (1–3 bullets: triggers, relief, prior steps)
  → from: subjective (aggravating/relieving) + stories

WHAT I'D LIKE TO DISCUSS  (1–3 items, each "I'd like to discuss X, because Y")
  → from: recommendations{what, why}

WHAT I'M MOST WORRIED ABOUT  (1 sentence)
  → from: recommendations.why / subjective fear
```

**Section-by-section mapping to DOT data:**

| Report section | DOT data | SOAP |
|---|---|---|
| Chief concern | `recommendations[0]` + lead `stories` | S (chief complaint) |
| What's been happening | `stories` + `subjective` | S (HPI / OLDCARTS) |
| The objective record | `objective` + `timeline` | O (counted "signs") |
| What I've noticed / tried | `subjective` + `stories` | S (aggravating/relieving) |
| What I'd like to discuss | `recommendations{what, why}` | — *(patient-side, NOT A/P)* |
| What I'm most worried about | `recommendations.why` / `subjective` | S |

Note the report **stops before Assessment and Plan** — those columns are the clinician's to fill. DOT
hands them a well-formed S and O and a patient agenda; it never pre-fills the diagnosis.

## 4. The line DOT must NOT cross — story + the patient's own asks, never a diagnosis

DOT presents *a story and the patient's own recommendations and why* — it does **not** diagnose or give
medical advice. The advocacy literature shows exactly how to phrase a patient's requests without
overstepping into self-diagnosis. Real patient scripts frame asks as **discussion and questions**, not
conclusions:

- "What could be causing these symptoms? Are there tests we can do to determine the cause?" (Fullscript /
  patient-script examples) — the patient supplies the *story*; the doctor supplies the *cause*.
- Scripts "should focus on **asking questions and clarifying concerns rather than self-diagnosing**"
  (Fullscript). A patient script "can include your questions, your symptoms, your concerns, and even your
  goals for the visit."

So DOT's `recommendations` render as **"I'd like to discuss [what], because [why]"** — a patient
preference and its reason, surfaced for the clinician to weigh. Never "you have X," never "you should take
Y." The report header states it plainly: *patient-generated · not a medical record · not a diagnosis.*
This is the agency angle made safe: the patient walks in with an objective record of their own story and
a clear ask, and the clinician keeps the diagnosis.

---

## Sources
- NCBI StatPearls, *SOAP Notes* — SOAP structure, subjective/objective, symptom-vs-sign example, what
  goes in S vs O: https://www.ncbi.nlm.nih.gov/books/NBK482263/
- Osmosis, *OLD CARTS history-taking mnemonic*: https://www.osmosis.org/answers/old-carts-history-taking-mnemonic
- NCBI Bookshelf, *Electronic Patient-Generated Health Data for Healthcare* — PGHD definition (ONC) +
  distinction from clinician data: https://www.ncbi.nlm.nih.gov/books/NBK580630/
- MicroMD / CHADIS, *PGHD: Improving Care, Outcomes & Satisfaction* — pre-visit data saves time, surfaces
  patient priorities: https://www.micromd.com/enotes/pghd-chadis/
- AHRQ Digital Healthcare Research, *Patient-Generated Health Data / PROs*: https://digital.ahrq.gov/health-it-tools-and-resources/patient-generated-health-data-patient-reported-outcomes
- Patient Advocate Foundation, *Tips for Talking With Your Doctor* — write list, most-important-first:
  https://www.patientadvocate.org/explore-our-resources/interacting-with-your-physician/tips-for-talking-with-your-doctor/
- U.S. News, *How to Talk So Your Doctor Will Listen* — OLDCARTS for patients, frequency/severity/impact:
  https://health.usnews.com/health-care/patient-advice/articles/how-to-talk-so-your-doctor-will-listen
- Fullscript, *How to Advocate for Yourself at the Doctor* — ask-questions-not-self-diagnose scripts:
  https://fullscript.com/blog/how-to-advocate-for-yourself-at-the-doctor
- PatientAdvocateInfo, *How a Simple Script Can Transform Your Next Doctor's Visit* — patient script
  example phrasings: https://patientadvocateinfo.com/medical/how-a-simple-script-can-transform-your-next-doctors-visit-and-improve-your-health-outcomes/
