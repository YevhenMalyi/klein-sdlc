---
name: story-to-tasks
description: >-
  Breaks one named story on Linear into tasks — sub-issues sized to roughly one PR each,
  with a priority scoped to the story, area labels, and blocked-by relations between
  siblings. Use when the user says "make the tasks for <prefix>-XX", "break <prefix>-XX
  into tasks", "slice this story", "plan the tasks for <prefix>-XX", or is about to start
  a story that has no sub-issues yet. Turning a spec into stories is spec-to-stories,
  not this.
---

# Story to tasks

Turns **one** story into tasks, when someone is about to start it — never a whole spec's
worth at once ([`TRACKING.md`](${CLAUDE_PLUGIN_ROOT}/TRACKING.md); read it if you have not,
§ Priority in particular, because every task gets one).

The project manifest — `tracker.*` below names values in it:

!`cat .claude/sdlc.json`

## 1. Read the story

The user names it; accept the id loosely and normalize it to `<tracker.issuePrefix>-NN`.
No story named: ask which — never pick one off the board yourself.

```
mcp__linear__get_issue(id: "<tracker.issuePrefix>-NN", includeRelations: true)
```

- **It must be a story** — carrying `tracker.typeLabels.story`, or a parent issue with
  acceptance criteria. A task, a bug or a chore is not sliced further: say so and stop.
- **It already has sub-issues?** Show them and ask whether to add to them or stop. Never
  replace or restructure existing tasks unasked.
- Read its acceptance criteria and the `Spec:` document its `## Spec` section links. The
  tasks partition those criteria; every criterion ends up owned by exactly one task.

## 2. Read the codebase

Enough to name things the way the repo names them, and to see the seams the story will be
cut along — schema, contract, backend, app. A prefactor the story needs is its own task,
and it blocks the tasks it unblocks.

## 3. Draft the tasks

A **task is one slice of a story, sized to roughly one PR** — which is also one branch and
one Linear branch name, matching [`commit-and-pr`](../commit-and-pr/SKILL.md). Use
`commit-and-pr`'s review budget as the size check: a task whose change will clearly run
past it is two tasks. If a task wouldn't survive its own review as a coherent change, it's
two tasks.

Give each task its **blocking edges** within the story — schema and contract before the
endpoint, the endpoint before the UI that calls it — and a **priority**.

**A task's priority is scoped to its story.** It ranks the task against its siblings and
says which slice to pick up first; it says nothing about the board, and nobody compares it
with a task of another story. What places the task on the board is the story's own
priority. So:

- **Rank the tasks against each other, not against the story.** Tasks of one story
  routinely differ: `High` for the slice the others build on or the one carrying the
  story's main uncertainty, `Medium` for the body of the story, `Low` for what can land
  last and be cut with the story still demoable. The table is `TRACKING.md` § Priority.
- **Never copy the story's priority down** as a default. A `High` story whose five tasks
  are all `High` has told the implementer nothing about where to start.
- **A blocker is never ranked below the sibling it blocks.**
- **Priority orders what the edges leave free.** A hard dependency is a blocked-by
  relation; priority decides between the tasks that could start now.

## 4. Quiz the user before publishing anything

Present the breakdown as a numbered list. Per task: **title**, **priority** with its
reason, **blocked by**, and the **acceptance criteria it owns**. Then ask:

- Does the granularity feel right — too coarse, too fine?
- Are the blocking edges real?
- Is every criterion of the story owned by exactly one task?
- Are the priorities right? They are a proposal; a correction always wins.

Iterate until the user approves. Nothing reaches Linear before that.

## 5. Publish

In dependency order, so each `blockedBy` can reference a real identifier.

```
mcp__linear__save_issue
  team:      <tracker.team>
  parentId:  <the story>
  project:   <the story's project>
  title:     <short, in the project's vocabulary>
  state:     <tracker.states.backlog>
  priority:  <1–4, within the story, as approved>
  labels:    [<tracker.typeLabels.task>, "<tracker.areaLabelPrefix>…"]
  blockedBy: [<sibling tasks that must land first, already created>]
  description: <the body below>
```

Sub-issues inherit nothing automatically — set the project, the priority and the area
labels the task actually touches. **`labels` replaces the whole set**, so pass the type
label and every area label in the one call. **Estimates and cycles are off — never set
them.**

Body:

```markdown
## What this delivers

The slice of the story this task makes work, and what it deliberately leaves to a sibling.

## Acceptance criteria

- [ ] The story's criteria this task owns, quoted
```

**Leave the story's own priority alone.** Slicing a story is not a reason to re-rank it; if
the slicing showed the story is bigger or riskier than its priority suggests, say so and
let the user move it.

Then point at the next step: [`implement-ticket`](../implement-ticket/SKILL.md) or
[`deliver-ticket`](../deliver-ticket/SKILL.md) on the first task the edges leave free.

## Rules

- **No file paths or code snippets in issue bodies.** They go stale before anyone reads
  them. The one exception is a snippet that encodes a decision more precisely than prose
  can — a state machine, a schema, a type shape — trimmed to the decision, not a working
  demo.
- **Bugs are never sub-issues of a story.** A defect found _during_ a story's own work,
  before it ships, is just a task under it. Anything found after it shipped is a top-level
  `tracker.typeLabels.bug` that outlives the story.
- **There is no Blocked status by design.** Use the blocked-by relation.
- **Don't change the story** — its description, criteria, status or priority. The tasks
  are the only thing this skill writes.
