---
name: onboarding
description: >-
  Tours how Claude Code is set up on this repo — skills, review lanes,
  subagents, the rules corpus — explains how work gets onto the board, from a
  spec to stories to tasks, then guides a person step by step through shipping
  their first ticket, from the board to an open PR, invoking the real workflow
  rather than describing it. Use when someone says "onboard me", "onboard me
  to the AI setup", "how do we use Claude here", "what skills do we have",
  "how do specs become tickets", "walk me through my first ticket", "show me
  the workflow", or is new to the team and ready to work rather than set up
  their machine. Installing and running the apps is the host's own setup
  guide, not this skill.
---

# Onboarding

Three parts. **The tour** — what is checked in, what each piece is for, and
where the reasoning lives. **How work gets onto the board** — a spec, then
stories, then tasks, and which skill makes each. **The first ticket** — the
person actually ships one, with you alongside each step.

The third part is the point. The first two exist so the first ticket makes
sense, not the other way around, so keep them short and get to the work.

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
- **Run only the steps of Part 3.** Not an extra review lane, not a second QA
  sweep, not `/code-review` on top of `full-review`. The chain is the lesson;
  padding it teaches the wrong thing about what a normal change costs.
- **Part 2 is described, not run.** Writing a spec is a long interview and
  slicing one publishes issues; neither belongs inside an onboarding pass
  unless the board is empty and the person asks for it — see Part 3's
  preconditions.
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
| `TRACKING.md` (plugin)                                           | The tracking contract — what a spec, story, task and bug are, and what a priority means               |
| [`.claude/docs/review/`](.claude/docs/review/README.md)            | One catalogue per review lane: this repo's invariants, auth surface, greps and sanctioned forms       |
| `klein-sdlc` skills (plugin)                                        | The workflow skills, namespaced `/klein-sdlc:<name>`, including the five Part 3 uses                    |
| `klein-sdlc` agents (plugin)                                        | Eight subagents — six review lanes, plus `finding-verifier` and `manual-qa-engineer`                  |
| [`.claude/docs/rule-gaps.md`](.claude/docs/rule-gaps.md)           | Candidate rules a review raised and nobody has ruled on yet                                           |
| `.mcp.json`                                                      | The MCP servers the host connects always — the tracker and forge at minimum                          |

Two points that save a newcomer from guessing wrong:

- **The six review lanes are the whole review.** Structure, design, correctness,
  frontend practices, backend practices, security. They run in parallel because
  none reads another's output, and every finding goes past `finding-verifier` in
  fresh context before it reaches the report. `full-review` orchestrates them; it
  reviews nothing itself.
- **Whether tests travel with a change is the host's rule, not the plugin's.**
  Read [`testing.md`](.claude/docs/rules/testing.md) and say what it says —
  some hosts write tests in dedicated passes, where "no new tests" is the
  normal answer on a feature branch; others require them in the same PR. Never
  state either from memory.

**Say only what is true of this repo.** Before presenting the table, check that
each host piece exists, and report what is missing or marked unwritten — a
lane with no catalogue is skipped, and a newcomer should hear that from you
rather than from an empty review.

The long-form reasoning — why each lane exists, what was rejected, what is still
on probation — ships with the plugin:
[`design-notes.md`](${CLAUDE_PLUGIN_ROOT}/docs/design-notes.md). Point at it;
don't summarise it. It is a file on their machine, so give the path, never a
link into a tracker or a wiki the reader may not be able to open.

## Part 2 — How work gets onto the board

Describe this; don't run it. Two or three minutes, and the point is that the
newcomer knows where a ticket came from before they pick one up. The contract
for all of it is [`TRACKING.md`](${CLAUDE_PLUGIN_ROOT}/TRACKING.md).

> `/klein-sdlc:write-spec` → `/klein-sdlc:refine-spec` → `/klein-sdlc:spec-to-stories` (stories) → `/klein-sdlc:spec-to-stories` (tasks, one story at a time)

| Step | Skill | Produces | Where it lives |
| :-- | :-- | :-- | :-- |
| 1 | `write-spec` | A `Spec: <thing>` document, status `Draft` | A document on the build's project — never an issue, never a file in the repo |
| 2 | `refine-spec` | The same spec, corrected against UX practice, status `Refined <date>` | The same document |
| 3 | `spec-to-stories`, pass 1 | Stories: acceptance criteria, a priority, area labels, blocked-by relations | Parent issues, linked from the spec's **Stories** section |
| 4 | `spec-to-stories`, pass 2 | Tasks for **one** story, each roughly one PR, each with a priority | Sub-issues of that story |

`report-bug` is the other way onto the board: a bug comes from the running
product, so nothing upstream of it exists to plan from. It is a top-level
issue, never a task.

Four things worth saying out loud, because each one is where a newcomer
guesses wrong:

- **The spec's status line is a gate.** `spec-to-stories` plans only from
  `Refined`. It refuses a `Draft` and says why, and it refuses an `As-built`
  spec outright, because that one documents what already ships.
- **The order carries weight.** Refinement changes behaviour, and behaviour
  changed after planning invalidates the plan — so `refine-spec` runs before
  anything is sliced.
- **Stories and tasks are made far apart in time.** Pass 1 runs once per spec.
  Pass 2 runs when someone is about to start that story, never for the whole
  backlog up front. A story with acceptance criteria and no tasks is a
  complete backlog item — and it is not implementable yet, which is why
  `whats-next` reports it as unsliced rather than ready.
- **A priority means two different things.** A story's priority ranks it
  against the whole board. A task's ranks it against the other tasks of its
  own story, and nothing else: it says which slice to pick up first. Both are
  proposed by `spec-to-stories` and corrected by the user before anything is
  published.

Nothing reaches the tracker from any of these skills without an approval: each
one drafts, quizzes, and publishes only then.

Then say what the rest of this skill walks, in one line:

> `/klein-sdlc:whats-next` → `/klein-sdlc:implement-ticket` → `/klein-sdlc:full-review` → `manual-qa-engineer` → `/klein-sdlc:commit-and-pr`

And check they want to proceed. From here a real ticket moves and a real PR
opens.

## Part 3 — The first ticket

Before step 1, confirm the preconditions rather than discovering them at step 5:

```bash
git status --short --branch
```

A dirty tree or a branch other than `forge.baseBranch` is a stop-and-ask, not something to clean
up. Also ask whether the dev server is running — step 5 needs it.

Two preconditions are the host's state rather than the person's, and both are
worth knowing before step 1 rather than at the step they break:

- **An empty board has no first ticket.** If `whats-next` comes back with
  nothing open, Part 3 stops there and Part 2 becomes the next step for real:
  the work is a spec, via `/klein-sdlc:write-spec`. Say so, and offer it —
  don't invent a ticket to keep the walkthrough moving.
- **A host with no runnable app has no step 5.** The QA catalogue at `docs.qa`
  says whether there is anything to drive. If there is not,
  `manual-qa-engineer` reports blocked, and that is the correct result; say it
  up front so it does not read as a failure.

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

If the ticket is a task, its priority is the one Part 2 described: it ranked
the task inside its story, and the story's priority is what put this batch in
front of them.

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
commits by concern via `craft-commits`, pushes the way `forge.pushVia` says, opens the PR
with the tracker wiring and labels, and moves the ticket to **`tracker.states.inReview`**.

Two things to point out:

- The PR body template and the Linear issue link are the skill's, not
  improvised — and where the host runs CI, it runs the same `gates` before the
  merge. Check that it does before saying so.
- The push goes the way `forge.pushVia` says, for the reason in
  `forge.pushViaNote`. Whichever route that is, it is the normal one, not a
  fallback.

### 7 — Debrief

Close the loop in a few lines:

- The path they just walked, and that **the order carries weight** — review
  before QA because a browser pass on code that fails review is wasted, QA
  before the PR because a reviewer should not be the one to find a broken page.
- Where each piece of it is written down, so they can run it without this skill
  next time: the plugin's [`README.md`](${CLAUDE_PLUGIN_ROOT}/README.md),
  [`REVIEW.md`](${CLAUDE_PLUGIN_ROOT}/REVIEW.md) for how a finding is reported,
  and [`TRACKING.md`](${CLAUDE_PLUGIN_ROOT}/TRACKING.md) for how work is
  tracked.
- What they hit that the rules corpus does not cover, if anything. That is a
  **rule gap**, it goes in [`rule-gaps.md`](.claude/docs/rule-gaps.md), and a
  newcomer is the best source of them — they are the only person who has not
  yet absorbed the unwritten parts.

Then stop. Don't roll straight into a second ticket.
