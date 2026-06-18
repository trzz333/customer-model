# Customer Model — Handoff

State doc. Terse by design. Resolved detail lives in docs/history.md. Roadmap,
v2 parking lot, the LLM-voice recommendation, and the decision log live in
docs/plan.md.

## PROJECT
A business-school AI tool: a deterministic, game-theory + behavioral-economics
simulation that stress-tests a business model against synthetic customer
archetypes. Live at https://customer-model.council.fyi.

## PHASE
v1 CLOSED. The last triage item (engine-verdict over-narration) is resolved and
the build is clean. Post-v1 hardening underway: a definition-coverage pass
shipped from a faculty-review usability test. Now paused awaiting external-audit
outputs (Antigravity IDE + a fresh professor-persona tester on the new deploy)
before the next-step fork.

## LAST COMMIT
b41f69f — a11y: define the seven archetypes inline at point of use (headline,
warning chips, numbers table) with plain-language tap defs; add churn/tipping/
payback notation hovers; lead glossary archetype intro with plain behavior,
demote the Axelrod aside. (Preceded by 3c78e3f, the verdict() over-narration fix
that closed v1.) typecheck clean, build green, / at 24.1 kB.

## CURRENT STATE
Define one business in plain terms, run it across named customer worlds; engine
2.0.0 (untouched math) is a seeded agent-based Monte Carlo, lambda default 2.25,
headline is a band. All v1 surfaces live: per-world cards (verdict + warnings),
cross-world A/B compare + inversion finder, within-world fragility sweep, seeded
run-link, /glossary, per-round CSV, three depth tiers (Student / Teaching / Deep
dive) with a Finance-focus toggle. Two things shipped this session. (1) v1 close:
verdict() in the frozen sim.ts dropped its "lever to pull first" coda (prose-only
one-string edit, freeze otherwise intact). (2) Definition coverage: the seven
archetypes now define themselves on tap (ARCH_DEF in business.ts) at the three
sites they surface — the "first to leave" line, the red warning chips, and the
"Show the numbers" rows — plus churn/tipping labels wrapped and r0/r12 notation
folded into the tipping/payback defs, plus a plain-first glossary archetype
intro. The Term component is a click/tap popover (works on touch), not a hover.

## NEXT MOVE
Ingest the external-audit outputs Jeff is about to paste in: the Antigravity IDE
run (read-only on C:\Projects\customer-model + the live site; a persona browser
walkthrough plus a UI-vs-source definition-coverage cross-check) and/or a fresh
professor-persona tester on the new deploy. Triage real findings from tester
artifacts (e.g. another hover-vs-click false negative), then fix any genuine
coverage/wiring gap (a definition that exists in TERM_DEFS/ARCH_DEF but renders
bare at a Student/Teaching site). After that, the still-open fork in plan.md:
start v2 (retention vocabulary is the richest item) OR email Professor Bonner the
link + brief description + v2 plans (do NOT draft the email until Jeff says go).

## DEPLOY STATE
- Local repo: YES, main, scoped commits.
- GitHub: YES, trzz333/customer-model (private), pushed this session (3c78e3f,
  b41f69f, plus this docs commit).
- Vercel: live at customer-model.council.fyi; auto-deploying b41f69f. Allow a
  minute of propagation before trusting a browser test against prod.
- Env vars: NO. v1 is key-free. @anthropic-ai/sdk present but unused (post-v1
  voice). lz-string@1.5.0 is the one runtime dep.

## DECISIONS LOCKED
Standalone repo, not council. Deterministic, reproducible, auditable core, not an
LLM-respondent. Templates are CUSTOMER WORLDS applied to a user business. lambda
default 2.25, held constant across worlds. Engine evolves by versioned release;
ENGINE_VERSION stamps every result. NO machine learning. ALWAYS PUSH.
- v1 is CLOSED. The verdict() prose fix was a one-string exception to the sim.ts
  freeze: prose only, no math or determinism change. The freeze otherwise holds;
  future engine changes go by versioned release, not in-place edits.
- Three DEPTH tiers (Student / Teaching / Deep dive), not roles. Finance is an
  emphasis TOGGLE in Teaching + Deep. Fresh visit opens Teaching; a run-link
  opens Student. Run-link encodes difficulty, not view; old links still decode.
- Term defs are CLICK/TAP popovers (with a native title fallback), not CSS
  :hover. By design, so they work on touch. A "term does nothing on hover"
  report is a tester artifact, not a bug.
- External usability/coverage testing uses the Antigravity IDE (not the
  standalone 2.0 app): the task needs codebase reading + controlled browser +
  artifacts together. The persona (first-year entrepreneurship prof, PhD
  Marketing, no decision-science background) is the test instrument.
- Optional LLM voice: single-model, after v1, never a committee. Narration first
  (role-tailored, CACHED to the run-link), autofill second and only if parsed
  levers are shown + editable. Still deferred and unbuilt.

## OPEN QUESTIONS
1. NEXT-STEP FORK (plan.md): start v2 (retention vocabulary richest) OR send
   Professor Bonner the link + brief + v2 plans. Not started; awaiting Jeff.
2. Whatever the external audit surfaces: triage on arrival.
3. LLM voice: still "after v1" — whether it ships at all, narration vs autofill.
4. Minor copy (Jeff's eye): the "Student" tier label and the "Class prompt"
   export checkbox label.

## NOTES
1. SAVE BUTTON (permanent invariant, never evicted): Save/Print + Copy read
   #result-printable; verdict + warning chips carry NO export class and NO
   toggle, so they survive every saved copy by construction; details.numbers
   force-opened into both saved paths. CONFIRMED HOLDING this session: wrapping
   archetype names in Term left the invariant intact — only the Term popover
   carries no-print, so each warning chip still prints its full text. Never build
   a clean export that can drop the verdict.
2. ALWAYS PUSH (standing): push every code-changing session. This session:
   3c78e3f (v1 close), b41f69f (coverage), plus this docs commit.
3. BUILD QUIRK (load-bearing): a bare `npm install <pkg>` PRUNES devDependencies
   (typescript included) and breaks the build. Restore with
   `npm install --include=dev`. Validate sequence: cmd shell, npm run typecheck
   (NOT `npx tsc` — npx misresolves to a bogus tsc@2.0.4), npm run build,
   git add <scoped>, commit, push. typescript pinned 5.8.2.
4. TERM DEFS SINGLE SOURCE: plain defs live ONCE — TERM_DEFS + ARCH_DEF in
   business.ts; page.tsx aliases TERM_DEFS as DEF and imports ARCH_DEF;
   /glossary derives from GLOSSARY + ARCHETYPES. Edit once.
5. EXTERNAL-AUDIT PROMPTS (in chat, not committed): a professor-persona test, a
   hover->click re-run version, and the Antigravity IDE brief whose source
   cross-check catches "def exists but not wired" gaps. Reusable next round.
