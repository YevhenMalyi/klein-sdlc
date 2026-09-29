---
name: spec-to-stories
description: >-
  Turns a `Spec:` document on a Linear project into stories — parent issues with
  acceptance criteria, a priority, area labels, and blocked-by relations — and links them
  back to the spec. On explicit request for one named story, breaks that story into
  prioritized tasks as sub-issues. Use when the user says "break this spec into stories", "create the issues
  for this spec", "plan the work for Spec: X", "what stories does this need", or "make
  the tasks for <prefix>-XX".
---

# Spec to stories

Two passes, and they are deliberately far apart in time.

**Pass 1 turns a spec into stories.** Run it once the spec has been through
[`refine-spec`](../refine-spec/SKILL.md) — refinement changes behaviour, and behaviour
changed after planning invalidates the plan.

**The spec's status line says whether that happened.** A spec reading `Draft` is not
plannable: stop, say why, and offer to refine it first. Only `Refined` proceeds. Don't
plan from a draft because the user asked twice — if they want to override, they can say so
explicitly, and then it's their call on the record rather than a step that got skipped.

**A spec reading `As-built` is never plannable.** It documents functionality that already
ships, so there is no work in it to slice. Stop and say so. If the user wants issues out of
it, what they want is [`refine-spec`](../refine-spec/SKILL.md), which files the gaps it
finds as bugs — not stories reconstructing work that is already done.

**Pass 2 turns one story into tasks.** Run it when you are about to start that story —
not before.

The project manifest — `tracker.*` below names values in it:

!`cat .claude/sdlc.json`

That split is the tracking convention, not a preference:
_"Don't create tasks for a story until you are about to start it. A story with acceptance
criteria and no sub-issues is a complete backlog item."_ Creating the whole graph up front
produces sub-issues that are stale by the time anyone opens them. Read the conventions in
[`TRACKING.md`](${CLAUDE_PLUGIN_ROOT}/TRACKING.md) if you have not — § Priority in
particular, because both passes set one.

## Pass 1 — stories

### 1. Read the spec

If the user passed a document URL, title, or id, fetch it. Otherwise find it:
`mcp__linear__list_documents` with `query: "Spec: "` — if exactly one recent spec sits on
the open build, propose it and confirm; never guess between two.

Read the **whole** document, including Open questions. An open question that gates a story
is a blocker to raise now, not a surprise for the implementer.

### 2. Read the codebase

Enough to name things the way the repo names them, and to spot prefactoring: _make the
change easy, then make the easy change._ A prefactor is its own story, and it blocks the
ones it unblocks.

### 3. Draft the stories

A **story is a user-visible outcome with acceptance criteria**. The test is whether you
can write _"as a <role>, I can …"_. If you can't, it isn't a story — it's a
`tracker.typeLabels.chore` (tooling, deps, refactors) or a `tracker.typeLabels.spike` (timeboxed investigation
whose output is a decision, not code). Say which and why rather than dressing a chore up
in story language.

That test is narrower than the general definition of a story, deliberately so:
`TRACKING.md` calls a story any parent issue with acceptance criteria that splits
into tasks, user-visible or not. Here the input is a **spec**, which describes product
functionality, so anything in it failing the as-a-role test really is a chore.

Slice **vertically**:

- Each story cuts a narrow but **complete** path through every layer it touches — shared
  package, backend, app — not a horizontal slice of one layer.
- A finished story is demoable on its own.
- Any prefactor comes first.

Give each story its **blocking edges**: the stories that must finish before it can start.
A story with no blockers can start immediately.

Give each story a **priority**, and the reason in one clause. A story is top-level, so its
priority ranks it against the whole board, by the table in `TRACKING.md` § Priority:

- **Read it off the spec, not off the story's size.** `High` is a story the spec's primary
  goal cannot be demonstrated without, or one other stories are blocked by. `Medium` is the
  default: it delivers a stated goal and nothing waits on it. `Low` is a refinement the
  spec would still meet its goals without. `Urgent` needs something outside the board
  waiting on it — the user names that, you don't infer it.
- **Then walk the blocking edges.** A blocker is never ranked below what it blocks: raise a
  prefactor or a foundation story to the highest priority among the stories it blocks, and
  say that is why.
- **Don't flatten.** Every story of a spec landing on the same priority is a breakdown
  that ranked nothing. If they genuinely are equal, say so rather than leaving it to look
  like an oversight.

**Wide refactors are the exception.** One mechanical change whose blast radius fans across
the codebase — renaming a column, retyping a shared symbol — can't land green as a
vertical slice. Sequence it expand–contract instead: add the new form beside the old, then
migrate call sites in batches sized by blast radius (per package, per area), each batch
blocked by the expand, then delete the old form in a contract story blocked by every batch.

### 4. Quiz the user before publishing anything

Present the breakdown as a numbered list. Per story: **title**, **priority** with its
reason, **blocked by**, and **what it delivers** end to end. Then ask four questions:

- Does the granularity feel right — too coarse, too fine?
- Are the blocking edges real, or is something listed that doesn't actually gate it?
- Should any of these merge or split?
- Are the priorities right? They are a proposal; a correction always wins.

Iterate until the user approves. Nothing reaches Linear before that.

### 5. Publish

In dependency order — blockers first, so each `blockedBy` can reference a real identifier.

```
mcp__linear__save_issue
  team:      <tracker.team>
  project:   <the spec's project>
  title:     <short, in the project's vocabulary>
  state:     <tracker.states.backlog>
  priority:  <1–4, as approved>
  labels:    [<tracker.typeLabels.story>, "<tracker.areaLabelPrefix>…", "<tracker.areaLabelPrefix>…"]
  blockedBy: [<identifiers of the blockers, already created>]
  description: <the body below>
```

**`labels` replaces the whole set**, so pass the type label and every area label in the
one call. Areas are flat and additive — apply every one the story touches; a new entity is
routinely three `tracker.areaLabelPrefix` labels at once — domain, backend, and the app.

**Every story is published with a priority.** An issue left at "No priority" is one the
board skills cannot rank. Priority and blocked-by relations are how work gets ordered;
**estimates and cycles are off — never set them.**

Body:

```markdown
## What this delivers

The end-to-end behaviour this story makes work, from the user's perspective. Not a layer-by-layer implementation list.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Spec

<link to the spec document>
```

### 6. Link back

Patch the spec's `## Stories` section with the published issues —
`mcp__linear__save_document` with `patch`, not a full rewrite. The link runs both ways:
that section is how you tell at a glance whether the spec has shipped. **Change nothing
else in the document.**

## Pass 2 — tasks for one story

Only on an explicit request naming a story. Never as a continuation of pass 1.

A **task is one slice of a story, sized to roughly one PR** — which is also one branch and
one Linear branch name, matching [`commit-and-pr`](../commit-and-pr/SKILL.md) and the
repo's small-atomic-PR convention. If a task wouldn't survive its own review as a coherent
change, it's two tasks.

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

Same discipline as pass 1: draft, quiz the user on granularity, edges and priorities, then
publish in dependency order so each `blockedBy` can reference a real identifier.

```
mcp__linear__save_issue
  team:      <tracker.team>
  parentId:  <the story>
  project:   <the story's project>
  state:     <tracker.states.backlog>
  priority:  <1–4, within the story, as approved>
  labels:    [<tracker.typeLabels.task>, "<tracker.areaLabelPrefix>…"]
  blockedBy: [<sibling tasks that must land first, already created>]
```

Sub-issues inherit nothing automatically — set the project, the priority and the area
labels the task actually touches.

**Leave the story's own priority alone.** Slicing a story is not a reason to re-rank it; if
the slicing showed the story is bigger or riskier than its priority suggests, say so and
let the user move it.

## Rules that hold across both passes

- **No file paths or code snippets in issue bodies.** They go stale before anyone reads
  them. The one exception is a snippet that encodes a decision more precisely than prose
  can — a state machine, a schema, a type shape — trimmed to the decision, not a working
  demo.
- **Bugs are never sub-issues of a story.** A defect found _during_ a story's own work,
  before it ships, is just a task under it. Anything found after it shipped is a top-level
  `tracker.typeLabels.bug` that outlives the story.
- **There is no Blocked status by design.** Use the blocked-by relation, so the issue keeps
  showing its real state and the blocker stays visible.
- **Don't close or restructure the spec**, or any parent issue, beyond the `## Stories`
  section in step 6.
