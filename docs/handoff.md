# Customer Model — Handoff

State doc. Terse by design. Resolved detail lives in docs/history.md.

## PROJECT
A business-school AI tool: a deterministic, game-theory + behavioral-economics
simulation that stress-tests a business model against synthetic customer
archetypes. Target URL: customer-model.council.fyi (its own repo + Vercel
project, fully isolated from the council repo).

## PHASE
Engine built and verified. No UI, no install, no deploy yet.

## LAST COMMIT
None — local repo not yet initialized (see DEPLOY STATE).

## CURRENT STATE
`src/lib/sim.ts` is the working engine: seven Axelrod-derived archetypes,
prospect-theory perception (λ default 2.25), reference re-anchoring, a fading
competitor raid, friction-gated churn, reputation that mean-reverts toward
satisfaction minus negative word-of-mouth, reputation-driven acquisition, a
tipping-point detector, and a deterministic plain-language `verdict()`. It runs
on Node 26 via native TS. Verified: determinism passes (same seed → identical
revenue); default scenario holds but wipes the grim-trigger segment on a price
hike (~14% net churn, cascade at round 12); harsh preset collapses (~98%).
Project scaffold (package.json, tsconfig, next.config, postcss, globals.css with
council tokens, layout.tsx, .gitignore protecting .env*, .env.local.example,
README) is in place. `smoke.ts` exists for engine testing.

## NEXT MOVE
Build `src/app/page.tsx`: the controls (market mix, policy levers, behavioral
params, scenario events, seed, run) and the results surface (headline metrics +
per-round chart + per-archetype survival + the verdict). The results surface
MUST ship with a save button per the save-button skill — see NOTES.

## DEPLOY STATE
- Local repo initialized: NO (run `git init`, scoped adds only, never -A).
- GitHub repo created: NO (suggest trzz333/customer-model).
- Vercel project: NO.
- Subdomain customer-model.council.fyi attached: NO. Blocker: confirm how
  council.fyi DNS is managed (Vercel-managed → add domain in new project;
  registrar → Jeff adds one CNAME).
- Env vars set: NO. ANTHROPIC_API_KEY goes in Vercel env (Jeff pastes the value;
  never in code/chat/git). Only needed once the optional voice layer is built.
- Validation gate UNRUN: `npm install && npm run typecheck && npm run build`
  has not been run. Do this before claiming the app builds.

## DECISIONS LOCKED
Standalone project, not in the council repo (don't step on council claude).
Deterministic engine is the differentiated core; frontier synthetic-customer
tools are LLM survey-respondents and this is not that. Optional LLM "voice of
the customer" is single-model narration grounded in the simulated numbers, not
a committee — multi-agent deliberation among correlated models was verified to
add redundancy, not accuracy. The deterministic engine is itself the independent
check on AI hand-waving. λ defaults to 2.25 (Tversky-Kahneman), tunable.

## OPEN QUESTIONS
council.fyi DNS management (the one external dependency for the subdomain).
Whether the voice layer ships in v1 or after the deterministic UI is solid.

## NOTES
1. SAVE BUTTON (Jeff asked for this explicitly): build per /save-button. Default
   to Print — wrap the results-only region as `#result-printable`, add a
   "Save / Print" button beside the run/copy actions calling `window.print()`,
   and put the `@media print` isolation block in globals.css (mirror Council's
   `#council-printable`). The verdict (with its warnings: bleed-out, tipping
   point, segment loss, reputation rot, exploitation cost) is a must-show
   section and MUST appear in the saved copy. Never build a separate "clean"
   export that drops it. That is the one rule of the skill.
2. Engine API: `runSimulation(cfg: SimConfig): SimResult`, `verdict(cfg, r)`,
   `DEFAULT_CONFIG`, `ARCHETYPES`, `ARCH_BY_KEY`. All pure, client-safe.
3. Chart: hand-roll SVG (no recharts dependency) to match council's house style.
4. Add a short sourced "methodology" note in the app: Axelrod tournament,
   Tversky-Kahneman λ (note meta-mean ~1.96, range ~1.5–3), why deterministic
   over an LLM-persona committee.
5. `smoke.ts` is a scratch test, not shipped — keep it out of the deployed build
   (it imports sim.ts directly; fine to leave in repo root, gitignore if noisy).
