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

## 2026-06-18 — Audit-lens triage, outside-view band, paste field, two deploys

Jeff handed over the "kitchen sink" adversarial-audit doc (a 14-lens review of a
GenAI Media proposal plus a Gemini meta-audit) and asked which lenses belong in
the Customer Model, what other standard customer-analysis methods fit in under a
week, UI cognitive-ease moves for incoming freshmen, and graceful handling of a
long pasted business model.

Decision rule adopted (generalizing Jeff's "six sigma was overkill"): a lens
earns a place only if it is expressible as a cfg manipulation or a result read on
the frozen engine. The doc's real lesson — confirmed by the Gemini meta-audit —
is that stacking redundant lenses manufactured rigor and diluted the two findings
that mattered (base-rate category error; scaling paradox); the filter does the
selection. Result: reference-class/outside-view (lens 6), noise audit (lens 2),
and inversion/worst-case (lens 8) all collapse into one cheap sweep over the
deterministic engine; CLV + a Fermi sanity line (lens 13) is a read on
totalRevenue. Six Sigma DMAIC and the writing-exercise lenses (sycophancy,
cognitive-bias inventory, premortem, red-team, steel-man, second-order,
Chesterton, JTBD) were rejected with reasons — already embodied in the engine, or
not native to a customer sim.

Built and shipped (engine untouched):
- Outside-view band: referenceBand() runs the business across all 5 worlds × 7
  seeds; each card anchors "Is ~85 good?" against the full 56–106 range, and the
  short-version banner carries it. Reference-class forecasting and a Kahneman
  noise band in one sweep; closes the comprehension gap of an unanchored count.
- unitEconomics(): an honest, unit-free CLV line (rounds of full price per
  starting customer), naming the promo leak when material. No invented dollars —
  the input never captured a price.
- Business-model paste: optional `model` on BizInput; a long paste travels into
  the saved/printed copy and is NOT LLM-parsed. Resolved the prior open autofill
  question in the determinist direction — the student still sets the four levers
  (the pedagogy), v1 stays key-free. First shipped as a collapsed textarea (hid
  the content); fixed to a snapshot card (first sentence, click to expand) after
  Jeff flagged that a user must see what they pasted.
- Fixed the logged net-growth wart: the "first to leave / lever to pull" line is
  suppressed when the scenario nets positive.

Deploys: f2fcc6a (band + paste + CLV + wart) → READY (dpl_4Rq1Gsv); cd40100
(snapshot card) → READY (dpl_AHjsRmA). Both authored as masterson3433@gmail.com;
the jeff@local block did not recur. Validation green each time (tsc clean, build
12.2 kB). Note: commit messages with `;`/quotes mangled through PowerShell; used
`git commit -F` with a temp message file.

Faculty review received: Jeff ran the prior version through an embedded-browser
Claude acting as a business-school faculty member. Its priorities (A/B compare,
shareable seeded run-links, a finance/LTV layer, a fuller methodology appendix,
plus the "keep ~107 of 100" relabel, humility on verdict wording, glossary, CSV)
are folded into handoff NEXT MOVE / OPEN QUESTIONS / NOTES. Its economic-layer ask
was partly met by the CLV line; the deeper margin/NPV layer is now an explicit
open question because it trades against freshman cognitive ease.

Evicted from handoff this date: the Vercel jeff@local block saga (resolved —
author email fixed globally), the prior A/B-vs-autofill open question (autofill
deferred; paste is context, not parse), and the standalone HTML prototype note.


## 2026-06-18 — Engine unfrozen for load-bearing λ; finance; honesty pass

Resolved/evicted from handoff this date:

- OPEN QUESTION "economic depth" → RESOLVED: finance layer shipped as an opt-in
  collapsed block (launch price, gross margin, CAC, per-round discount) feeding a
  collapsed per-world dollar read (revenue, contribution, NPV, LTV:CAC, payback).
  Off until a price is entered, so the freshman path stays unit-free. Reads
  engine `rounds[].revenue`. NPV calendar-mapping deferred to v2.

- DECISION CHANGED: the engine was previously "FROZEN" as a hard rule. Jeff
  lifted that this date to get meaningful math. The freeze was a self-imposed
  discipline (don't churn the differentiated core), not a technical constraint.
  New posture: disciplined but not sealed; engine edits allowed when the math
  demands and are sweep-verified. Re-frozen on the new perception core.

- ENGINE REWORK detail: the old core computed a fairness score (λ-scaled price
  and value gaps) then collapsed it to a binary signal at a hard deadband (−15),
  which discarded λ's magnitude past the threshold — so λ was inert in saturated
  builds (the embedded-reviewer's "λ is decorative" finding, correct). Replaced
  with a reference-dependent value function (TK 1992: losses ×λ, gains and losses
  raised to α=0.88) → logit defect probability (PERC_TOL=22, PERC_TEMP=7) →
  unchanged strategy intent → friction gate, plus a per-round λ-scaled grievance
  term in the leave probability. Form follows Hardie-Johnson-Fader (1993, Mktg
  Sci) reference-dependent logit brand choice. Calibration was tuned by a node
  λ-sweep harness over five worlds × two-to-four scenarios; landed where λ
  1.0→3.5 swings the headline 15–24 pts on builds with headroom, monotonic,
  while the maximal-catastrophe build (raiseB/thin/none/hard) correctly floors.

- HONESTY PASS (from the faculty/embedded audit): headline relabeled "keep X of
  100" → "end with X per 100 started" everywhere (fixes >100% incoherence +
  discloses population rescaling); teaching-prompt λ now reads live from the
  slider (was hardcoded "twice as heavy"); methodology rewritten to cite HJF/TK,
  name λ as load-bearing, explain the noise knob and per-100 rescaling, and stop
  calling the Axelrod names an iterated game; competitor-pull prose no longer
  calls non-impulsive worlds "steadier". Rejected from the audit: "make λ
  load-bearing by editing the engine" was the right diagnosis with a fix we then
  actually did this session; "there is no finance block" was stale (pre-deploy).

- docs/plan.md created as the running roadmap + v2 parking lot + decision log.


## 2026-06-18 — Two embedded audits, honesty pass, demographic-redesign decided

Resolved this session, evicted from handoff.md:

- Generated a fresh embedded-audit prompt with an anti-contamination rule after the
  prior audit's "Copy writeup emits the CLAUDE BOOTSTRAP" finding turned out to be a
  false positive: the app's copy reads #result-printable.innerText; the bootstrap
  text exists only in docs/ and the ai-handoff skill (the seed used to brief the
  audit session), so the auditor read its own seed back. No bug there.
- Fixed the real adjacent defect: copyWriteup read innerText without opening the
  collapsed details.numbers, so Copy dropped the finance + segment tables. Now mirrors
  printAll's force-open and restores prior open state. Commit c9d1157.
- Second audit confirmed the Copy fix (read back 11,048 chars, finance table present).
  Its two high-severity findings (seed swing ≈ λ swing, presented as a point estimate;
  λ "load-bearing" stated unconditionally but conditional in fact) verified TRUE by
  offline engine sweep. Its "Print drops finance/segment tables" and "rival early/late
  lever cosmetic" findings verified FALSE against the source.
- Offline sweep findings (tmp compile of sim.ts + business.ts, since deleted): λ swing
  0 to ~40 pts depending on whether an unbuffered loss exists and the model isn't
  floored; seed moves results ~5-8 pts even at noise 0 because the engine is an
  agent-based Monte Carlo (RNG drives population sampling + every churn draw, not just
  the noise flip).
- Honesty pass shipped (commit 643577e): conditioned the three unconditional claims
  (Methodology λ sentence, Methodology seed sentence, Advanced-panel λ line) to match
  measured behavior.
- Decided the next phase (researched: uncertainty-viz / HOPs, progressive disclosure,
  Capsim pedagogy): two-mode UI (jargon-free Class view default, Instructor view for
  knobs), Monte-Carlo band headline replacing the single-seed point, info hovers,
  randomness as an instructor difficulty knob (no student-facing "seed"), selective
  export. No machine learning — the Monte Carlo idea is distributions, not a fitted
  model. Build deferred to a fresh session via this handoff.

## 2026-06-18 — Demographic-fit redesign shipped (resolved)

The redesign that the prior handoff carried as NEXT MOVE ("decided and
researched, not yet built") is now built and pushed (900b648), engine untouched.
Six pieces, one pass:

1. Two-mode UI plus an emphasis variant. A top segmented control: Class
   (default, plain, no dials), Instructor (the dials + behavioral detail), and
   Finance focus (Instructor with emphasis=finance — leads with the dollar table
   open, folds the behavioral-economics methodology into a collapsed details).
   No password gates anywhere; any mode is open to anyone, by Jeff's call. The
   finance-focus emphasis answers his "not every finance professor wants
   bombarded with behavioral econ" note without adding a third access tier.
2. Per-world Monte-Carlo band headline. New `sweepWorld` + `bandPhrase` in
   business.ts run the fixed REF_SEEDS set against one world and return the
   median run as the representative roll, so the card's chart, causal story, and
   numbers all match the band headline ("usually about N, between lo and hi").
   The all-world `referenceBand` is unchanged and still drives the "is ~N good?"
   line. Engine (sim.ts) not touched.
3. "Watch it play out": a per-card BandStrip (a dot per seed on a track) plus a
   play button that re-rolls the actual active-customers chart through the seeds
   in seed order, so the spread is felt. no-print; resets when inputs change.
4. 8th-grade info hovers: a `Term` component (dotted underline, title= for hover,
   click toggle for touch, popover is no-print) on every surviving jargon term
   (churn, retention, reputation, tipping, contribution, NPV, LTV:CAC, payback,
   loss aversion, present bias, customer worlds, λ).
5. Randomness is now a Calm/Normal/Harsh difficulty control (maps to engine
   noise 0.02/0.05/0.12); the word "seed" is gone from the surface entirely. The
   old seed + noise sliders were removed; rounds + λ sliders stay in Advanced.
6. Selective export: an instructor-only "Saved copy includes" checkbox panel
   (model, class prompt, charts, numbers, finance, methodology). Deselected
   sections get `.export-hidden`, which `@media print` drops and copyWriteup
   display:none's before reading innerText. The verdict + warning chips carry NO
   class and NO toggle, so they survive every saved copy by construction — the
   save-button invariant, now enforced through the selective path too.

Resolved open question from the prior handoff: instructor-view access is a plain
toggle, not gated by link/param (Jeff: no gates on any mode). Validation: tsc
clean, build green, route grew 14.3 kB → 17.3 kB.

## 2026-06-18 — v1 close-out part 1: run-link, compression, A/B compare (resolved)

Three features shipped on the frozen engine (cfg + result reads only; sim.ts
untouched). Commits e67f31a, a601e75, 4dc62b9.

**Shareable seeded run-link (e67f31a).** A displayed run encodes its business
levers, chosen customer worlds, difficulty, λ, rounds, and optional finance
into a URL token stamped with ENGINE_VERSION. Opening `?r=...` re-runs the
frozen engine on those inputs, so a graded result reproduces against a known
engine; verdict + warnings regenerate from the numbers and can't be dropped in
transit. Engine-version mismatch surfaces a banner instead of silently
returning different numbers. No raw seed travels — the band comes from the
fixed internal REF_SEEDS, pinned by the engine version, consistent with the
"difficulty not seed" rule. Codec in business.ts: encodeRunLink/decodeRunLink,
defensive decode (malformed token ignored, per-field enum validation), versioned
schema. Copy-link button + on-mount decode + mismatch notice in page.tsx.

**Compression (a601e75).** Researched rather than guessed: lz-string's
compressToEncodedURIComponent is the purpose-built standard for state-in-URL
(synchronous, URI-safe, deterministic, ~3 KB, no transitive deps). Measured it
beating hand-rolled base64url at every size — a typical run ~17% smaller, a
long pasted model 3-4x smaller (3362-char JSON → 1251-char token vs 4483 raw).
Swapped the codec; new tokens carry a leading codec marker "1"; the base64url
decode path is kept only to read any pre-compression link. lz-string@1.5.0 is
CJS — named ESM import fails under raw node but Next/webpack interops fine.

**Two-business A/B compare with cross-world inversion finder (4dc62b9).**
Optional second business (toggle + condensed B editor reusing FIELDS). When on,
each chosen world is swept for BOTH businesses (reusing sweepWorld) and their
typical-run bands compared. The inversion: a world whose per-world winner
contradicts the overall winner is surfaced as a warning-class callout — the
reference-class lesson that the better plan can depend on who the customers are.
compareBusinesses is pure cfg+result reads. CompareBlock lives in
#result-printable with no export toggle, so verdict + inversion always survive a
saved copy. Run-link extended to carry the second business + compare flag.

**devDep-prune lesson.** A bare `npm install lz-string` pruned devDependencies
(typescript among them), breaking the build. Fix is the documented
`npm install --include=dev`. typescript re-pinned at 5.8.2. The method that
failed was the bare install; the documented include-dev install is the method.

**Deferred (the other reading of "inversion finder").** The within-world
single-lever fragility sweep — hold one world fixed, sweep A's small lever space,
find the smallest single-lever change that flips the verdict. Built the
cross-world inversion as the load-bearing pedagogical version; this adversarial
lever-sweep variant is a clean next item, reuses the same sweep primitive.


## 2026-06-18 — v1 close-out: faculty pair + fragility sweep (RESOLVED)

Shipped the last three v1 surfaces on the frozen engine (sim.ts untouched all
session); commits 4208bbc (faculty pair) and e0804c8 (fragility). typecheck
clean, build green both times.

**Glossary page (4208bbc).** New static route /glossary. The inline hover defs
were lifted out of page.tsx into `TERM_DEFS` in business.ts as the single
source; `GLOSSARY` (ordered, human-labelled) is derived from it so a definition
is never written twice. The page also surfaces the five customer worlds and the
seven archetypes (name + Axelrod label + tagline), since those are the real
student-facing vocabulary and were already exported. Reached from a no-print
"Glossary ↗" link in the header. Server component, prerendered (123 B).

**Per-round CSV export (4208bbc).** "Download CSV" button (no-print chrome, next
to Copy link, only rendered when sweeps exist). `runsToCsv(sweeps)` in
business.ts flattens the median run of each swept world into one CSV with a
leading `world` column and the full RoundMetric row (round, active,
churned_this_round, exploiting, revenue_index, reputation, churn_rate) — chose
the full row over the five named in the old handoff since a raw data dump costs
nothing by being complete. Median run, so the rows reconcile with the chart.
Carries no verdict text by design: it's raw data, a different artifact from the
results surface the save invariant governs.

**Within-world single-lever fragility sweep (e0804c8).** The deferred reading,
now built. `fragilityScan(biz, world, adv)` + `fragilityPhrase(f)` in
business.ts: hold one world fixed, change one of A's four moves at a time (each
lever to its other allowed values, rest held), re-sweep via the existing
sweepWorld, and find the "lightest" flip — the change whose new band-mid lands
closest to the verdict-tone line it crosses, i.e. the smallest nudge that still
tips the verdict. Robust = no single move flips it. Tone comes from bandPhrase
so it matches the cards. Opt-in via an instructor-flavored sidebar toggle (off
by default, so the default path isn't slowed by the extra ~10 sweeps/world);
gated in derived on ran.fragility. FragilityBlock renders per chosen world
inside #result-printable, export-toggleable (exp.fragility). Threaded through
the run-link as additive field "fr" (backward-compatible: old tokens decode to
false; LINK_SCHEMA stayed 1). Single-lever only by construction — combinations
aren't counted, stated in the block's footnote.

This closes the v1 build list. The only remaining v1 item is a decision, not a
build: whether the single-model LLM voice ever ships, and as archetype narration
vs business autofill. Also produced (outside the repo) a faculty-review prompt:
a paste-into-fresh-Claude persona prompt that has a skeptical seasoned B-school
faculty member exercise the live tool and return a blunt go/no-go.
