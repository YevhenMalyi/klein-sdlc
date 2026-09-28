---
name: ai-onboarding
description: >-
  Tours how Claude Code is set up on this repo — skills, review lanes,
  subagents, the rules corpus — then guides a person step by step through
  shipping their first ticket, from the board to an open PR, invoking the real
  workflow rather than describing it. Use when someone says "onboard me to the
  AI setup", "how do we use Claude here", "what skills do we have", "walk me
  through my first ticket", "show me the workflow", or is new to the team and
  ready to work rather than set up their machine. Installing and running the
  apps is the host's own setup guide, not this skill.
---

# AI onboarding

Two halves. **The tour** — what is checked in, what each piece is for, and where
the reasoning lives. **The first ticket** — the person actually ships one, with
you alongside each step.

The second half is the point. The tour exists so the first ticket makes sense,
not the other way around, so keep it short and get to the work.

The project manifest — `tracker.*` and `forge.*` below name values in it:

!`cat .claude/sdlc.json`

## Hard rules

- **The person invokes `/klein-sdlc:whats-next` themselves.** Do not call it for them, and
  do not paraphrase a board you fetched another way. Learning to reach for the
  skill is part of what this pass teaches, and it is their board.
- **Delegate to the real skills at every step. Never reimplement one.** You
  invoke `implement-ticket`, `full-review`, `manual-qa-engineer` and
  `commit-and-pr`; they own their own steps. A copy of their procedure in this
  file is a copy that goes stale the moment one of them changes.
- **This ships for real.** A real tracker ticket moves to `tracker.states.inProgress`
  and gets assigned; a real PR opens against `forge.baseBranch`. Say that plainly at the start and
  get a yes before touching the board.
- **Never start the dev server.** Step 5 needs the apps running; ask the
  person to start them and wait.
- **Run only the five steps below.** Not an extra review lane, not a second QA
  sweep, not `/code-review` on top of `full-review`. The chain is the lesson;
  padding it teaches the wrong thing about what a normal change costs.
- **Stop at any step that goes wrong, and fix it there.** A newcomer following
  a broken chain learns that the chain is decorative. A failing gate at
  step 3 is a step-3 problem.

## Part 1 — The tour

Keep this to a few minutes. The depth is all linked, and nobody absorbs a rules
corpus by being read one.

**The organising idea, and the one thing worth saying out loud:** context is
expensive, so almost nothing is always-on. The host's `CLAUDE.md` and
[`.claude/rules/core.md`](.claude/rules/core.md) are always loaded and are
deliberately small — a routing table plus the invariants that fail *silently*.
Everything else is read on demand, per changed path, **before writing**. Nobody
here works from memory of the rules; that is the deviation from ordinary
practice that matters most.

What's checked in:

| Piece                                                           | What it is                                                                                            |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `CLAUDE.md` (host)                                               | The front door — overview, commands, git workflow, the gotchas                                        |
| [`.claude/rules/core.md`](.claude/rules/core.md)                   | Always loaded. The routing table, and the invariants that compile while being wrong                   |
| [`.claude/docs/rules/`](.claude/docs/rules/README.md)              | Normative: does this fit **our** architecture? Read per changed path                                  |
| [`.claude/docs/practices/`](.claude/docs/practices/README.md)      | Normative: is this how **the library** is meant to be used, at the versions pinned here                |
| `REVIEW.md` (plugin)                                             | The review contract — what gets flagged, at what strength, and the evidence bar                       |
| [`.claude/docs/review/`](.claude/docs/review/README.md)            | One catalogue per review lane: this repo's invariants, auth surface, greps and sanctioned forms       |
| `klein-sdlc` skills (plugin)                                        | The workflow skills, namespaced `/klein-sdlc:<name>`, including the five this pass uses                 |
| `klein-sdlc` agents (plugin)                                        | Eight subagents — six review lanes, plus `finding-verifier` and `manual-qa-engineer`                  |
| [`.claude/docs/rule-gaps.md`](.claude/docs/rule-gaps.md)           | Candidate rules a review raised and nobody has ruled on yet                                           |
| `.mcp.json`                                                      | The MCP servers the host connects always — the tracker and forge at minimum                          |

Two points that save a newcomer from guessing wrong:

- **The six review lanes are the whole review.** Structure, design, correctness,
  frontend practices, backend practices, security. They run in parallel because
  none reads another's output, and every finding goes past `finding-verifier` in
  fresh context before it reaches the report. `full-review` orchestrates them; it
  reviews nothing itself.
- **Tests are written in dedicated passes, not alongside features.** "No new
  tests" is the normal and correct answer on a feature branch — see
  [`testing.md`](.claude/docs/rules/testing.md). Nobody will ask them where the
  tests are.

The long-form reasoning — why each lane exists, what was rejected, what is still
an open thread — is the **AI infrastructure** document in Linear:
the document at `tracker.docs.aiInfrastructure`. Point
at it; don't summarise it.

Then say what the workflow is, in one line, because the rest of this skill is
walking it:

> `/klein-sdlc:whats-next` → `/klein-sdlc:implement-ticket` → `/klein-sdlc:full-review` → `manual-qa-engineer` → `/klein-sdlc:commit-and-pr`

And check they want to proceed. From here a real ticket moves and a real PR
opens.

## Part 2 — The first ticket

Before step 1, confirm the preconditions rather than discovering them at step 5:

```bash
git status --short --branch
```

A dirty tree or a branch other than `forge.baseBranch` is a stop-and-ask, not something to clean
up. Also ask whether the dev server is running — step 5 needs it.

### 1 — The board: they run `/klein-sdlc:whats-next`

Ask them to type it themselves:

```
/klein-sdlc:whats-next
```

Explain what it is about to do while it runs: it reads the open **`tracker.project`**
board and the repo's pull requests, triages open PRs first, drops anything
blocked by unfinished work, and proposes one coherent batch with the reasoning
attached. It is **board-only** — it never reads the codebase and never writes to
the board, which is what makes it cheap enough to run casually.

Two outcomes that are not a ticket, and both are the skill working correctly:

- **An open PR outranks the board.** If one comes back, that is genuinely the
  next thing; ask whether they want to deal with it or set it aside for this
  walkthrough.
- **Non-implementation work.** An unsliced story or an open spike cannot be
  implemented at all. Say why, and look further down the proposal.

### 2 — Choose the ticket together

`whats-next` optimises for the **next coherent batch**, which is not the same
thing as a **good first ticket**. Say that out loud, then pick from its proposal
against a different filter:

| Prefer                                    | Why                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| One app, one layer                        | The diff stays readable, and the review comes back short                |
| Real acceptance criteria                  | AC is the spec; a ticket without them turns step 3 into a design session |
| A visible UI surface                      | Step 5 is a browser pass — a pure backend ticket makes it a no-op        |
| Nothing on the auth surface               | A first PR should not be the one that wakes `security-reviewer`          |
| Unblocked, and small                      | Well under the repo's median PR size                                    |

If nothing in the proposal fits, say so and ask them to widen — do not talk them
into a bad first ticket to keep the walkthrough moving. Confirm the choice
explicitly before step 3, because that is the last reversible moment.

### 3 — Implement: `/klein-sdlc:implement-ticket <tracker.issuePrefix>-XX`

Invoke it with the chosen id. Tell them what it will do before it does it: get
to a clean current base branch, fetch the issue, **move it to `tracker.states.inProgress` and
assign it to them**, roll the parent story up if this is the task that starts it,
read the rule files matching the paths it is about to touch, implement, and run
every command in `gates`.

The two things worth pointing out while it works:

- **It stays on `forge.baseBranch` and does not commit.** This repo branches at commit
  time, never at the start of work. That surprises people.
- **It reads the rule files before writing, not after.** Watch which ones it
  opens — that is the routing table doing its job, and it is how they should
  work too.

It stops after verifying. Go through the diff with them before moving on.

### 4 — Review: `/klein-sdlc:full-review`

Invoke it on the working tree.

Explain the shape while it runs: it resolves the diff once and runs `lint` and
`typecheck` once, hands both to every lane, spawns only the lanes that apply,
and puts each finding past `finding-verifier` in fresh context — which never
sees the reviewer's reasoning, on purpose. Findings come back with a
`(blocking)` / `(non-blocking)` / `(if-minor)` bit and each lane's own
vocabulary.

Then work the findings with them, and teach the two rules that surprise everyone:

- **A finding's scope is the changed file, not the changed hunk.** An untouched
  line in a file they edited is in scope.
- **"The rest of the file already does it this way" widens the fix, it does not
  excuse it.** Precedent is not a defence here.

Fix what blocks, decide the rest together, and re-run only if something
substantive changed.

### 5 — Exercise it: `manual-qa-engineer`

Needs the apps running. If the dev server is not up, **ask them to start it**
and wait.

Spawn the subagent against what the ticket changed. It signs itself in the way
the host's QA catalogue says, so it can exercise every role rather than only
the one they happen to be, and it sweeps in four passes — functional, state coverage, the
accessibility floor, then house rules — reporting `broken` / `floor` / `house` /
`unverified`.

Worth naming: **`unverified` is a real result, not a miss.** Some failure states
cannot be forced from a browser, and the agent is required to say so rather than
let an unreachable state read as a pass.

It reports only. It does not fix and it does not file — filing is `report-bug`,
which needs a human decision. If it finds something in the ticket's own scope,
fix it and tell them why that one is in scope while an unrelated defect is a
separate `report-bug`.

### 6 — Ship: `/klein-sdlc:commit-and-pr`

Invoke it. It branches (now, not earlier), groups the changes into conventional
commits by concern via `craft-commits`, pushes through local `git`, opens the PR
with the tracker wiring and labels, and moves the ticket to **`tracker.states.inReview`**.

Two things to point out:

- The PR body template and the Linear issue link are the skill's, not
  improvised — and CI runs the same `gates` before the merge.
- The push goes the way `forge.pushVia` says, for the reason in
  `forge.pushViaNote`. Whichever route that is, it is the normal one, not a
  fallback.

### 7 — Debrief

Close the loop in a few lines:

- The path they just walked, and that **the order carries weight** — review
  before QA because a browser pass on code that fails review is wasted, QA
  before the PR because a reviewer should not be the one to find a broken page.
- Where each piece of it is written down, so they can run it without this skill
  next time: the plugin's [`README.md`](${CLAUDE_PLUGIN_ROOT}/README.md) and
  [`REVIEW.md`](${CLAUDE_PLUGIN_ROOT}/REVIEW.md).
- What they hit that the rules corpus does not cover, if anything. That is a
  **rule gap**, it goes in [`rule-gaps.md`](.claude/docs/rule-gaps.md), and a
  newcomer is the best source of them — they are the only person who has not
  yet absorbed the unwritten parts.

Then stop. Don't roll straight into a second ticket.
