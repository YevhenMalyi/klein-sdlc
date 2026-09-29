---
name: whats-next
description: >-
  Reads the open build project's Linear board and the repo's pull requests, then
  proposes what to pick up now — open PRs first, then the next coherent
  batch of tickets, with the readiness and dependency reasoning behind the
  pick. Use when the user asks "what's next", "what should I work on",
  "what's ready to pick up", "what's unblocked", "propose the next tickets",
  or wants the board turned into a plan of action. Board and PRs only: it
  does not read the codebase, move any status, or implement anything.
---

# What's next

Turns the board into a recommendation: what to pick up now, the reasoning
behind it, and what else is close. It stops at the proposal —
[`implement-ticket`](../implement-ticket/SKILL.md) takes it from there, once
the user has chosen.

The project manifest — `tracker.*` and `forge.*` below name values in it:

!`cat .claude/sdlc.json`

The question it answers is *"what should I do next"*, and the honest answer is
often not "implement something." An open pull request outranks anything on the
board. A story that was never sliced into tasks can't be implemented at all,
and an unresolved spike can make a ready-looking task a trap. All three count
as next work, and all three get proposed.

## Hard rules

- **The board and its pull requests only. Never read the codebase.** No `Read`,
  no `Grep`, no `git log`, no `gh pr diff`, no checking whether something is
  half-built already. PR *metadata* — state, checks, mergeability — is in
  scope; PR *contents* are not. This is deliberate and it is the main thing
  that keeps the skill cheap enough to run casually. If the board is wrong, the
  fix is to fix the board.
- **Never write anything.** No status moves, no assignments, no comments, no
  new issues, and no merging, closing or commenting on a PR.
  `implement-ticket` moves things to `tracker.states.inProgress` when work actually starts;
  doing it here would mark tickets as started that the user hasn't agreed to.
- **Always `tracker.project`.** It is the only build project. Don't accept a
  project argument or invent a way to switch — if that changes, the manifest
  changes, not this skill.
- **Recommend a batch, not a ticket.** A single ticket in isolation is what
  the user could already read off the board themselves.
- **Don't manufacture readiness.** If everything good is blocked, say that.
  A confident recommendation for work that can't be done is worse than
  "nothing is cleanly ready, here's why."

## Workflow

### 1 — Pull the open board and the PRs in one call

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/whats-next.mjs
```

That is the whole fetch. It returns, for **open tickets only**, everything
steps 2–7 need: status, priority, labels, assignee, parent with its state and
priority, child counts with the open ones named, `blockedBy` / `blocks` /
`relatedTo` with each target marked `(OPEN)` or `(closed)`, and the pull
requests linked to each ticket with their state. It then adds three PR
sections of its own.

**Priority is printed under two keys, and they are not the same scale.** `P:`
is a top-level issue's priority, comparable across the board. `P-in-story:` is
a task's, and ranks it against the other tasks of its own story only — see
[`TRACKING.md`](${CLAUDE_PLUGIN_ROOT}/TRACKING.md) § Priority. A task's line
also carries its story's priority, as `parent=<id> (<state>, P:<priority>)`,
and that is the one that places the task on the board.

Two things not to do:

- **Don't fall back to `mcp__linear__list_issues` for the board.** It returns
  every ticket including everything Done, cannot express "not completed
  and not canceled" in one call, and carries no relations or attachments. The
  script exists because of those three limits.
- **Don't re-derive the PR picture with `gh`.** The script already ran it.

The script needs `LINEAR_API_KEY` (see `${CLAUDE_PLUGIN_ROOT}/scripts/linear-stats.mjs` for
the same requirement) and an authenticated `gh`. If `gh` is missing it says so
and still prints the tickets — report the PR half as unknown rather than
silently claiming there are no PRs.

### 2 — Triage the pull requests first

**Open PRs outrank everything on the board**, so read this section before
looking at a single ticket. The script has already sorted them:

| Script section | What it means | What you do |
| :-- | :-- | :-- |
| **Open — needs attention** | A PR is in flight | Report every one, with its reason |
| **Merged, but ticket is not Done** | Board drift — the code landed, the ticket didn't follow | Report it; the fix is a status move, not implementation |
| **Closed unmerged — SILENT** | A deliberate abandonment | **Never report it** |

That last row is the one to get right. A PR closed without merging means the
attempt was given up on; the ticket sitting back in `tracker.states.todo` is *consistent* with
that, not an anomaly. Flagging "this ticket has a PR" without checking whether
that PR is open, merged or closed sends the user off to land a branch they
themselves abandoned. The script marks these silent — leave them silent, and
say nothing about them even in passing.

An open PR's reason comes from the script: `draft`, `CI failing`, `conflicts
with the base branch`, `changes requested`, `CI still running`, or `green —
ready to merge`. A green one is usually a thirty-second job; a red one is real
work. That distinction decides how much of the rest of the report to print —
see step 8.

Open PRs with **no linked open ticket** are reported too. `[NO-ISSUE]` PRs
exist and nothing on the board would ever surface them.

### 3 — Rebuild the story tree

Group by `parent`. Every ticket is one of:

- a **parent** — carries the `tracker.typeLabels.story` label, or has children, or both
- a **child task** — has a `parent`
- a **standalone** — no parent, no children: the `tracker.typeLabels.spike`, `.chore` and `.bug`
  items that sit outside the story tree

Treat `statusType` as the truth, not the status name: `completed` and
`canceled` are closed, `started` covers both `tracker.states.inProgress` and
`tracker.states.inReview`, `unstarted` is `tracker.states.todo`, `backlog` is
`tracker.states.backlog`.

The script reports `children=N (M open: …)`, counting **all** children,
closed ones included. That distinction is what step 4 turns on.

### 4 — Classify every open parent

Four states, and they lead to different recommendations:

| State | Test | What it means |
| :-- | :-- | :-- |
| **Started** | `statusType: started`, has open children | Half-done. Finish it. |
| **Ready** | `unstarted`/`backlog`, has open children, no open blocker | Implementable now |
| **Unsliced** | `unstarted`/`backlog`, **`children=0`** | Needs `spec-to-stories` pass 2 before anyone can implement it |
| **Blocked** | any `blockedBy` marked `(OPEN)` | Excluded from batches; listed with its blocker |

**Unsliced is the one that's easy to miss.** A story with acceptance criteria
and no sub-issues looks ready in the Linear UI and is not. Read the total
child count, not the open one — a story whose children are all Done is
finished, not unsliced.

Two things worth catching here, both visible in the script's output:

- **Newly unblocked.** A parent whose `blockedBy` entries are all `(closed)`
  became ready without anything announcing it. That is the single most useful
  thing this skill surfaces on the ticket side — lead with it when it happens.
- **Still blocked.** A parent with any `(OPEN)` blocker is out, however high
  its priority. Say which ticket is holding it, so the blocker itself becomes
  a candidate.

**Tasks carry blocking edges too**, between siblings. A task with an `(OPEN)`
`blockedBy` is not pickable yet, and that does not make its story blocked —
the story is *Ready* or *Started* as long as one of its open tasks can start.

### 5 — Read descriptions, shortlist only

The script deliberately omits descriptions — they run to several kilobytes
each and only a handful matter. Fetch one only where a judgment in step 6 or 7
actually turns on it:

```
mcp__linear__get_issue(id: "<prefix>-XX")
```

Worth reading: an open spike whose gating you have to judge, and the one or
two tickets you are about to put in the batch. Not worth reading: anything you
have already excluded.

### 6 — Sweep for what isn't really ready

**Do this before ranking, not after.** A spike that genuinely gates a
candidate changes the ranking, so finding one afterwards means the ranking was
wrong.

- **Unsliced stories** — needs `spec-to-stories` pass 2. Name them.
- **Deferred items** — anything labelled `tracker.deferLabel`, or sitting in `tracker.states.backlog`
  well below the rest. Mention it only if it has started gating something;
  otherwise it's noise.
- **Open spikes — and be careful here, because the obvious rule is wrong.**
  Not every open spike gates the task it is about. Read the spike's own
  framing before deciding:

  | The spike says | Then |
  | :-- | :-- |
  | A decision is needed **before** the thing can be built | It gates. The task is premature; recommend closing the spike first |
  | The spec already ships **without** the thing, and this is whether to add it later | It gates nothing. The task is buildable exactly as specced |

  Linear's own relation is a strong hint: a spike linked as `relatedTo`
  rather than `blocks` is usually the second kind, and was deliberately
  linked that way. Treat a `relatedTo` spike as gating only when its text
  says a decision is genuinely outstanding — and say which sentence made you
  think so, so the call can be argued with.

  **A deferred enhancement is not a blocker.** Flagging one as a trap costs
  the user a real batch and teaches them to distrust the sweep.

### 7 — Rank the candidate batches

In this order. Each rule beats every rule below it:

1. **Never propose blocked work.** An absolute filter, not a preference —
   apply it before anything else. No exceptions, no "probably fine by then."
2. **Finish before starting.** A *Started* parent with open children outranks
   any *Ready* one. Two half-done stories plus a fresh start is three
   half-done stories.
3. **Prefer the candidate whose unfinished state does the most damage.** This
   is the rule that decides most real ties, and it is about the product, not
   the board: a story half-done such that a page cannot render at all beats
   one half-done such that a working page is missing a feature. Ask what a
   reader hits today because this story is incomplete. "A core page renders
   nothing" outranks "a working feature lacks a refinement", every time.
4. **Prefer what unblocks the most — weighted by how usable it is.** Compare
   `blocks` lists. Where they are the same length, the tiebreak is what the
   unblocked work costs to start: releasing a story that is already sliced
   into ready tasks is worth more than releasing one that still needs a
   `spec-to-stories` pass before anyone can touch it. Applies to *Started*
   and *Ready* candidates alike.
5. **Priority is a tiebreaker, not the sort key — and only `P:` is compared.**
   Urgent/High/Medium/Low separates otherwise-equal candidates. Sorting by
   priority first is how you end up recommending a High that's blocked over a
   Medium that's ready. A candidate batch is ranked by its **story's**
   priority; a standalone bug, chore or spike by its own. `P-in-story:` never
   enters this step: an Urgent task under a Low story does not lift that
   story over a Medium one, and a Low task under a High story is still
   high-priority work.
6. **Prefer a coherent area.** A batch that stays within one `tracker.areaLabelPrefix`
   label, or runs domain → backend → app in that order, is one piece of
   work. A batch that hops between unrelated areas is a list.

**If rules 1–6 all tie, say so.** Present both batches and let the user pick,
rather than inventing a seventh rule to break it. A manufactured tiebreak
reads as confidence the analysis does not have.

**An open issue at `P:none` was never ranked.** Treat it as unranked, not as
lowest: it loses a priority tiebreak to nothing and wins none, and it goes in
the report under "Not implementation, but next" as board hygiene — one line
naming the tickets, since a priority is a thirty-second fix the user has to
make themselves.

### 8 — Report

Prose and short tables, in the chat. Don't write a file, don't publish an
artifact, don't open a Linear issue.

**PRs lead, and the batch still follows.** An open PR is the first thing the
user reads, but the batch is computed either way — the data is already in
hand, and merging a green PR is often a thirty-second job after which they
want the next thing. Never stop at the PR section.

```
**PRs first:** #NN — <title>, <reason>. <One clause on what it needs.>

**Pick: <batch name>** — <one line on why this one>

| # | Issue | Why it's in this batch |
| - | ----- | ---------------------- |
| 1 | <prefix>-XX — <title> | <dependency or ordering reason> |
| 2 | <prefix>-YY — <title> | <...> |

<What finishing this batch unblocks, if anything.>

**Also ready:** <prefix>-ZZ — <title>, <one clause on why it lost>.

**Not implementation, but next:** <unsliced stories, open spikes, board drift,
anything gating.>

**Blocked:** <prefix>-XX, waiting on <prefix>-YY.
```

Four variations on that shape:

- **Scale the batch to what the PRs demand.** If an open PR needs real work —
  CI red, conflicts, changes requested — the user is not starting new work in
  the next hour, so the pick collapses to a single line ("after that, <prefix>-XX
  has three tasks left") instead of a full table. If the open PRs are merely
  green and unmerged, print the batch in full.
- **Open the PR line with "PRs first" only when there are any.** With none,
  drop the line entirely rather than writing "no open PRs" — an empty section
  is noise every single run.
- **A newly-ready parent leads the ticket half**, wherever it lands in the
  ranking. It is the one thing there that is genuinely invisible in Linear, so
  name it as newly ready and say which blockers completed — even when the
  finish-before-starting rule pushes it down to "Also ready".
- **A declared tie prints two picks**, side by side with the rule that ran out,
  and asks the user to choose. Don't dress one up as the winner.

Keep it to what changes a decision. The user built this board and does not
need every ticket read back — they need the ordering they can't see in the
Linear UI: what's in flight, what's newly ready, what's still gated, and what
isn't sliced yet.

## What counts as a batch

**Default: the remaining open tasks of one story**, in the order they should
be picked up:

1. **Blocking edges first.** A task with an `(OPEN)` sibling in `blockedBy`
   comes after that sibling, whatever either one's priority.
2. **Then `P-in-story:`**, highest first. This is what the field is for: it
   orders the tasks the edges leave free.
3. **Then the layer order**, where neither of the above decides — schema and
   contract before the endpoint, the endpoint before the UI that calls it.

Say which of the three put each task where it is, in the batch table's last
column.

Two to four items. One ticket isn't a batch; five-plus stops being a
sitting's work and starts being the story itself, in which case recommend the
story and note it's large.

A batch may cross stories only when the tickets genuinely belong together —
two small stories in the same area that share a migration, say. Say so
explicitly when it happens, because the default assumption is one story.
**Inside a cross-story batch, `P-in-story:` orders each story's own tasks and
never interleaves the two stories** — the values come from different scales.

**A batch is a proposal, not a commitment.** The user picks one ticket, all of
them, or none. Don't chain into implementing anything.

## Hand-off

Whatever the recommendation, this skill ends at the proposal:

- **Open PRs** → the user's call. Merging, pushing a fix, or closing the
  branch is theirs to do; never do it for them, and never offer to as part of
  this skill's output.
- **Board drift** (merged PR, ticket not Done) → a one-line status move in
  Linear, which this skill does not make either. Name the ticket and say what
  its status should be.
- **Tasks to implement** → [`implement-ticket`](../implement-ticket/SKILL.md),
  one at a time. It handles the status moves, including rolling the parent
  story to `tracker.states.inProgress` when the first task starts.
- **Unsliced stories** → [`spec-to-stories`](../spec-to-stories/SKILL.md),
  pass 2, which breaks one named story into task sub-issues.
- **Open spikes** → a conversation, not a skill. A spike closes when the user
  decides, and the decision belongs in the spec or in the host repo's decision log.

Offer the next step; don't take it. Moving a ticket to `tracker.states.inProgress` because it
appeared in a proposal would mark work as started that nobody agreed to do.

## When the board has no good answer

Say so plainly, and say which of these it is:

- **Everything is waiting on a PR** — the next step is merging or fixing CI,
  not starting more.
- **Everything ready is blocked** — name the blockers; they're the real work.
- **Nothing is sliced** — the next step is `spec-to-stories`, not implementation.
- **The project is done** — the next step is a new spec, via `write-spec`.

## A note on ticket ids in this file

Every id above is a placeholder — `<prefix>-XX`, `<prefix>-YY`, `<prefix>-ZZ`, where
`<prefix>` is `tracker.issuePrefix`. Keep it that way.
Linear's GitHub integration links and transitions any `TEAM-123`-shaped text
it finds in a PR title or body, regardless of context, so a real id quoted as
an example here can reopen a shipped ticket when this file's contents end up
in a PR description.
