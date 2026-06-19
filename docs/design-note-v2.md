# Customer Model — v2 Design Note: retention vocabulary, anchoring, peak-end

Pre-build spec for the first three v2 mechanisms. Direction and verdicts live in
plan.md (V2 MARKETING-PSYCHOLOGY RESEARCH and PARKING LOT #1). This note turns the
top items into something buildable: for each one, the honest evidence posture, the
engine variable it touches, whether it is prose-only or a versioned engine
mechanism, the proposed functional form, and the sweep that has to pass before it
ships. Engine (sim.ts) stays frozen; anything marked "versioned engine mechanism"
is a challenger for a future ENGINE_VERSION bump, gated on its sweep, not a v1
lever rename.

Governing spine (from plan.md): model only effects that survive replication, at
honest (often smaller) sizes, and say so in the UI. Selectivity is the pitch.

## DECISIONS TAKEN (Jeff delegated the calls this session)
1. Retention vocabulary ships as a SMALL TYPED LAYER, not inline prose, and names
   FOUR mechanisms. Reasoning: the spine already routes each mechanism to "prose
   that resolves to a knob" or "engine math"; the friction/promo cluster is the
   prose side, and a typed table next to TERM_DEFS/ARCH_DEF in business.ts keeps
   the naming single-sourced and auditable instead of drifting across page.tsx
   string templates. Four is the ceiling that still maps cleanly to the existing
   knobs; network effects, reciprocity, and brand are held because they do not map
   to one knob without a shoehorn or a double-count.
2. Anchoring is the LEAD engine challenger, in its reference-price form only. The
   decoy / premium-tier form is the contested branch and is held (off by default,
   explicitly labeled) if it ever ships.
3. Peak-end is the SECOND engine challenger, in a conservative weighted-memory
   form that keeps the running average. The naive "memory = peak + end" form is
   rejected for this tool's unit of analysis (an extended, heterogeneous customer
   relationship), where the evidence says the average and the first impression
   reassert.

## 1. RETENTION VOCABULARY (prose layer, resolves to existing knobs)
Status: SHIPPED (prose/data layer, no engine math). Touches nothing in sim.ts.

PRIOR-ART RECONCILIATION (found at build time): the retention lever already exists.
business.ts has a `Retention` enum (none | loyalty | lockin | promo), a four-option
form question, and a `businessToCfg` mapping to friction/promo (none 18, loyalty 45,
lockin 72 "high switching cost", promo 32 + promoActive). So this is NOT a greenfield
table; the four options are already there and already resolve to the knobs. The note's
original four names (switching cost, contractual lock-in, habit/inertia, default/
auto-renew) did not line up with the existing enum, and two of them would need a new
enum value + cfg mapping + run-link schema bump, i.e. NOT prose-only. Reconciled build:

What shipped: a single-source `RETENTION_MECHANISMS` table in business.ts keyed to the
EXISTING enum. It owns the WORDS only (label, under-option note, mechanism name,
in-sentence phrase, plain def); the friction/promo NUMBERS stay solely in
businessToCfg. FIELDS (the form), RET_DESC (teaching prompt), and GLOSSARY all derive
from it, so the retention vocabulary lives once. Honest naming of the four existing
options: No retention play; Loyalty / earned reward (moderate friction); Lock-in
(contract + switching cost), whose def DISCLOSES that contract and switching cost are
two different real mechanisms the engine collapses into one high-friction knob;
Standing discount (moderate friction + promo, with the margin-leak caveat). No enum,
cfg, run-link, or engine change; build green at / 24.9 kB.

What was corrected vs the original note:
- Habit / inertia is NOT a business retention play in this engine. It already exists
  on the CUSTOMER side as the `inertial` archetype. Offering it as a fourth lever
  would be a category error; the vocabulary names it in the right place instead.
- Default / auto-renew is a genuinely new mechanism the lever does not carry. It is a
  distinct inertia-plus-endorsement nudge, not "more friction" and not the same as the
  standing promo. It is DEFERRED to a versioned step (new enum value + cfg mapping +
  run-link schema v2), carrying the contested-nudge caveat (Mertens 2022 d about 0.43
  vs Maier 2022 PNAS null after publication-bias correction).
- Splitting Lock-in into separate "contract" and "switching cost" options is the same
  kind of schema-bump step, deferred. For now the conflation is disclosed in prose
  rather than faked apart.

## 2. ANCHORING / REFERENCE PRICE (versioned engine mechanism, LEAD challenger)
STATUS: engine SHIPPED as ENGINE_VERSION 2.1.0 and VERIFIED. sim.ts adds anchorRound/
anchorShift: an additive anchorEffect lifts the JUDGED reference (effRefPrice =
refPrice + anchorEffect), decaying at (1-refAdapt)^k, never written into refPrice and
never touching real price/revenue. Driven via AdvOverride.anchorShift (capped to ±20
in businessToCfg). The pre-registered sweep (sweep-anchor.ts) passes all four gates:
(1) off-path identity — anchor off reproduces 2.0.0 default revenue 1771114 exactly;
(2) monotonic headroom — keep climbs 59→82 as shift 0→25 on a hike build; (3) decays
back — frame ~1% by +16 rounds, late-run churn equal with/without (no permanent lift);
(4) floors on stress — +17.6 keep on a headroom build vs −1.1 on a catastrophe build.
PENDING (next): UI exposure (a Deep-dive control; my call is Teaching/Deep-dive, not the
default Student read) and run-link persistence (add anchorShift/anchorRound to the adv
token, backward-compatible, decode-clamped). Until then it is engine-ready and
adv-drivable but not user-reachable.

Evidence posture (verified this session): estimation anchoring is robust (Many
Labs 1 replicated it stronger than the original Jacowitz-Kahneman 1995 effect). The
reference-price application (an external "was $X" reference shifting the perceived
deal) is the well-established marketing form. The DECOY / asymmetric-dominance form
is the fragile branch: Frederick-Lee-Baskin 2014 and Yang-Lynn 2014 show it largely
vanishes with naturalistic, non-numeric stimuli and can even reverse (the repulsion
effect). So build the reference-price move; flag and hold the decoy.

Engine variable: the existing adapting reference point in the value function (the TK
reference that each round's loss or gain is measured against). Today it tracks
realized price history. The change lets a business action set or shift the reference
WITHOUT changing the real price paid, so the same price registers as a smaller loss
(or a gain) through the existing lambda-weighted kink.

Proposed form: add a `referenceShift` term to cfg (default 0) that offsets the
reference point used in the value computation for the rounds it is active, decaying
back toward realized price over a few rounds (a reference does not stay fooled
forever; tie the decay to the adaptation the engine already applies). Real price in
revenue/finance is untouched, so the dollar figures stay honest while perceived
value moves. Magnitude capped small: the robust effect is the framing, not a free
permanent discount.

Verifying sweep (pre-registered): hold real price and everything else constant;
sweep `referenceShift` across its range on a build with headroom. Expected: the
headline moves monotonically in the framing direction and decays back as the
reference re-anchors; on a maximal-stress build it floors (the same correct lambda
saturation already in the engine). FAIL CONDITION: if a one-time "was $X" reference
produces a permanent, non-decaying lift, the form is wrong (it has become a hidden
price cut) and does not ship.

Decoy tier: HELD. If ever built, it is a separate small nudge on a premium-tier
comparison, behind an explicit toggle, default off, labeled "contested: weak
outside numeric comparisons." Recommend shipping reference-price alone first.

## 3. PEAK-END MEMORY (versioned engine mechanism, SECOND challenger)
STATUS: engine SHIPPED as ENGINE_VERSION 2.2.0 and VERIFIED (sweep-peakend.ts, all
gates pass). sim.ts adds collapseReputation + REP_MEMORY weights {avg .58, first .22,
peak .10, end .10}; acquisition runs off the remembered reputation (series-so-far
collapsed by those weights), not the latest smoothed value. Identity weights
{0,0,0,1} reproduce 2.1.0 byte-for-byte (the engine's rollback point); the 2.2.0
default-run revenue is 1762833 (down from 2.1.0's 1771114) because peak-end is now
live on the default run. The deep-tier methodology names the mechanism and its
evidence. NOT a user lever: weights are calibrated engine science, like λ.

Evidence posture (verified this session): the clinical/pain peak-end result
(Redelmeier-Kahneman) is robust. But for COMPLEX, heterogeneous experiences a 2019
VR study found peak and end are inferior to a simple average at predicting
remembered experience, and a 5,000-stay hotel field study (McCullough et al. 2024,
J. Business Research) found FIRST impressions dominate overall satisfaction, more so
as recall delay grows. The tool's unit is an extended multi-round relationship,
which is the complex/heterogeneous case, so naive peak-end is rejected. The honest
form keeps the average and adds modest first + peak + end weights.

Engine variable: reputation. Today reputation builds off per-round satisfaction
(effectively a running average with decay). The change reshapes how the round series
collapses into the reputation that feeds word-of-mouth and acquisition.

Proposed form: reputation_memory = w_avg * mean(series) + w_first * first +
w_peak * peak_extreme + w_end * last, weights summing to 1, with w_avg the LARGEST
by default (the average reasserts for extended experiences; first/peak/end are
modest corrections, not the whole story). peak_extreme is the most extreme valence
in the series, which captures the negative-peak case where the effect is strongest.
Deterministic, no new randomness.

Verifying sweep (pre-registered, RECONCILED). The original verifier here read
"the falling and late-dip series must end with lower reputation than the rising one."
That encodes NAIVE peak-end (recency wins) — which this section itself rejects, and
which contradicts the cited first-impression evidence. For two equal-mean series
whose peaks coincide (rising 60→120, falling 120→60), the peak term cancels and
remembered_falling − remembered_rising = 60·(w_first − w_end); the old gate would
force w_end > w_first, the opposite of McCullough's "first impressions dominate." Per
AGENTS.md (when prior art contradicts the plan, prior art wins and the plan is
reconciled in writing), the gate was replaced — before running — with evidence-
aligned checks (sweep-peakend.ts):
- G1 OFF-PATH IDENTITY: identity weights {0,0,0,1} reproduce 2.1.0 default revenue
  (1771114) exactly.
- G2 AVERAGE DOMINANCE + CONVERGENCE: on the three equal-mean series the remembered
  values stay within a modest band of the common mean, and the spread shrinks
  monotonically to zero as w_avg → 1 (proving the average dominates, corrections
  modest).
- G3 FIRST-IMPRESSION (the replacement directional gate): the better first impression
  (falling, starts 120) is remembered at least as well as the worse one (rising,
  starts 60). This is the McCullough effect, the opposite of the old gate.
- G4 NEGATIVE-PEAK PULL: a severe late crater (late-dip, same mean) is remembered
  BELOW the rising series — the robust, retained part of peak-end.
- G5 FLAT INVARIANT (the design note's actual FAIL CONDITION): a flat series is
  invariant to every single non-average weight (no shape ⇒ corrections vanish).
- G6/G7: weights well-formed (sum 1, avg strictly largest) and the mechanism is live
  yet modestly sized in the full engine (on a healthy build, the first-impression
  anchor tempers runaway word of mouth by < 1 per 100).
Default weights {avg .58, first .22, peak .10, end .10} were set against these gates,
not by eye. All pass.

## SEQUENCING
Ship order: (1) retention vocabulary — DONE (single-source RETENTION_MECHANISMS
table over the existing enum; prose/data only, build green). (2) anchoring
reference-price as the first ENGINE_VERSION challenger, gated on its sweep;
(3) peak-end memory as the second challenger. The deferred retention schema-bump
(default/auto-renew as a new lever, and splitting lock-in into contract vs switching
cost) is a smaller versioned step that can land before or after anchoring. Decoy
tier and the held mechanisms (network effects, reciprocity, brand) are later-version
candidates. Each engine challenger is a version bump, old version archived, rollback
via git.

## RESOLVED (Jeff delegated taste + set the "minimal default" directive, 2026-06-19)
Jeff handed both forks to Claude ("the taste stuff is up to you, best balance of
evidence") and added a standing directive: the UI must look MINIMAL by default.
That directive, plus the locked "Student tier has no dials" rule, breaks the ties.

PRINCIPLE NOW STANDING: minimal by default, depth on demand. The fresh-visit
surface carries only what a novice needs to act; named mechanisms and contested
levers are revealed one tier up, in the glossary, or only when a faculty-shared
run-link turns them on. This is the progressive-disclosure spine the project
already adopted from comparable business sims (Capsim tier-by-complexity), now
made explicit as the tie-breaker for tier-placement calls.

1. Named retention mechanisms in Student: STAY OUT of the Student read beyond the
   plain option labels they already carry ("A contract or commitment", "High
   switching cost", "It auto-renews by default"). The mechanism NAME and its
   honest def live in the Glossary (open to all) and in Teaching's tappable terms.
   The plain label already conveys the move; the name is a tier up for the curious.
   No code change needed; current gating already matched the call.

2. Reference-price (anchoring) lever in Student: the DIAL stays Teaching/Deep only.
   Reasons: (a) the locked no-dials rule for Student; (b) minimal default; (c) the
   implemented frame is reference-price/WTP anchoring, the more MIXED application
   (estimation anchoring is the robust one), so handing novices the knob
   unscaffolded is exactly where the caveat pass said to be cautious. BUT the
   mechanism is now TEACHABLE where the evidence says students should meet it: a
   plain `anchor` def added to TERM_DEFS, a Glossary entry, and one anchoring-GATED
   sentence in the Student/Teaching "How to read this" block, so a faculty link
   that turns the frame on explains it instead of only tagging it. Off by default,
   so the minimal fresh landing is untouched. Synthesis: students SEE and learn the
   frame (effect plus plain explanation), faculty CONTROL it (the dial).


## CAVEAT RECONCILIATION (literature pass, 2026-06-19)
Jeff asked how the field has overcome the caveats that led me to size three v2
mechanisms conservatively. Short version: the conservative calls mostly hold. The
research firms up the justification, re-bases one sizing, and tips one parked taste
fork. No mechanism is unlocked for a large effect bump on this evidence, which is the
replication standard working as intended.

### Anchoring (reference-price)
Caveat carried: estimation anchoring is robust (Many Labs 1), marketing/WTP anchoring
is mixed, and the decoy branch does not replicate outside numeric stimuli.
Field response: the WTP/WTA anchoring meta-analysis ("Anchoring in Economics", J.
Behav. Exp. Econ. 2020, 53 studies) finds a moderate effect, smaller than early
studies, and names the moderators that recover the strong effect: high anchor relevance
and compatibility, buying (not selling) tasks, and non-lab settings. A "was $X"
reference price is exactly a relevant, compatible, purchase-side anchor, so it sits in
the robust regime, not the fragile arbitrary-anchor regime. Li & Weigel (Economic
Inquiry 2025) is the cleanest recent statement: the direction replicates robustly, the
magnitude is smaller than the classic figures. Brzozowicz & Krawczyk (PLOS ONE 2022)
add that incentivized decisions attenuate anchoring relative to hypothetical ones.
Call: KEEP the modest decaying frame as is (it already encodes "directional, magnitude
smaller than headline"). Decoy stays excluded (only directional anchoring replicates).
This evidence tips the parked taste fork toward exposing the reference-price lever in
the Student tier: it is the robust, teachable, defensible form of anchoring, not the
contested one. Jeff still owns that fork.

### Peak-end memory
Caveat carried: naive peak+end (duration-neglect, average-ignoring) fails for extended,
heterogeneous relationships; the average and first impression reassert (the VR study;
McCullough et al. 2024 hotel field study).
Field response: Alaybek et al. (Org. Behav. Hum. Decis. Process. 2022) is the synthesis.
Across studies, peak, end, AND average all carry robust, roughly comparable weight on
the retrospective evaluation, while trend is considerably weaker. That validates a
COMPOSITE (average + peak + end, weak trend), not naive peak+end and not average-only.
For extended relationships specifically, Clark et al. ("Kahneman meets the Quitters")
found a peak-end transformation of a long job-satisfaction series predicts quitting,
which is structurally our churn case, so peak-end shape carries signal over a long
relationship. Garbinsky, Morewedge & Shiv (2014): recency beats primacy for extended
hedonic runs via memory interference, but primacy reasserts when the first moment is
made salient (a customer's onboarding/first impression is salient).
Call: the current weights {avg .58, first .22, peak .10, end .10} are DEFENSIBLE and
stay. Alaybek's "peak/end comparable to average" pools across experience types, many
short and simple where peak-end is strongest; it does not override the
extended-relationship evidence that average and first impression dominate our case. One
candidate refinement, low priority and pre-registered: test a slightly stronger
NEGATIVE-peak term (the robust, retained part of peak-end is a severe failure), gated by
G4, with the fail condition that it must not move equal-mean verdicts beyond the band G2
allows. An option for the next engine session, not a mandate. [CLOSED 2026-06-19:
tested in sweep-peakend-negpeak.ts; ADMISSIBLE-BUT-NOT-MATERIAL, 2.2.0 stays champion.
See Net next steps 3.]

### Default / auto-renew nudge (deferred retention bump)
Caveat carried: nudge effects are contested (Mertens 2022 aggregate d approx 0.43 vs
Maier 2022 near-null after publication-bias correction).
Field response: the contested aggregate is the wrong number to size on. Both camps now
agree the error is pooling incommensurable nudges (the DataColada "Meaningless Means"
critique; Mertens' own reply). Sized on default-specific evidence, defaults are the
single most robust subcategory: Jachimowicz et al. (Behav. Public Policy 2019) put
defaults well above other nudge types (and above framing d approx 0.31, eating-nudge
d approx 0.23), and Mertens' own forest plot has defaults among the top categories
(d approx 0.62). The reliability lever is the endorsement pathway: defaults work best
when the decision-maker infers the default is recommended and when the default and its
purpose are transparent (Jachimowicz 2019; Paunov et al.). Our design already specifies
the default lever as "inertia-plus-endorsement, not just more friction," so it already
encodes the lever that makes defaults reliable. Counterweight: DellaVigna & Linos (2022)
show Nudge-Unit field RCTs run smaller than published effects, and some default effects
fail to replicate at scale (Kristal et al. 2020), so size toward the field lower bound.
Call: when the default/auto-renew lever is built, REPLACE the "contested, near-null"
caveat with the accurate one: defaults are the most robust nudge subcategory, sized at
the conservative field end, conditioned on the endorsement/transparency pathway the
design already uses. An upgrade of the justification, not an effect-size increase beyond
the modest range already planned.

### Net next steps (all next-session work, none urgent)
1. Anchoring rationale firmed. The Student reference-price fork is RESOLVED (see
   RESOLVED section): dial stays Teaching/Deep, mechanism made teachable in the
   Student read via a gated note + glossary term. Minimal-default is now standing.
2. Default/auto-renew lever: DONE (commit 5489aa3). Added as a new Retention enum
   value sized on default-specific evidence (robust-but-modest, endorsement-
   conditioned); lock-in split into contract vs switching cost; run-link additive.
   Input-layer only, no ENGINE_VERSION bump. Verified by smoke-retention.ts.
3. Pre-registered peak-end negative-peak test: DONE (sweep-peakend-negpeak.ts,
   2026-06-19). Verdict ADMISSIBLE-BUT-NOT-MATERIAL. The challenger amplifies only
   below-neutral craters: effPeak = 100 + kappa*dev for dev<0, spikes untouched;
   kappa=1 nests 2.2.0 byte-for-byte. G4 strengthens monotonically (margin 3.2 ->
   4.13), but the G2 average-dominance band caps kappa at 1.31 (breaks at 1.32, dev
   12.04 > 12). At that ceiling the G4-margin gain is only 0.93 reputation point,
   under the 1.0-pt materiality bar set BEFORE running. The band, not the evidence,
   sets the ceiling; the symmetric 2.2.0 peak already carries negative peaks
   (tie-broken toward the crater). 2.2.0 stays champion, NO version bump. The sweep is
   pre-registered and reproducible if the materiality bar is ever revisited.
None overturns a shipped result; the engine (2.2.0) is unchanged by this pass.
