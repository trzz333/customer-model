# Customer Model — Running Plan

The roadmap and the parking lot. `handoff.md` is the terse current-state doc;
this is where direction, deferred ideas, and the "why" live so they aren't lost
between sessions. Decisions locked in `handoff.md` are not relitigated here.

## NORTH STAR
A deterministic, reproducible, auditable customer stress-test for business
school. The engine is the differentiated core. It is kept disciplined (not
churned casually), but it is NOT permanently sealed: it was unfrozen this session
to make λ load-bearing, with a real rationale and numerical verification. New
work is usually a cfg manipulation or a result read on top of it, or plain-
language framing around it; engine edits happen when the math demands it and are
verified by a sweep, not by eye. Honesty about what the model does and does not
capture is itself the pedagogy: it is the check on AI hand-waving, so it cannot
hand-wave about itself.

## NOW (v1 close-out)
- [ ] Two-business A/B side-by-side compare, worst-case inversion finder folded
      in (hold the world fixed, sweep the small lever space — same primitive as
      referenceBand). UI + extra cfg on the current engine. This is the next build.
- [ ] Shareable seeded run-link: encode inputs + seed in the URL for assignments
      and grading. Pairs with A/B.
- [ ] Glossary + per-round CSV export (cheap, faculty-requested).

## DONE (recent, newest first)
- ENGINE UNFROZEN and reworked to make λ load-bearing. Replaced the hard
  fairness deadband (which discarded λ's magnitude past a threshold) with a
  reference-dependent value function (TK 1992, diminishing sensitivity α=0.88,
  losses ×λ) feeding a logit defect probability — the Hardie-Johnson-Fader
  (1993) reference-dependent choice model. Verified by a λ sweep: on builds with
  headroom, λ 1.0→3.5 swings the headline 15–24 points, monotonic; only the
  maximal-catastrophe build floors (correctly). λ default 2.25, still held
  constant across worlds. Engine treated as re-frozen on this new core.
- Finance layer shipped: opt-in collapsed input (launch price, margin, CAC,
  per-round discount) in the rail; collapsed per-world dollar read (revenue,
  contribution, NPV, LTV:CAC, payback) at the foot of results, class `numbers`
  so Save/Print force-opens it. Reads engine `rounds[].revenue`.
- Honesty pass after the faculty/embedded audits (see DECISIONS below).

## V2 PARKING LOT (musings preserved, not commitments)

1. Retention is under-theorized — the richest deferred idea.
   "What keeps customers from leaving?" collapses to one `friction` scalar plus
   a promo flag. Real retention drivers are not one axis: switching cost, habit,
   contractual lock-in, reciprocity, brand, network effects, and choice-
   architecture nudges (Thaler/Sunstein libertarian paternalism — defaults,
   priming, cognitive-ease cues, reciprocity triggers in the store/app) each
   behave differently and some are not "more friction" at all. A nudge is not a
   higher switching cost and must not be modeled as one. Business schools mostly
   don't teach choice architecture in the strategy core yet; a tool that took it
   seriously would be a genuine differentiator for a bold instructor.
   Where it could live WITHOUT breaking the frozen engine:
   - a richer retention *vocabulary* that still resolves to the existing
     friction/promo knobs but names the mechanism honestly in the prose; or
   - the deferred single-model narration layer, which could discuss nudges as
     interpretation grounded in the numbers without pretending the engine
     simulates them.
   Do NOT shoehorn nudges into `friction`. If they ever become mechanical, that
   is an explicit engine-version decision, not a v1 lever rename.

2. Retention vs. net acquisition are conflated in one number.
   The headline ("end with ~X per 100 started") is NET: survivors + word-of-mouth
   acquisition, which is why it can exceed 100. True original-cohort retention
   is not recoverable from the current result because `spawn()` adds acquired
   agents into the same `perArch` tallies. Splitting them cleanly needs an engine
   seam (tag cohort origin, or expose a retention-only series). Frozen engine, so
   this is a v2 engine-version call. For now the prose is honest about being net.

3. Narration fidelity. Per-world write-ups are templated and can mismatch a
   segment's character or fail to explain a genuine inversion (e.g. loyal
   regulars retaining worse than fickle bargain-hunters under a stress build —
   the inertial "leave all at once when it overflows" cascade). v2: either a
   tighter rules pass or the single-model narration layer reading the actual
   per-segment series. Keep it grounded in numbers; never a committee.

4. λ legibility — RESOLVED this session. λ is now load-bearing via the
   reference-dependent logit (HJF 1993); moving it visibly moves the verdicts on
   any build with headroom. Held constant across worlds as the shared science.
   The earlier "λ is decorative" critique is answered. Remaining nuance: extreme
   catastrophe builds saturate at the floor where nothing moves them, which is
   correct, not a defect.

5. Finance depth. NPV currently discounts per *round*; rounds have no calendar.
   v2: let the instructor map rounds→months/years so the discount rate is a real
   annual rate, and surface that the engine's per-round revenue already nets the
   defect/exploit discounts (0.35x / 0.5x) so the dollar figures inherit them.

6. Methodology appendix. A fuller written appendix documenting the actual
   functional forms (the loss-aversion kink, the present-bias lure decay, the
   friction gate) so a skeptical colleague can audit the mechanics, not just the
   citations. Faculty-requested.

## DECISIONS / CHANGELOG

- Honesty pass (this session), triggered by a faculty audit run through a
  fresh embedded-Claude reviewer plus an internal review. Taken:
  - Headline relabeled "keep ~X of 100" → "end with ~X per 100 started"
    everywhere (cards, band, short-version, finance). Fixes the >100% incoherence
    and discloses that counts are rescaled from a larger population.
  - λ in the teaching prompt now reads live from the slider (was hardcoded to
    "twice as heavy" regardless of the control). Truth-in-labeling.
  - Methodology softened: Axelrod names are a reaction vocabulary, not an iterated
    game; loss aversion (not "full prospect theory") is the one behavioral
    mechanism; present bias named; per-100 rescaling and the noise knob explained;
    stated plainly that the categorical moves, not λ, do most of the work.
  - Competitor-pull prose no longer calls every non-impulsive world "steadier"
    (was wrong for grudge/skeptic crowds).
  Rejected from the audit, on purpose:
  - "Make λ load-bearing so it swings results." That means editing the frozen
    engine and contradicts the design (λ is the shared constant; moves dominate
    by design). Took the diagnosis (prose oversells λ), rejected the prescription.
  - "There is no Finance block." Stale: the reviewer tested live prod, which was
    pre-finance because the build had not been deployed. Not a defect.
