# Customer Model — Handoff

State doc. Terse by design. Resolved detail lives in docs/history.md. Roadmap,
v2 parking lot, the LLM-voice recommendation, and the decision log live in
docs/plan.md.

## PROJECT
A business-school AI tool: a deterministic, game-theory + behavioral-economics
simulation that stress-tests a business model against synthetic customer
archetypes. Live at https://customer-model.council.fyi.

## PHASE
v1 feature-complete on the frozen engine and verified live in the browser. This
session did the faculty-review triage and the accessibility restructure (three
depth tiers). One prose defect remains (see NEXT MOVE) and gates "v1 closed"
alongside the still-deferred LLM-voice decision.

## LAST COMMIT
e5e4b8d — accessibility: three depth tiers (Student / Teaching / Deep dive),
retire "Instructor". (Preceded by df99260, the faculty-review triage.) A docs
commit for this handoff follows. typecheck clean, build green (/ 23.7 kB).

## CURRENT STATE
Define one business in plain terms, run it across named customer worlds; engine
2.0.0 (untouched) is a seeded agent-based Monte Carlo, lambda default 2.25,
headline is a band. All v1 surfaces are live: per-world cards (verdict +
warnings), the cross-world A/B compare + inversion finder, the within-world
fragility sweep, the seeded run-link, /glossary, and the per-round CSV. Two
things shipped this session. (1) Faculty-review triage: finance is now BANDED
across the seed set (financeBand in business.ts; "~" median + luck range,
killing the lone-decimal false precision), the grudger "lever to pull first"
advice was dropped from the plain causal sentence, and the glossary LTV:CAC def
now hedges "common rule-of-thumb". (2) Accessibility restructure: the two-view
model became three DEPTH tiers — Student (clean read), Teaching (plain + full
teaching controls, finance first-class, NO lambda/citations; the non-specialist
professor's home and the fresh-visit default), Deep dive (Teaching +
lambda/advanced + cited methodology, the behavioral-econ veteran's mode).
Finance is now an emphasis TOGGLE; a shared run-link opens in Student. Grounded
in NN/g progressive disclosure, Capsim tier-by-complexity, and Carroll-Rosson
training wheels. All three tiers were browser-verified on prod this session.

## NEXT MOVE
Resolve the engine-verdict over-narration. The browser pass caught that
verdict() in sim.ts still emits "...— tells you which lever to pull first" in
the "Engine verdict:" line of every card. It is the SAME over-narration the
triage removed from the plain causal sentence, but at a second site I missed.
It is PROSE ONLY (no math, no determinism change), but it lives in the FROZEN
sim.ts, so it needs Jeff's explicit ok to touch the frozen file (cleanest: edit
the one string) OR a non-sim.ts workaround (post-process verdict() output in
page.tsx — hacky, not recommended). Decide, then it closes the triage. After
that, the NEXT-STEP FORK in plan.md (v2 vs. email Professor Bonner a link +
brief description + v2 plans — do NOT draft the email until Jeff says go).

## DEPLOY STATE
- Local repo: YES, main, scoped commits.
- GitHub: YES, trzz333/customer-model (private), pushed this session (e5e4b8d).
- Vercel: live at customer-model.council.fyi; auto-deployed e5e4b8d,
  browser-verified this session (all three tiers render correctly on prod).
- Env vars: NO. v1 is key-free. @anthropic-ai/sdk present but unused (post-v1
  voice). lz-string@1.5.0 is the one runtime dep.

## DECISIONS LOCKED
Standalone repo, not council. Deterministic, reproducible, auditable core, not an
LLM-respondent. Templates are CUSTOMER WORLDS applied to a user business. lambda
default 2.25, held constant across worlds. Engine evolves by versioned release;
ENGINE_VERSION stamps every result. NO machine learning. ALWAYS PUSH.
- UI tiers (NEW this session): three DEPTH tiers — Student / Teaching / Deep dive
  — replace the old Class / Instructor pair. "Instructor" is retired as a label.
  Tier by depth, not by role (no per-discipline modes). Finance is an emphasis
  TOGGLE available in Teaching + Deep, not its own segment. Context-aware default:
  fresh visit opens in Teaching, a shared run-link opens in Student. The run-link
  does NOT encode view/emphasis, so old links still decode.
- Optional LLM voice: single-model, after v1, never a committee. Recommendation
  recorded in plan.md — NARRATION first (role-tailored, CACHED to the run-link so
  a graded artifact stays stable, labeled as the one non-reproducible layer);
  autofill second and only if parsed levers are shown + editable. Still deferred.
- Run-link carries DIFFICULTY not a raw seed; lz-string is the codec. A/B
  inversion finder is CROSS-WORLD; fragility sweep is WITHIN-WORLD single-lever;
  both shipped. CSV is a raw dump and carries no verdict text — correct, not a gap.

## OPEN QUESTIONS
1. The frozen-engine prose fix (NEXT MOVE): edit the one string in sim.ts
   verdict() (touches the frozen file, but prose-only) vs. a page.tsx workaround.
   Needs Jeff's call on the freeze.
2. NEXT-STEP FORK (plan.md): start v2 (retention vocabulary is the richest item)
   OR send Professor Bonner the link + brief description + v2 plans. Not started.
3. LLM voice: still "after v1" — whether it ships at all, narration vs autofill.
4. Minor copy (Jeff's eye): the "Student" tier label and the "Class prompt"
   export checkbox label (refers to the "Use this in class" prompt, not a mode).

## NOTES
1. SAVE BUTTON (permanent invariant, never evicted): Save/Print + Copy read
   #result-printable; verdict + warning chips carry NO export class and NO toggle,
   so they survive every saved copy by construction; details.numbers force-opened
   into both saved paths; selective export hides optional sections only. CONFIRMED
   HOLDING this session: the three-tier restructure left the invariant untouched —
   verdict/warnings stay unconditional, and a Student-view save (no export
   controls shown) uses the full default export set. Never build a clean export
   that can drop the verdict.
2. ALWAYS PUSH (standing): push every code-changing session. Pushes this session:
   df99260 (triage), e5e4b8d (modes), plus this docs commit.
3. BUILD QUIRK (load-bearing): a bare `npm install <pkg>` PRUNES devDependencies
   (typescript included) and breaks the build. Restore with
   `npm install --include=dev`. Validate sequence: cmd shell, npm run typecheck
   (NOT `npx tsc` — npx misresolves to a bogus tsc@2.0.4), npm run build,
   git add <scoped>, commit -F, push. typescript pinned 5.8.2.
4. TERM DEFS SINGLE SOURCE: plain-language defs live ONCE as TERM_DEFS in
   business.ts; page.tsx aliases it and /glossary derives from it. Edit once.
5. BROWSER-VERIFIED DEPLOY: this session confirmed prod renders all three tiers
   correctly via Claude-in-Chrome (Teaching default + plain "How to read this";
   Deep dive shows lambda header + Advanced block + cited Methodology). That pass
   is what caught the verdict() prose miss in NEXT MOVE.
