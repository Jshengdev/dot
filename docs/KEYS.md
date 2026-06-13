# KEYS — env vars + credentials. What the build needs to run.

> ⏳ **MISSION TODO (Johnny fills the real keys).** This file lists every secret the engine needs and where it
> comes from. **Never commit real keys** — they live in `.env` (gitignored). This doc names the variables and
> their source; `.env.example` (⏳ TODO) carries the empty template.

## How secrets are handled (LOCKED)

- Real keys live in `.env` at repo root — **gitignored** (see `.gitignore`).
- A committed `.env.example` lists every variable name with an empty/placeholder value, so a fresh clone knows
  what to fill. ⏳ TODO: create it once the key list is known.
- Nothing in `docs/` or source ever contains a real secret.

## Required variables (⏳ MISSION TODO — depends on M4 sponsor list / M5 stack)

| Variable | Used by | Source | Status |
|---|---|---|---|
| `⏳ TODO` | the LLM node | ⏳ provider (M5) | ⏳ TODO |
| `⏳ TODO` | the data store | ⏳ store (M5) | ⏳ TODO |
| `⏳ TODO` | a CORE sponsor seam | ⏳ sponsor (M4) | ⏳ TODO |
| `MOCK_*` | dev-only mocks (env-gated) | local only | convention locked |

> ⏳ **MISSION TODO:** one row per real key once the sponsor list (`docs/SPONSORS.md`) and stack are locked.
> Mark which keys are required for the demo path vs optional.

## Reuse

> ⏳ **MISSION TODO:** if Johnny has working keys in another repo's `.env` (the reference project pulled its
> `.env` from a source repo), name the source here and copy — don't regenerate keys under time pressure.
