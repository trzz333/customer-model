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
