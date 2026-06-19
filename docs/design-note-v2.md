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
Status: named-only, no engine math. Touches nothing in sim.ts; it is a labeling
and routing layer over the existing `friction` scalar and `promo` flag.

The four named mechanisms and their honest mapping:
- Switching cost: real money or effort to leave (data export, re-setup,
  cancellation fee). Resolves to higher `friction`. The honest case where friction
  genuinely IS the mechanism.
- Contractual lock-in: a term commitment (annual contract, early-termination fee).
  Also resolves to `friction`, but named separately because the student lever is
  legal/structural rather than experiential, and it lands on the grudger archetype
  differently (resented, not unnoticed).
- Habit / inertia: staying because leaving requires a decision the customer never
  gets around to making. Resolves to `friction` numerically, but it is explicitly
  NOT a cost, and the prose must say so, because calling inertia a "cost" is the
  exact conflation the parking-lot note warns against.
- Default / auto-renew: retention by making continuation the no-action path. This
  is the one that is NOT friction. It works via inertia plus implicit endorsement
  (Thaler/Sunstein), hits the inertial archetype, and unlike a switching cost
  breeds no grudger backlash. It resolves to a modest `promo`-adjacent nudge and
  carries the contested-evidence flag below.

Honesty in the UI: the layer states which knob each label resolves to and that the
engine does not distinguish the four mechanically in this version (they move the
same one or two knobs). Default/auto-renew additionally carries the nudge caveat:
meta-estimates are contested (Mertens 2022 d about 0.43 vs Maier 2022 PNAS, a null
after publication-bias correction with only finance-domain nudges surviving), so
the lever is sized small and labeled as contested.

Shape (mirrors TERM_DEFS, single source): a `RETENTION_MECHANISMS` table in
business.ts, each entry roughly { id, label, plain, resolvesTo:
'friction' | 'promo' | 'none', inEngine: false, caveat? }. page.tsx and /glossary
both read it. No new runtime dep, no engine touch. Save-invariant unaffected: it is
prose that prints with the rest of the result.

## 2. ANCHORING / REFERENCE PRICE (versioned engine mechanism, LEAD challenger)
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

Verifying sweep (pre-registered): build three round series with identical means but
different shapes (rising, falling, a sharp late dip). At default weights, the
falling and late-dip series must end with lower reputation than the rising one, and
that gap must shrink toward zero as w_avg approaches 1 (proving the average term
dominates and the corrections are modest). FAIL CONDITION: if any single non-average
weight flips a verdict on a flat series, it is oversized. Default weights are set BY
the sweep, not by eye (engine-evolution policy: no eyeballing one scenario).

## SEQUENCING
Ship order: (1) retention vocabulary, since it is prose-only, key-free, touches no
engine, and directly answers the under-theorized-retention critique; (2) anchoring
reference-price as the first ENGINE_VERSION challenger, gated on its sweep;
(3) peak-end memory as the second challenger. Decoy tier and the held mechanisms
(network effects, reciprocity, brand) are later-version candidates. Each engine
challenger is a version bump, old version archived, rollback via git.

## OPEN (genuinely Jeff's taste, not mine to settle)
- Whether the named retention mechanisms surface in the Student tier or only in
  Teaching / Deep dive (a cognitive-load call).
- Whether anchoring reference-price is a faculty-only cfg knob or also a
  student-visible lever (a teachable but exploitable move).
