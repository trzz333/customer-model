# Customer Model — Handoff

State doc. Terse by design. Resolved detail lives in docs/history.md. Roadmap,
v2 parking lot, the LLM-voice recommendation, and the decision log live in
docs/plan.md.

## PROJECT
A business-school AI tool: a deterministic, game-theory + behavioral-economics
simulation that stress-tests a business model against synthetic customer
archetypes. Live at https://customer-model.council.fyi.

## PHASE
v1 CLOSED and hardened; v2 PLANNING done, build not yet started. External-audit
triage (Antigravity coverage docs + a fresh professor-persona tester) is done: the
real coverage/wiring gaps are fixed and the tester artifacts rejected with reasons.
This session was research + spec only, no code: the marketing-psych research is
persisted into plan.md and the first three v2 mechanisms are specced with verifying
sweeps in docs/design-note-v2.md. Engine frozen, v1 untouched. Next session builds
mechanism #1 (retention vocabulary).

## LAST COMMIT
Docs-only this session (v2 research persisted to plan.md + design-note-v2.md
added; handoff updated). Last CODE commit is still 0ebaef3 — fix: honest narrative
on a price cut + reputation/copy wiring; typecheck clean, build green, / at
24.4 kB. v1 engine untouched since. Re-confirm HEAD with git rev-parse; don't trust
a hardcoded hash.

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
Build v2 mechanism #1 per docs/design-note-v2.md: the RETENTION VOCABULARY as a
small typed layer (`RETENTION_MECHANISMS` in business.ts, mirroring TERM_DEFS),
naming four mechanisms (switching cost, contractual lock-in, habit/inertia,
default/auto-renew) that resolve to the existing friction/promo knobs and say so
in the prose. Prose-only, key-free, NO engine touch; page.tsx + /glossary read the
table. Then the two engine challengers in order: anchoring reference-price, then
peak-end memory, each a versioned ENGINE_VERSION bump gated on the pre-registered
sweep written into the design note. Do NOT shoehorn nudges into friction; the
default/auto-renew label is promo-adjacent and carries the contested-nudge caveat.
Research + verdicts live in plan.md; the build spec + sweeps live in
design-note-v2.md.

## DEPLOY STATE
- Local repo: YES, main, scoped commits.
- GitHub: trzz333/customer-model — now PUBLIC (flipped this session so Professor
  Bonner can read it without an account; docs/ are world-visible now). Pushed
  0ebaef3 + this docs commit.
- Vercel: live at customer-model.council.fyi; auto-deploying 0ebaef3.
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
