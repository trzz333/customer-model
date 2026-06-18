---
name: ai-handoff
description: End-of-session handoff for the Customer Model project — the business-school customer stress-test web app (customer-model.council.fyi). Trigger on "/ai-handoff", "/handoff", "handoff", "wrap up", "push and handoff", "session done", or proactively when context is heavy (30+ tool calls, the engine or UI changed, deploy state moved, a decision resolved, or scope-changing research verified). Updates docs/handoff.md IN PLACE in a terse fixed schema, evicts resolved detail to docs/history.md, commits and pushes with a SCOPED git add (never -A), and outputs ONE Claude bootstrap block plus a plain-language "FOR JEFF — DO THIS NEXT" block of his real-world steps (deploy, keys, DNS). Single voice — never emit GPT/Grok blocks. Always carries the save-button invariant — any results surface must ship a Save/Print of the live #result-printable region, and the verdict with its warnings can never be dropped from the saved copy. Trigger proactively; do not wait to be asked.
---

# AI Handoff — Customer Model

End-of-session continuity for the Customer Model project. The goal: a fresh
session reads ONE doc and knows exactly where things stand and what to do next,
without re-deriving decisions or re-reading the whole conversation.

## What this project is (one paragraph, keep it current)

A web app for a business-school AI course: an "AI customer template" that
stress-tests a business model. The differentiated core is a **deterministic,
seeded, game-theory + behavioral-economics simulation** (Axelrod-style customer
archetypes reacting to a business's policy moves over repeated rounds, distorted
by prospect theory / loss aversion / present bias). This is the thing frontier
synthetic-customer tools do NOT do — they run LLM personas as survey
respondents; we run a transparent, reproducible, auditable model. An optional
single-model LLM layer voices what an archetype "says," grounded in the actual
simulated numbers. No multi-agent deliberation: verified research shows it adds
redundancy, not accuracy, among correlated models. The deterministic engine
itself is the independent verification channel against AI hand-waving.

## The schema (overwrite docs/handoff.md with exactly these sections)

Keep it terse. This doc is state, not narrative. Prose, not bullet salad.

1. **PROJECT** — one line: what it is + the live URL target.
2. **PHASE** — where we are (e.g. "engine built, UI partial, not yet deployed").
3. **LAST COMMIT** — short hash + subject (after this session's push).
4. **CURRENT STATE** — 3–6 sentences of prose: what exists and works right now.
5. **NEXT MOVE** — the single most important next action, stated concretely.
6. **DEPLOY STATE** — repo created? Vercel project? subdomain attached? env vars set? Each yes/no with the blocker if no.
7. **DECISIONS LOCKED** — short list of settled calls a fresh session must not relitigate (e.g. "standalone, not in council repo"; "deterministic core, single-model voice layer"; "no multi-agent committee").
8. **OPEN QUESTIONS** — genuine forks still needing Jeff's input.
9. **NOTES** — up to 5, anything load-bearing that doesn't fit above.

Everything that is now RESOLVED moves OUT of handoff.md and into
docs/history.md (append, dated). Handoff.md stays small.

**Reserved permanent NOTE:** one NOTES slot is the save-button invariant (see
below). It is restated in every handoff and is NEVER evicted to history, even
after the button ships — a shipped button can regress, so the rule outlives it.

## Save-button invariant (do not violate; never drop from a handoff)

Any results or output surface in this app MUST ship a save control per the
save-button skill. The rule that matters: the saved copy contains exactly what
the user saw — no always-visible warning, caveat, or weakness may be dropped on
the way to paper.

- Default to **Print of the live region**: wrap the result-only DOM as
  `#result-printable`, add a "Save / Print" button beside the run/copy actions
  that calls `window.print()`, and keep the `@media print` isolation block in
  globals.css. Printing the live render makes omission impossible by
  construction; never build a separate "clean" export that could drop honesty.
- The **verdict is a must-show section** and MUST appear in the saved copy,
  with its warnings: bleed-out, tipping point, segment loss, reputation rot,
  exploitation cost. A revenue number without the verdict is the exact failure
  this rule exists to prevent.
- The Save/Print and Copy controls live OUTSIDE `#result-printable` (or carry
  `.no-print`) so the chrome doesn't print, but the result does.
- On any handoff, confirm this still holds in `src/app/page.tsx` +
  globals.css. If it regressed, say so in NEXT MOVE; do not paper over it.

## Secrets discipline (do not violate)

- API keys live in env only: `.env.local` (gitignored) locally, Vercel project
  env in prod. Never in code, never in chat, never in a committed file.
- Confirm `.gitignore` covers `.env*`, `.next`, `node_modules`, `.vercel`
  BEFORE any commit. If a key value ever appears in a tracked file, stop and
  flag it; do not push.
- Entering the actual key values into Vercel is Jeff's step, not Claude's.

## Procedure

1. Read the current docs/handoff.md (if it exists) so you edit in place rather
   than regenerate. Read docs/history.md only if you need prior context.
2. Rewrite docs/handoff.md using the schema above. Move resolved detail to
   docs/history.md (append with a date heading).
3. Stage with a SCOPED git add — name the paths you changed. Never `git add -A`
   (the working tree may hold scratch files or, worse, an env file).
4. Verify no secret is staged: inspect `git status` and the diff for anything
   resembling a key before committing.
5. Commit with a terse subject line. Push to the project remote if one exists;
   if no remote yet, say so in DEPLOY STATE and skip the push.
6. Output the bootstrap block (below). Then the FOR JEFF block.

## Bootstrap block (output exactly one, fenced, copy-pasteable)

Produce a single fenced code block a fresh Claude session can paste to orient.
It should contain: the one-paragraph project description (above, kept current),
the DECISIONS LOCKED list, the NEXT MOVE, and the path to docs/handoff.md.
Do NOT produce a second block for any other model. One voice.

## FOR JEFF — DO THIS NEXT (always end with this)

A short, plain-language block with no jargon, listing ONLY the real-world steps
that are Jeff's to take before or during the next session: e.g. "paste your
Anthropic key into the Vercel project's environment settings," "confirm the
council.fyi DNS record so the subdomain resolves," "click Deploy." Skip
anything Claude will handle itself. If there are no Jeff-only steps, say so.

## Triggering

Fire on the explicit phrases in the description, and proactively when context is
heavy or a phase just closed. Better to hand off a little early than to lose
state. Do not ask permission to run a proactive handoff; just run it and say so.
