# Customer Model — Evolution layer (2.3.0 challenger) pre-registration

Status: PROMOTED to ENGINE_VERSION 2.3.0 (2026-06-30). Was a CHALLENGER; sweep-evolution.ts
passed all four pre-registered gates (G1-G4) at champion 2.2.0 and again after the bump, so
the layer was promoted per the plan below. The champion perception core is byte-identical
(default revenue 1762833 unchanged); 2.3.0 only ADDS the Deep-only, off-by-default layer.
This pre-registration is kept as the written record the sweep was gated against.

## Why this exists
The 2.2.0 engine runs one market episode with a FIXED archetype mix. Agents only
leave (churn) or arrive (acquisition at the same fixed weights). So the question
"under a sustained policy, which customer types get selected FOR and which get
crowded OUT, and what does the base settle into" is structurally unmodeled. That is
the evolutionary-game-theory question, and it was the one remaining champion
challenger candidate on the shelf. Jeff reopened the deterministic-core decision
deliberately (2026-06-30) to build it, with one hard constraint: stochastic in
mechanism must still mean reproducible in output. Every published run regenerates
bit for bit from its seed, or the tool stops being the check on hand-waving.

## Prior art (verified 2026-06-30; this is not novel)
Evolutionary dynamics on Axelrod-style strategies is foundational, not fringe.
- Axelrod's own 1984 program used an ecological model: strategy shares evolve by the
  tournament payoff matrix. The Axelrod-Python library ships this today (Moran
  process plus ecological model). The tool's own lineage already did this.
- Fudenberg and Imhof (2006, J. Theoretical Population Biology): the strong-selection
  weak-mutation limit collapses a stochastic Moran-with-mutation process to an
  embedded Markov chain over the monomorphic states, whose stationary distribution is
  closed form from pairwise fixation probabilities. The long-run answer needs no
  fragile stochastic loop.
- Hindersin et al. (2019, Scientific Reports): compared standard methods for fixation
  probabilities, fixation times, and stationary distributions of the Moran process.
- Traulsen, Pacheco and Nowak (2007, J. Theoretical Biology): pairwise-comparison
  (Fermi) update with a selection temperature beta, gauging continuously from neutral
  drift to deterministic imitation. Adopted as the stochastic update and its one knob.
- Common Random Numbers with per-entity identity-keyed substreams (L'Ecuyer
  RngStream; Starsim/Covasim 2024, arXiv 2409.02086): removes the noise from
  misaligned draws so a difference between runs comes from mechanism, not draw order.
  Adopted as the reproducibility spine and the direct fix for order-dependence.
- Staged, not built this turn: Quantal Response Equilibrium (McKelvey and Palfrey
  1995) and its risk-averse extension (Mazumdar 2025) are the stochastic-choice lever
  and fit the existing prospect-theory core. Kept out of this unit to keep it small.

## What is built (challenger)
A generation loop wrapping the FROZEN runSimulation without modifying sim.ts. The one
place the real engine enters is a measured payoff matrix M: M[i][j] is the retention
of a type-i customer sitting at a small probe frequency in an otherwise type-j base,
read from the 2.2.0 engine at a fixed seed, so M is a pure function of the base
config. M[i][i] is all-i retention. Everything after M is standard EGT arithmetic.
Frequency-dependent fitness of type i at composition x is the mean-field sum over j of
M[i][j] x[j].

Two update rules:
1. replicator (deterministic): share'[k] proportional to share[k] times fitness[k].
   Axelrod's ecological model. No RNG.
2. moran (stochastic, Fermi pairwise comparison, selection intensity beta, mutation
   mu): a finite population of N archetype-slots; each step a learner slot copies a
   role-model slot with the Fermi probability of their fitness gap, or mutates.
   Finite-N drift plus selection plus mutation is the full Moran-adjacent process.

Non-deterministic factors, all seeded: mutation mu, selection temperature beta,
finite-N drift. Every draw is keyed by a substream hash of (runSeed, rep, step,
channel), never by global draw order.

Fragility and order-dependence controls:
- CRN substreams: subRng(runSeed, ...tags) hashes the tags to an independent
  mulberry32 stream, so reordering replicate or step processing cannot change any
  outcome. This is gate G3.
- Ensemble: one stochastic trajectory is a sample, so runEvolution runs K seeded
  replicates and reports the mean settled share, a per-archetype band, and the
  plurality (fixation) distribution. The reported artifact is the distribution,
  pinned to runSeed, fully regenerable.
- Analytic anchor (no sim): the small-mutation stationary distribution over
  monomorphic states from the closed-form Fermi fixation probability. The long-run
  answer without a loop, and the theory the code is checked against.

The linearization to a 2-type probe for M is the stated modelling reduction: the full
engine has multi-type and reputation-channel nonlinearity that M collapses. This is a
teaching reduction, labeled as such wherever the layer is surfaced, not a claim that
the engine is a 2x2 game.

Save invariant: the settled-composition verdict and any fragility warning (for
example, a base concentrating into Inertial Loyalists, who leave in one wave) are
computed over the ensemble and carried in the result object, so they cannot be
dropped from a saved copy once the layer is surfaced.

## Pre-registered gates (sweep-evolution.ts)
Hard correctness gates, all must pass before the challenger is sound:
- G1 champion untouched: the evolution module never imports into the champion path
  and never mutates sim.ts, so runSimulation is byte-identical. Recorded and checked.
- G2 regeneration: runEvolution twice with the same runSeed returns deep-equal
  ensembles, and a different seed actually moves the output.
- G3 order-independence: computing replicate r's outcome does not depend on when it
  is computed; forward and reversed iteration aggregate identically.
- G4 fixation formula: a Monte Carlo estimate of the pairwise fixation probability
  (many absorbing 2-type chains) matches the closed-form fixation used by the
  analytic anchor, within Monte Carlo tolerance. This validates the load-bearing
  formula directly rather than through the slower multi-type mixing time.

Diagnostic (informational, not a hard gate): the multi-type ensemble occupancy versus
the analytic stationary distribution, reported for the record; mixing time makes a
tight numeric match seed-count-sensitive, so it informs interpretation rather than
blocking.

## Promotion (NOT this turn)
Only after G1 through G4 are green and a taste review of the surface: bump
ENGINE_VERSION to 2.3.0; extend runLinkReproducesExactly so the 2.2.0 to 2.3.0 pair
reproduces when the layer is off (mirroring the 2.0.0 to 2.1.0 anchor-off precedent);
add evolution fields to the run-link schema, emitted only when the layer is on so
existing tokens stay byte-identical; surface in the Deep tier only, labeled a
stochastic-but-seeded layer that regenerates exactly from its token (unlike the
planned LLM layer, which is the one non-reproducible layer). Student and Teaching are
unchanged.

## Rollback
git rm src/lib/evolution.ts and this note. The champion path never imported the
module, so rollback is total and leaves 2.2.0 pristine.
