# Customer Model — History

Evicted detail from handoff.md. Append-only, dated.

## 2026-06-17 — Engine calibration (resolved)

The engine was built then calibrated through three real bugs, each caught by
running `smoke.ts` rather than eyeballing the code:

1. Death spiral. First run: default scenario lost 100% of customers and
   reputation hit 0 every time. Cause: a price hike read through λ=2.25 as a
   large perceived loss for ~13 rounds before expectations re-anchored, so
   nearly everyone defected at once; reputation only ever decayed, with no
   equilibrium, so acquisition starved permanently. Fix: reputation now
   mean-reverts toward a target set by survivor satisfaction minus churn-driven
   negative word-of-mouth; competitor lure fades after entry; churn is gentler
   and friction-protected; a deadband (fairness < -15) means only real
   grievances flip a customer to defect, not every small gap; faster
   re-anchoring (refAdapt 0.25).

2. Over-forgiving acquisition. After fix 1, the default read as net growth
   because acquisition masked the loss of the grim-trigger segment. Fix:
   acquisition rate lowered (0.05 → 0.03) and gated at reputation > 100.

3. Misleading reputation readout. Harsh scenario showed reputation ~107 despite
   98% churn, because by the final round almost no one was left to churn and the
   handful of survivors were content. Fix: report `minReputation` (the trough),
   not the final tick, in the verdict's reputation clause.

Final calibrated behavior: default holds (~14% net churn) but wipes the
grim-trigger segment at the round-12 hike; harsh preset collapses (~98%);
determinism verified across reruns. Default scenario also softened (hikeSize
18→10, competitorOffer 35→28, friction 30→35, competitorRound 22→26).

## 2026-06-17 — Architecture decisions (settled, see handoff DECISIONS LOCKED)

Prisoner's-dilemma adaptation: kept the Axelrod strategy personalities + the
iterated tournament structure; dropped the symmetric payoff matrix (business↔
customer is asymmetric). Multi-model deliberation verified as redundant among
correlated models; bounded single-model is the default, with the deterministic
engine serving as the independent verification channel. URL settled as a
subdomain (a path on council.fyi would route through the council project).

## 2026-06-17 — UI build + validation gate + repo init (resolved)

Built `src/app/page.tsx` against the real engine API. Controls cover the full
SimConfig; results recompute from the last-run config with a stale badge so the
chart can't silently disagree with the sliders. Results surface wrapped as
`#result-printable` with the verdict + warning chips first (must-show), then
metrics, a hand-rolled two-panel SVG chart, per-archetype survival bars, and a
sourced methodology note. Save/Print + Copy kept outside the printable region;
`@media print` isolation added to globals.css with `print-color-adjust: exact`
so the chart and bars survive on white while text is forced dark.

Validation gate run and GREEN. Snags resolved along the way: (1) this machine's
npm defaults to production installs, so dev deps (typescript, tailwind, types)
were missing and `tsc` wasn't found — fixed with `npm install --include=dev`;
(2) typecheck failed only on `smoke.ts` (imports `sim.ts` with a `.ts`
extension) — excluded it in tsconfig per its scratch-file status; (3) `next
build` then compiled clean, page prerenders static at 8.25 kB. Local git repo
initialized on `main` with scoped adds (never -A); `.gitignore` extended to
cover `next-env.d.ts` and `*.tsbuildinfo`. No remote yet.

## 2026-06-17 — DNS question resolved + save-button baked into the skill

DNS for the subdomain is no longer an open question. Checked Vercel directly:
council.fyi is attached to the council project (prj_OpOXxeBjNpjWcykSfd9oegJPmuOF)
on team_Lh2oOhJYVaJF4VhuRQPnyNa9, and an NS lookup shows council.fyi on
ns1/ns2.vercel-dns.com — Vercel-managed DNS. So the subdomain is zero-touch:
add it to the new Vercel project and Vercel provisions the record + cert. No
registrar CNAME.

The save-button invariant was promoted from a handoff NOTE into the ai-handoff
skill itself (skills/ai-handoff/SKILL.md): a dedicated do-not-violate section, a
reserved permanent NOTES slot in the schema, and a clause in the always-loaded
description. Packaged via skill-creator to an installable `ai-handoff.skill`
(description trimmed to fit the 1024-char cap). Repo copy and packaged copy are
identical.


## 2026-06-17 — Deployed live; next is a plain-language input layer

Shipped the deploy end to end. Created GitHub repo trzz333/customer-model
(private, empty) in the browser, added the origin remote and pushed `main`; GCM
had a cached credential so no auth prompt was needed. Imported the repo into
Vercel under team_Lh2oOhJYVaJF4VhuRQPnyNa9 (verified that is the same team
holding the council project prj_OpOXxeBjNpjWcykSfd9oegJPmuOF and the council.fyi
domain before deploying), Next.js auto-detected, root ./, no env vars. Build
went green and the page prerenders static. Attached customer-model.council.fyi
to Production; it provisioned zero-touch via Vercel-managed DNS and shows Valid
Configuration. Confirmed the live site serves over HTTPS with the verdict,
warning chips, metric grid, SVG chart, and Save/Print all intact.

Jeff then named the real v1 gap: the UI is engine-direct and unreadable to a
non-expert, and there is no place to input the business model. Both are the same
problem. The inputs map straight to engine knobs (archetype shares, λ, policy
levers), so no business-language surface exists. Next session builds that front
door (plain terms in, engine cfg out) and demotes the raw params to an advanced
view. Engine stays frozen; this is UI-only.

## 2026-06-17 — Plain-language input layer built; Vercel deploy BLOCKED

Built the business-language front door on top of the frozen engine, then
reframed it mid-session on Jeff's read of what the "template" is for.

Reframe (the important part): templates are CUSTOMER WORLDS, not business
types. A professor's reusable object is the customer-population lens applied to
ANY business idea, not a pre-baked business. So the UI split into two axes:
define one business once (name, what-you-sell, plus four plain levers: price
move, value posture, retention play, competitive threat), then run it across
named customer worlds (mainstream / fickle bargain-hunters / loyal regulars /
skeptical first-timers / grudge-prone crowd). Each world is an archetype mix +
present-bias; λ is held constant across worlds as the shared science. This also
satisfied "let a school plug in its own businesses": the business panel IS the
custom-input path; the three example chips just pre-fill it.

Comprehension layer (Kahneman framing, applied literally): each result leads
with a plain headline in concrete counts ("keep ~60 of every 100 regulars"),
then one causal sentence naming the mechanism in human terms (a price rise
stings ~λx as much as the same-size cut pleases), then who leaves first. The
engine verdict + warning chips sit below as the auditable record; the numeric
dashboard is collapsed. A "short version" banner reads the spread across worlds
("thrives with regulars, bleeds with bargain-hunters; the gap is your customers,
not your plan") — the cross-world contrast is the actual lesson.

Pre-ship audit (six lenses: entrepreneurship, strategy, marketing/behavioral,
pedagogy, skeptic, adversarial) drove four real fixes: (1) pedagogy caught a
regression — re-added the per-run teaching prompt as a dynamic "use this in
class" block that drives a one-lever A/B by hand; (2) skeptic — added a visible
"structural model, not a forecast" line inside the printable region; (3)
adversarial — event timing now derives from the final round count so changing
rounds in Advanced scales hikes/competitor entry; (4) strategy — flagged the
missing two-business A/B side-by-side as the next feature (deferred, not built).

Code: new `src/lib/business.ts` (FIELDS, EXAMPLES, WORLDS, businessToCfg,
laymanAnalysis, teachingPrompt — pure, engine untouched) and a full
`src/app/page.tsx` rewrite to the two-axis multi-run UI. Save invariant held:
results wrapped in `#result-printable`, verdict + chips always visible per card,
Save/Print + Copy carry `.no-print`, globals.css print block unchanged. Local
`tsc --noEmit` clean, `next build` green, static prerender 11.1 kB. Committed
scoped (page.tsx + business.ts) and pushed: 57985c9..4e5991b.

DEPLOY BLOCKED: Vercel has 4e5991b AND the prior 57985c9 in state BLOCKED;
project reads live:false; last READY production deploy is the older 47789230,
which is what customer-model.council.fyi still serves. The block started after
47789230 (it predates this session), so it is an account/project condition, not
this code. Inspector for the blocked deploy:
https://vercel.com/masterson3433-9774s-projects/customer-model/GwAvttbfF86nABRLzY5nawPaoiFM
Local build is green, so the moment the block clears the input layer goes live.
