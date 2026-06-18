# Customer Model — Handoff

State doc. Terse by design. Resolved detail lives in docs/history.md.

## PROJECT
A business-school AI tool: a deterministic, game-theory + behavioral-economics
simulation that stress-tests a business model against synthetic customer
archetypes. Target URL: customer-model.council.fyi (its own repo + Vercel
project, isolated from the council repo).

## PHASE
Engine + UI built and verified. Local repo committed. Not yet deployed.

## LAST COMMIT
71d9ad1 — feat: bake save-button invariant into ai-handoff skill plus session handoff
(preceded by 69798d1 — feat: results UI with save/print, deterministic engine wired)

## CURRENT STATE
`src/lib/sim.ts` (engine) and `src/app/page.tsx` (UI) are both built. The page
is a client component: left rail carries the full control set (market, the
seven-archetype mix with live normalized shares, policy levers, behavioral
params with λ default 2.25, scenario events) plus Default/Harsh presets, where
Harsh mirrors smoke.ts. Results recompute from the last *run* config (a moved
slider shows a "re-run" badge rather than silently desyncing the chart). The
results region is wrapped `#result-printable` and leads with the deterministic
verdict and its warning chips, then headline metrics, a hand-rolled two-panel
SVG chart (active customers + event/tipping markers; reputation line + churn
bars), per-archetype survival bars, and a sourced methodology note. Save/Print
and Copy sit outside the printable region. Validation gate is GREEN: install,
`tsc --noEmit`, and `next build` all pass; page prerenders static at 8.25 kB.

## NEXT MOVE
Stage the deploy. Create GitHub repo trzz333/customer-model and push `main`
(the `gh` CLI is NOT installed on this machine — install it or Jeff creates the
repo and adds the remote). Then create the Vercel project linked to that repo
and add the domain customer-model.council.fyi in the new project — DNS is
zero-touch (see DEPLOY STATE). Voice layer is still deferred (see OPEN QUESTIONS).

## DEPLOY STATE
- Local repo: YES — initialized, scoped commits, branch `main`. No remote yet.
- GitHub repo: NO. Blocker: `gh` not installed; needs creating + remote add + push.
- Vercel project: NO. Account/team confirmed (team_Lh2oOhJYVaJF4VhuRQPnyNa9).
- Subdomain customer-model.council.fyi: NO, but path is known and zero-touch.
  council.fyi is attached to the council Vercel project and its nameservers are
  ns1/ns2.vercel-dns.com (Vercel-managed DNS). Adding the subdomain to the new
  Vercel project auto-provisions the record + cert. No registrar CNAME needed.
- Env vars: NO. ANTHROPIC_API_KEY into Vercel env (Jeff pastes the value), only
  once the optional voice layer ships.

## DECISIONS LOCKED
Standalone project, not in the council repo. Deterministic engine is the
differentiated core; frontier synthetic-customer tools are LLM survey-respondents
and this is not that. Optional LLM "voice of the customer" is single-model
narration grounded in the numbers, not a committee (multi-agent verified
redundant, not additive). λ defaults to 2.25 (Tversky-Kahneman), tunable. The
save-button invariant is now baked into the ai-handoff skill itself, not just
this doc: every handoff carries it forward.

## OPEN QUESTIONS
Whether the LLM voice layer ships in v1 or after the deterministic app is live.

## NOTES
1. SAVE BUTTON — shipped in page.tsx (Save/Print over `#result-printable`,
   `@media print` block in globals.css) and the verdict-with-warnings is the
   must-show section in the saved copy. This is a permanent invariant, restated
   every handoff and never evicted even though it now ships. Do not build a
   separate "clean" export that drops the verdict.
2. Engine API (unchanged): `runSimulation(cfg)`, `verdict(cfg, r)`,
   `DEFAULT_CONFIG`, `ARCHETYPES`, `ARCH_BY_KEY`. Pure, client-safe.
3. Build quirks for a fresh clone: this machine's npm installs production-only
   by default, so dev deps were missing — use `npm install --include=dev`.
   `smoke.ts` is excluded in tsconfig (it imports sim.ts with a .ts extension);
   keep it excluded. `next-env.d.ts` and `*.tsbuildinfo` are gitignored.
4. Chart is hand-rolled SVG (no recharts), council house style.
5. Methodology note in-app cites Axelrod tournaments and Tversky-Kahneman λ
   (meta-mean ~1.96, range ~1.5–3) and the deterministic-over-committee rationale.
