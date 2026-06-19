# Customer Model — Handoff

State doc. Terse by design. Resolved detail lives in docs/history.md. Roadmap,
v2 parking lot, the LLM-voice recommendation, and the decision log live in
docs/plan.md.

## PROJECT
A business-school AI tool: a deterministic, game-theory + behavioral-economics
simulation that stress-tests a business model against synthetic customer
archetypes. Live at https://customer-model.council.fyi.

## PHASE
v1 CLOSED and hardened; v2 BUILD started. Mechanism #1 (retention vocabulary)
shipped this session: a single-source RETENTION_MECHANISMS table over the existing
Retention enum, prose/data only, engine untouched. The marketing-psych research is
in plan.md and the three v2 mechanisms are specced with verifying sweeps in
docs/design-note-v2.md (its §1 now records the prior-art reconciliation).

## LAST COMMIT
This session: a v2 docs commit (research → plan.md, design-note-v2.md added) then a
CODE commit shipping mechanism #1, the retention vocabulary: a single-source
RETENTION_MECHANISMS table in business.ts keyed to the existing Retention enum,
owning the retention WORDS (label, note, mechanism name, phrase, glossary def) while
the friction/promo NUMBERS stay in businessToCfg. FIELDS, RET_DESC, and GLOSSARY all
derive from it. typecheck clean, build green, / at 24.9 kB. Engine (sim.ts)
untouched. Re-confirm HEAD with git rev-parse; don't trust a hardcoded hash.

## CURRENT STATE
Define one business in plain terms, run it across named customer worlds; engine
2.0.0 (untouched math) is a seeded agent-based Monte Carlo, lambda default 2.25,
headline is a band. All v1 surfaces live: per-world cards (verdict + warnings),
cross-world A/B compare + inversion finder, within-world fragility sweep, seeded
run-link, /glossary, per-round CSV, three depth tiers (Student / Teaching / Deep
dive) with a Finance-focus toggle. The last code session (0ebaef3) was triage +
hardening only, no engine change: fixed the per-world causal sentence that printed
"Steady price" on a price cut (now reads the actual move), wired the reputation
definition at
its two bare Teaching sites (warning chip, "Lowest rep." label), corrected the
"on hover" subhead to click/tap, gave the Term popover outside-click/scroll/Esc
dismissal, and spelled out CAC in the LTV:CAC def. Save invariant confirmed
holding (Term popover is no-print; chip + label text still print).

## NEXT MOVE
Mechanism #1 (retention vocabulary) is shipped. Next, per docs/design-note-v2.md §2,
is ANCHORING reference-price as the FIRST ENGINE_VERSION challenger: let a business
action shift the value-function reference point WITHOUT moving real price (a "was $X"
reference), decaying back over a few rounds, with the pre-registered sweep in the
note (monotonic shift on a headroom build, decays back, floors on a maximal-stress
build; FAIL if a one-time reference makes a permanent non-decaying lift). This DOES
touch sim.ts, so it is a deliberate versioned bump: bump ENGINE_VERSION, archive the
old, run the sweep before promoting. The decoy/asymmetric-dominance branch stays
held (contested per Frederick/Lee/Baskin, Yang/Lynn). A smaller parallel option is
the deferred retention schema-bump (default/auto-renew as a new lever; splitting
lock-in into contract vs switching cost), also a versioned change (enum + cfg +
run-link schema v2). Engine still frozen until Jeff authorizes the sim.ts edit.

## DEPLOY STATE
- Local repo: YES, main, scoped commits.
- GitHub: trzz333/customer-model — PUBLIC (so Professor Bonner can read it without
  an account; docs/ are world-visible). Pushed this session's docs + code commits.
- Vercel: live at customer-model.council.fyi; auto-deploys latest main on push
  (the retention-vocabulary code commit is the current deploy).
- Env vars: NO. v1 is key-free. @anthropic-ai/sdk present but unused (post-v1
  voice). lz-string@1.5.0 is the one runtime dep.

## DECISIONS LOCKED
Standalone repo, not council. Deterministic, reproducible, auditable core, not an
LLM-respondent. Templates are CUSTOMER WORLDS applied to a user business. lambda
default 2.25, held constant across worlds. Engine evolves by versioned release;
ENGINE_VERSION stamps every result. NO machine learning. ALWAYS PUSH.
- v1 is CLOSED. Engine (sim.ts) changes go by versioned release, not in-place;
  prose/wiring fixes to business.ts + page.tsx are fine (this session was all
  that, sim.ts untouched).
- Three DEPTH tiers (Student / Teaching / Deep dive), not roles. Finance is a
  toggle in Teaching + Deep. Fresh visit opens Teaching; a run-link opens Student.
- Term defs are CLICK/TAP popovers (native title fallback), not CSS :hover. A
  "does nothing on hover" report is a tester artifact. (The subhead that wrongly
  said "on hover" was corrected to click/tap this session.)
- LLM voice: single-model, after v1, never a committee. Narration-first, cached
  to the run-link. Still deferred and unbuilt.

## OPEN QUESTIONS
1. NEXT-STEP FORK: RESOLVED. Jeff sent Bonner the live link + a repo-link
   follow-up this session and called v2 as the next move. v2 it is.
2. LLM voice: still "after v1" — whether it ships at all, narration vs autofill.
3. v2 scope within the retention-vocabulary item (how many named mechanisms,
   prose-only vs a small vocabulary layer) — Jeff's taste call.
4. Minor copy (Jeff's eye): the "Student" tier label and the "Class prompt"
   export checkbox label.

## NOTES
1. SAVE BUTTON (permanent invariant, never evicted): Save/Print + Copy read
   #result-printable; verdict + warning chips carry NO export class and NO
   toggle, so they survive every saved copy by construction; details.numbers
   force-opened into both saved paths. CONFIRMED HOLDING this session: the new
   reputation Term and popover-dismissal changes left it intact (only the Term
   popover carries no-print, so each chip/label still prints its full text).
2. REPO IS PUBLIC (new this session). docs/handoff, history, plan are
   world-visible; history.md carries some Vercel IDs + a gmail (Jeff accepted
   this knowingly). No keys anywhere in the repo; keep secrets in env only.
3. ALWAYS PUSH (standing). This session: 0ebaef3 (triage/hardening) + this docs
   commit.
4. BUILD QUIRK: a bare `npm install <pkg>` PRUNES devDependencies and breaks the
   build; restore with `npm install --include=dev`. Validate: cmd shell,
   `npm run typecheck` (NOT npx tsc), `npm run build`, scoped git add, commit
   via `git commit -F <file>` (PowerShell word-splits inline -m and mangles ;),
   push. typescript pinned 5.8.2.
5. TERM DEFS SINGLE SOURCE: plain defs live ONCE — TERM_DEFS + ARCH_DEF in
   business.ts; page.tsx aliases TERM_DEFS as DEF and imports ARCH_DEF;
   /glossary derives from GLOSSARY + ARCHETYPES. Edit once.
