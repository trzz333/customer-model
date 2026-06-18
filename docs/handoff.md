# Customer Model — Handoff

State doc. Terse by design. Resolved detail lives in docs/history.md.

## PROJECT
A business-school AI tool: a deterministic, game-theory + behavioral-economics
simulation that stress-tests a business model against synthetic customer
archetypes. Live target https://customer-model.council.fyi.

## PHASE
Plain-language input layer built and pushed; engine frozen and unchanged.
Code is correct (local build green) but the production deploy is BLOCKED at
Vercel, so the live URL still serves an older engine-direct build.

## LAST COMMIT
4e5991b — feat: plain-language input layer (business-once, customer-world stress
lenses, layman analysis). A docs/handoff commit sits on top of it.

## CURRENT STATE
The app now has two axes. You define one business in plain terms (name,
what-you-sell, and four levers: price move, value posture, retention play,
competitive threat), then run it across named CUSTOMER WORLDS (mainstream,
fickle bargain-hunters, loyal regulars, skeptical first-timers, grudge-prone
crowd). The worlds are the reusable templates; the business is the input. Each
result leads with a plain-language headline in concrete counts, then one causal
sentence naming the mechanism, then who-leaves-first; the engine verdict and
warning chips sit below as the auditable record and a "short version" banner
states the spread across worlds. New `src/lib/business.ts` holds all translation
(FIELDS, EXAMPLES, WORLDS, businessToCfg, laymanAnalysis, teachingPrompt) and
`src/app/page.tsx` is the multi-run UI. `src/lib/sim.ts` is untouched. Save
invariant holds in the new render. `tsc` clean, `next build` green (11.1 kB).

## NEXT MOVE
Get the build unblocked at Vercel so the input layer goes live (Jeff step —
see FOR JEFF). The moment it clears, the live URL serves 4e5991b with no further
work. Once live, the next feature is the two-business A/B side-by-side compare
(the strategy-genre gap the audit flagged): hold the customer world fixed, run
move A vs move B in one view. Engine stays frozen; UI + a second cfg.

## DEPLOY STATE
- Local repo: YES, branch `main`, scoped commits.
- GitHub: YES, trzz333/customer-model (private), `main` pushed through 4e5991b.
- Vercel build: BLOCKED. 4e5991b and prior 57985c9 both in state BLOCKED;
  project live:false. Last READY production deploy is the older 47789230 (what
  the URL serves now). Block predates this session's commit, so it is an
  account/project condition, not the code. Inspector:
  vercel.com/masterson3433-9774s-projects/customer-model/GwAvttbfF86nABRLzY5nawPaoiFM
- Subdomain customer-model.council.fyi: attached, serving over HTTPS, but
  pinned to the old READY deploy until the block clears.
- Env vars: NO. ANTHROPIC_API_KEY only needed if the optional voice/LLM-autofill
  layer ships; Jeff pastes it into Vercel env then.

## DECISIONS LOCKED
Standalone project, not in the council repo. Deterministic engine is the
differentiated core; not an LLM-respondent tool. Templates are CUSTOMER WORLDS
(archetype mixes) applied to a user-defined business, NOT pre-baked business
types — the business is the input, the worlds are the reusable lenses. λ default
2.25 (Tversky-Kahneman), held constant across worlds as the shared science.
Optional LLM "voice of the customer" is single-model narration grounded in the
numbers, never a committee. The save-button invariant ships in page.tsx +
globals.css; never build a separate clean export that drops the verdict.

## OPEN QUESTIONS
1. After unblock, which enhancement first: the two-business A/B compare
   (strategy genre) or an LLM "describe your business in a sentence" autofill
   that parses plain text into the four levers. The autofill is the first thing
   that puts an API key in the loop, so it is gated on the voice-layer call.
2. Voice/LLM layer in v1 or after — still Jeff's call, now narrowed to the
   autofill use rather than per-archetype narration.

## NOTES
1. SAVE BUTTON (permanent invariant, never evicted): Save/Print over
   `#result-printable`, `@media print` block in globals.css, verdict + warning
   chips are the must-show per result card and are always visible (not inside the
   collapsed "show the numbers"). Confirmed holding in the new page.tsx render.
   Never build a separate clean export that drops the verdict.
2. Engine API (unchanged, frozen): `runSimulation(cfg)`, `verdict(cfg, r)`,
   `DEFAULT_CONFIG`, `ARCHETYPES`, `ARCH_BY_KEY`. The input layer produces a
   `cfg` for this API; do not touch sim.ts behavior or the λ default.
3. Build quirk: this machine blocks npm.ps1 under PowerShell (execution policy)
   and npm defaults to production-only installs. Use the `cmd` shell and
   `npm install --include=dev`; run `npx tsc --noEmit` / `npm run build` there.
4. The audit (six lenses) that shaped this build and the Kahneman comprehension
   framing are written up in history.md under this date.
5. Two standalone HTML prototypes of the input layer live outside the repo
   (Claude outputs, not committed): v1 business-type templates, v2 the
   customer-world reframe that became the shipped design.
