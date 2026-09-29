# TRACKING.md

How work is tracked here. Read by `write-spec`, `spec-to-stories`, `report-bug` and
`whats-next`, and by anyone filing something by hand.

It carries no project names of its own — the team, the build project, the states and the
labels are the host's, in `.claude/sdlc.json`, and this file names them by their path
(`tracker.states.inReview`). Why it is shaped this way:
[`design-notes.md`](${CLAUDE_PLUGIN_ROOT}/docs/design-notes.md).

## Four kinds of thing, four primitives

The tracker has no issue-type field, so each kind of thing maps onto a different primitive.

| Kind          | Lives as                              | Type label                 |
| :------------ | :------------------------------------ | :------------------------- |
| Specification | A **document** on the build's project | —                          |
| Story         | A **parent issue**                    | `tracker.typeLabels.story` |
| Task          | A **sub-issue** of a story            | `tracker.typeLabels.task`  |
| Bug           | A **top-level issue**                 | `tracker.typeLabels.bug`   |

Two more type labels sit outside the story tree, both as top-level issues:
`tracker.typeLabels.chore` for maintenance that lands as a single issue, and
`tracker.typeLabels.spike` for a timeboxed investigation whose output is a decision, not
code.

## Builds are projects

The product is the team, `tracker.team`. Each build is a project, and the open one is
`tracker.project`. A build has a start and an end; work that does not fit the current build
sits in the backlog without a project until a build claims it.

Milestones inside a build mark phases. Specs for a build live as documents on that build's
project.

## Specs

A spec is reference material, not a work item — it has no "done" state, and it stays true
after the code ships. So it is a document on the project, never an issue.

Every spec is shaped by the spec template and named `Spec: <thing>`. The template is the
file the manifest names at `docs.specTemplate`, or the plugin's own
[`templates/spec-template.md`](${CLAUDE_PLUGIN_ROOT}/templates/spec-template.md) when the
manifest names none. Link the spec from every story that implements it, and link back from
the spec to those stories.

### Status

Documents carry no status field, so every spec carries one as a line at the top of its
content, visible in a document listing without opening the document.

| Value                                                      | Means                                                                  |
| :--------------------------------------------------------- | :--------------------------------------------------------------------- |
| `Draft — not yet refined.`                                 | Written, not yet reviewed for UX. Not plannable                        |
| `Refined <date>`                                           | Reviewed and corrected. The only status `spec-to-stories` plans from   |
| `As-built — describes shipped functionality as of <date>.` | Written after the fact. Never becomes `Refined`, never becomes stories |

A spec is born `Draft` and stays there until it has been through `refine-spec` — the point
where it stops being what was asked for and becomes what actually serves its user. Only
then does it become work.

There is deliberately no value for "planned": the spec's **Stories** section already says
that, and a status that duplicates a section is a status that goes stale.

When _writing_ the spec is itself work that needs scheduling, make a
`tracker.typeLabels.chore` issue for it. That issue closes when the document exists; the
document then lives on.

## Stories and tasks

A **story** is a parent issue with acceptance criteria, broken into tasks when it starts.
Most stories are user-visible outcomes — you can write _"as a <role>, I can …"_ about them.
Some are not: a testing pass, a CI change, a review-process overhaul deliver nothing a user
sees, and are still stories, because what makes something a story is that it carries
acceptance criteria and splits into tasks.

The line between a story and a chore is **whether it needs splitting**, not who sees the
result. A chore that turns out to need tasks was a story.

When breaking a **spec** into stories the narrower test still applies, because a spec
describes product functionality: something in a spec that fails _"as a <role>, I can …"_ is
a chore dressed up in story language. The wider definition is for work that never came from
a spec.

A **task** is one slice of a story, sized to roughly one PR — which is also one branch.
One task, one branch, one PR.

**Don't create tasks for a story until you are about to start it.** A story with acceptance
criteria and no sub-issues is a complete backlog item. Creating the whole graph up front
produces sub-issues that are stale by the time anyone opens them.

## Bugs

Top-level issues, never nested under a story. A bug found after a story shipped is its own
thing and outlives that story.

The exception: a defect caught _during_ the story's own work, before it ships, is a task
under it.

## Priority

Every story, task, bug, chore and spike carries one. "No priority" is not a fifth level —
it means nobody looked, and a board skill cannot rank what nobody looked at.

**A priority is read against its siblings, and what counts as a sibling depends on where
the issue sits.**

| Issue                                | Its priority ranks it against            |
| :----------------------------------- | :--------------------------------------- |
| Top-level — story, bug, chore, spike | Every other top-level issue on the board |
| Task — a sub-issue                   | The other tasks of **the same story**    |

A task's priority says which slice of its story to pick up first, and nothing else. It is
never compared with a task of another story or with a top-level issue: a `Low` task under a
`High` story is still part of high-priority work, and an `Urgent` task under a `Low` story
outranks nothing outside that story. What places a task on the board is its story's
priority.

### Top-level issues

| Priority       | A story, chore or spike gets it when                                                           |
| :------------- | :--------------------------------------------------------------------------------------------- |
| **1 — Urgent** | Something outside the board is waiting on it: a date, a commitment. Rare for planned work      |
| **2 — High**   | The spec's primary goal cannot be demonstrated without it, or other stories are blocked by it  |
| **3 — Medium** | It delivers a stated goal and nothing else waits on it. The default                            |
| **4 — Low**    | A refinement: the spec would still meet its goals without it                                   |

Bugs use the same four levels by severity; the table is `report-bug`'s.

### Tasks

| Priority       | A task gets it when                                                                                     |
| :------------- | :------------------------------------------------------------------------------------------------------ |
| **1 — Urgent** | A defect caught mid-story that stops the other tasks being worked                                       |
| **2 — High**   | Other slices of the story build on it, or it carries the story's main uncertainty and should fail early |
| **3 — Medium** | The body of the story. The default                                                                      |
| **4 — Low**    | It can land last, and the story is still demoable if it is cut                                          |

### Two rules that hold at both levels

- **A blocker is never ranked below what it blocks.** When a story blocks a higher-priority
  one, the blocker is raised to match. The same holds between two tasks of one story.
- **Priority orders only what the relations leave free.** A hard dependency is a blocked-by
  relation, not a priority. Priority says which of the things that _could_ start should.

`spec-to-stories` proposes a priority for every issue it drafts, with its reason, and the
user corrects it before anything is published.

## Areas

Labels under `tracker.areaLabelPrefix` are flat, not a group, because a change often spans
several — a new entity routinely touches the domain, the backend and an app at once. Apply
as many as fit.

## Statuses

`tracker.states.backlog` → `.todo` → `.inProgress` → `.inReview` → `.done`.

`tracker.states.inReview` means the PR is open. There is deliberately no "Blocked" status —
use a **blocked-by relation** instead, so the issue keeps showing its real state and the
blocker stays visible.

## Estimates and cycles

Off, and never set by a skill. Priority and blocked-by relations carry the ordering with
less bookkeeping, and the board skills rank on exactly those two.
