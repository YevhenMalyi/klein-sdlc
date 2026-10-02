---
name: implement-ticket
description: >-
  Picks up a Linear ticket by number and implements it: gets to a clean,
  current base branch, fetches the issue, moves it to In Progress and assigns
  it to the current user, investigates the relevant code, and implements the
  change — on the base branch, without branching or committing. Use when the
  user says "implement <prefix>-XX", "pick up <prefix>-XX", "work on ticket
  <prefix>-XX", "let's do <prefix>-XX", or names a ticket number and wants it
  built. Takes the ticket ID as its argument.
---

# Implement a ticket

Takes a tracker ticket from "assigned" to "code written and verified on the base
branch," and stops there. It does not create a branch, does not commit, and
does not open a PR — that is [`commit-and-pr`](../commit-and-pr/SKILL.md)'s
job, run separately once the user is happy with the diff. It does not run the
review lanes or `manual-qa-engineer` either — those run when asked, same as any
other task.

The project manifest — `tracker.*`, `forge.*` and `gates` below name values in it:

!`cat .claude/sdlc.json`

## Hard rules

- **No branch here.** Work happens directly on `forge.baseBranch`. A branch is created
  only at commit time — see [`commit-and-pr`](../commit-and-pr/SKILL.md)'s
  branch-naming convention, which needs the Linear issue id anyway and is the
  right point to decide it.
- **Never discard uncommitted work.** If the tree isn't clean when this
  starts, stop and ask what to do with it rather than stashing or checking
  out over it unasked.
- **Move the named issue's status, plus its immediate parent's when this is
  the task that starts it** (step 3 has the exact condition). Never a
  sub-issue's, never a sibling's, never a grandparent's — no matter how
  related they look.
- **Assign the named issue to the current user, and only that issue.** Not
  the parent, not a sibling. Resolve the user as `"me"` — never a hardcoded
  name, id or email, so the skill works for whoever runs it.
- **Don't invent scope.** Implement what the ticket (and its acceptance
  criteria) actually asks for. A ticket is not a license for drive-by
  cleanup elsewhere, and "while I'm in here" belongs in a separate
  conversation.

## Workflow

### 1 — Get to a clean, current base branch

```bash
git status
```

If the tree is dirty — staged, unstaged, or an unfinished branch mid-flight —
stop and ask the user how to handle it before doing anything else. Don't
assume it's disposable.

If clean:

```bash
git checkout <forge.baseBranch>
git pull origin <forge.baseBranch>
```

If a branch already exists for this ticket (resuming interrupted work), ask
before deciding whether to continue there or start fresh from the base branch —
don't assume either.

### 2 — Fetch the ticket

Accept the id loosely — lowercase, missing the team prefix, whatever the
user typed — and normalize to the `<tracker.issuePrefix>-123` form the tracker
expects.

```
mcp__linear__get_issue(id: "<tracker.issuePrefix>-XX", includeRelations: true)
```

`includeRelations` surfaces `blockedBy`/`blocks`; `parentId` comes back
either way. Read them for context (a parent story often explains *why*, and
a sibling issue can mark out what this one is deliberately not covering),
but implement only the named issue. If a blocker is still open, flag it;
don't silently implement around a dependency that isn't there yet.

Note that the payload carries the parent's **id only**, not its status — if
there's a `parentId`, step 3 needs a second `get_issue` to read it.

### 3 — Move it to `tracker.states.inProgress` and assign it to the current user

Both fields are set in one call:

```
mcp__linear__save_issue(id: "<tracker.issuePrefix>-XX", state: <tracker.states.inProgress>, assignee: "me")
```

`state` takes a name directly — no need to resolve a status id first — and
`assignee: "me"` resolves against the active Linear session. **Never write a
name, email or user id into this skill**; `"me"` is what makes it correct for
whoever is running it.

Check the two fields from step 2's payload independently, and pass only the
ones that need changing:

- **Status.** Already `tracker.states.inProgress` or further along
  (`tracker.states.inReview`, `tracker.states.done`)? Leave it.
- **Assignee.** Empty, or already the current user? Set it — assigning an
  unassigned ticket is the point of this step. Assigned to **someone else**?
  **Stop and ask before taking it.** Another person in that field is the one
  signal on the board that someone may already be on this, and silently
  reassigning it erases that signal.

If both are already right, skip the call and go straight to the parent check.

**If the issue has a `parentId`, roll the parent up too.** The first task
starting is what starts the story, so the parent shouldn't sit in
`tracker.states.backlog` while its sub-issues are being built. Step 2's payload
carries the parent's id but not its status, so fetch it:

```
mcp__linear__get_issue(id: "<parentId>")
```

If the parent's `statusType` is `backlog` or `unstarted`, move it:

```
mcp__linear__save_issue(id: "<parentId>", state: <tracker.states.inProgress>)
```

If it's `started` or beyond, leave it alone. **The immediate parent only** —
never a grandparent, never a sibling, never a sub-issue.

**Status rolls up; assignment does not.** A story is owned by whoever owns
its tasks, not by whoever starts the first one. Pass `state` for the parent
and nothing else.

Only the starting edge needs handling here: the team's **Parent auto-close**
setting closes the other end, marking the story Done once its last task is.

Do all of this before investigating, not after — it's the signal that the
ticket is actually being worked, not just read.

### 4 — Investigate before writing anything

- Read the issue's description and acceptance criteria in full — twice.
  Acceptance criteria are the spec; re-derive requirements from them, not
  from the title.
- Work out which areas of the codebase this touches, and read the matching
  files in [`.claude/docs/rules/`](.claude/docs/rules/README.md) and
  [`.claude/docs/practices/`](.claude/docs/practices/README.md) per the table
  in [`core.md`](.claude/rules/core.md) — before writing, not after. A repo
  with a written rules corpus deviates from generic framework conventions on
  purpose; working from memory reproduces the parts that were deliberately
  changed.
- Find the closest existing implementation of the same shape and read it
  rather than designing from scratch. The rules corpus usually names
  reference implementations per kind of change; where it does not, the
  nearest sibling is the reference. A new piece almost always has a sibling;
  matching its shape is usually more correct than inventing one.
- If the diff is going to be large or span several layers, it's fine —
  tickets here often are. Splitting the *investigation* into parallel reads
  (`Explore`, or forked research) is reasonable; splitting the
  *implementation* into subagents generally isn't — the person driving needs
  the full picture to keep the layers consistent with each other.

### 5 — Decide whether to pause for a plan

If the acceptance criteria fully determine the implementation and the
approach is mechanical, proceed straight to step 6.

If investigation turns up a real decision the ticket doesn't answer —
which of several existing patterns to follow, how far up or down the stack
to take it, an interim-versus-target-design call — stop. Summarize what exists, what's missing, and the options, with a
recommendation, **in prose** — not an `AskUserQuestion` picker, unless it's
genuinely a short enumerable choice with no context to explain. Wait for a
go-ahead before touching files. A ticket with clear acceptance criteria is
not automatically "vague" — but AC rarely settles implementation shape, and
that's what this step is for.

### 6 — Implement, on the base branch, no branch of its own

Write the code. Follow the layer/slice/naming rules that are always in
context, plus whatever `docs/rules/`/`docs/practices/` file matches what's
being touched (step 4 already identified it). Follow the host's testing
rule on whether tests travel with the change; where the convention is
dedicated testing passes, write none unless the ticket is about testing.

### 7 — Verify

Run every command in `gates`, in order, each to completion.

Abort and fix on any failure — don't relax a rule to get green, and don't
report a command as passing that wasn't run. For a frontend-visible change,
check it in a running browser per the host's own verification rule — but
don't start a dev server unasked; only drive it if the apps are already up.

### 8 — Stop and report

Summarize what changed and why, in the same terms the acceptance criteria
used. Then stop:

- Don't branch, commit, or open a PR — point at `commit-and-pr` as the next
  step once the user's ready.
- Don't move the ticket's status again — it stays `tracker.states.inProgress`
  until the user asks otherwise (`commit-and-pr` moves it to
  `tracker.states.inReview` when the PR opens).
- Don't run the review lanes (`full-review`, or any lane on its own) or
  `manual-qa-engineer` unless asked.

## Multiple tickets

This is written for one ticket at a time. If asked to implement several,
confirm whether they land as one combined change or should be worked
sequentially (step 1 → 8 per ticket, each starting from the base branch the
previous one left behind) — don't assume either without asking, since it
changes how the eventual commits and PRs split.
