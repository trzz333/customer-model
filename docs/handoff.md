# Customer Model — Handoff

State doc. Terse by design. Resolved detail lives in docs/history.md.

## PROJECT
A business-school AI tool: a deterministic, game-theory + behavioral-economics
simulation that stress-tests a business model against synthetic customer
archetypes. Live at https://customer-model.council.fyi.

## PHASE
Deployed and live. Engine and results UI work, but the UI is wired straight to
the engine's raw parameters, so it is not yet usable by a non-expert and offers
no plain-language place to describe the business itself.

## LAST COMMIT
15611fc — docs: handoff after deploy; next move is plain-language input layer

## CURRENT STATE
`src/lib/sim.ts` (engine) and `src/app/page.tsx` (UI) are built, verified, and
now deployed. The page is engine-direct: the left rail exposes market size,
rounds, seed, the seven-archetype mix with live normalized shares, policy levers,
behavioral params (λ default 2.25), and scenario events, plus Default/Harsh
presets. Results recompute from the last run config and lead with the
deterministic verdict and its warning chips inside `#result-printable`, then
headline metrics, a hand-rolled two-panel SVG chart, per-archetype survival bars,
and a sourced methodology note. Save/Print and Copy sit outside the printable
region. The live site renders correctly over HTTPS and the save-button invariant
holds in the deployed render.

## NEXT MOVE
Build the plain-language business-model input layer. Today the UI speaks the
engine's language (archetype shares, λ, policy levers); a non-expert SMB owner
thinks in "what I sell, my price, my retention play, what happens when a
competitor undercuts me." There is no surface to describe the business because
the inputs map straight to engine knobs. Add a business-language front door that
captures the model in plain terms and maps it onto the deterministic parameters,
and demote the raw params to an advanced/expert view. This is both the
comprehension fix and the missing "input your business model" box; they are the
same gap. UI-only work on top of a verified engine.

## DEPLOY STATE
- Local repo: YES, branch `main`, scoped commits.
- GitHub repo: YES, trzz333/customer-model (private), `main` pushed.
- Vercel project: YES, `customer-model` in team_Lh2oOhJYVaJF4VhuRQPnyNa9,
  Next.js auto-detected, builds green, prerenders static.
- Subdomain customer-model.council.fyi: YES, attached to Production, Valid
  Configuration, serving over HTTPS. Zero-touch via Vercel-managed DNS as
  predicted; no registrar CNAME.
- Env vars: NO. ANTHROPIC_API_KEY only needed once the optional voice layer
  ships; Jeff pastes the value into Vercel env then.

## DECISIONS LOCKED
Standalone project, not in the council repo. Deterministic engine is the
differentiated core; frontier synthetic-customer tools are LLM survey-respondents
and this is not that. Optional LLM "voice of the customer" is single-model
narration grounded in the numbers, not a committee (multi-agent verified
redundant, not additive). λ defaults to 2.25 (Tversky-Kahneman), tunable. The
save-button invariant is baked into the ai-handoff skill and ships in page.tsx;
never build a separate clean export that drops the verdict.

## OPEN QUESTIONS
1. Voice layer in v1 or after. Now unblocked since the deterministic app is
   live; still Jeff's call.
2. Shape of the business-model input: a guided form (sell what, price, retention
   move, competitor response) versus a few preset business templates the user
   tweaks. Determines how much translation logic the input layer needs.

## NOTES
1. SAVE BUTTON (permanent invariant, never evicted): Save/Print over
   `#result-printable`, `@media print` block in globals.css, verdict-with-warnings
   is the must-show section in the saved copy. Confirmed still holding in this
   session's live render. Do not build a separate clean export that drops the
   verdict.
2. Engine API (unchanged): `runSimulation(cfg)`, `verdict(cfg, r)`,
   `DEFAULT_CONFIG`, `ARCHETYPES`, `ARCH_BY_KEY`. Pure, client-safe. The new input
   layer should produce a `cfg` for this API, not touch the engine.
3. Build quirk for a fresh clone: this machine's npm installs production-only by
   default; use `npm install --include=dev`. `smoke.ts` stays excluded in tsconfig.
4. Chart is hand-rolled SVG (no recharts), council house style.
5. The comprehension rework is UI-only on top of a verified engine; do not change
   `sim.ts` behavior or the λ default while doing it.
