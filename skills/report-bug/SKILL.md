---
name: report-bug
description: >-
  Files a bug as a top-level bug-labelled issue in Linear — reproduction, expected versus
  actual, scope, and a severity-derived priority — and offers a separate investigation pass
  that patches a diagnosis into the issue. Use when the user says "file a bug", "report
  this bug", "log this as a bug", "something's broken", "create an issue for this", or
  describes behaviour that is wrong rather than missing. Reach for it too when you find a
  defect yourself mid-task — a review finding, a failing check — and it belongs on the
  board rather than in the conversation.
---

# Reporting a bug

A bug report earns its place when someone can act on it **without you in the room**. That
is the whole bar: reproduction, what should have happened, what did, and how much it
matters.

**Capture first, investigate second.** Bugs get found in the middle of other work, and a
skill that spends ten minutes diagnosing before it writes anything down is a skill you stop
reaching for. Get the report on the board, then offer the investigation as a separate pass.

The project manifest — `tracker.*` and `forge.*` below name values in it:

!`cat .claude/sdlc.json`

The output is a **top-level issue** — never a sub-issue, never a document. Read the
conventions document at `tracker.docs.conventions` if you have not.

## First: is it actually a bug?

Three gates. Any one of them failing means you file something else, or nothing.

**Has it shipped?** A bug is _something already shipped that is behaving wrong_. A defect caught during a story's own work, before it ships, is a **task under that
story** — the workspace convention, not a preference. That case leaves this skill: create
the task and say so.

**Is the wrong behaviour user-visible?** Tooling noise, a flaky script, a dependency
warning, a lint rule misfiring — that is a `tracker.typeLabels.chore`. Bugs are about the product
misbehaving for a user.

**Was the correct behaviour ever specified?** If the system does something unhelpful that
nobody ever said it shouldn't, that is a **missing acceptance criterion or a new story**,
not a defect. Check the spec before assuming.

Say which and why, the way [`spec-to-stories`](../spec-to-stories/SKILL.md) refuses to plan
from a `Draft` spec. **Don't file a `tracker.typeLabels.bug` to be agreeable** — a mislabelled bug
distorts the one signal the board has about product health. If the user overrules you after
hearing the reason, that is their call on the record, and you proceed.

## Two entry paths

| Where it came from                                                                  | Path                   |
| :---------------------------------------------------------------------------------- | :--------------------- |
| The user hit it and is describing it                                                | **A — interview**      |
| You found it: a `correctness-reviewer` finding, a failing check, something mid-task   | **B — draft directly** |

They differ only at the start. Both converge on the same report, the same confirmation, and
the same publish.

### Path A — capture what the user saw

You need five facts, and no more at this stage:

1. **What they did** — the steps, in order, from a state someone else can reach.
2. **What they expected.**
3. **What actually happened** — including any error text verbatim.
4. **Where** — which app, which route, which role.
5. **How often, and since when** — every time or intermittently; first noticed after a
   known change, or always been there.

Ask the whole frontier in **one round**, in the house format:

```
❓ **Q1** — **<question title>**: <the question>

➡️ <your best guess, so the user can accept the round in a word>
```

**Finding facts is your job, never the user's.** Which route serves that page, which role
the guard requires, whether the env var is set — go and read it. Ask the user only what
lives in their head: what they did, what they expected, what they saw. The same split as
[`write-spec`](../write-spec/SKILL.md).

**Don't chase the cause yet.** A hypothesis that arrives before the symptom is written down
tends to reshape the symptom.

### Path B — you found it

You already hold the diagnosis, so an interview is theatre. Draft the report directly,
including the `## Diagnosis` section, and present it.

**Still confirm before publishing.** An issue on the board is a claim about the product, and
it outlives this conversation. One presentation, one approval.

## Priority

Set it yourself from severity, state which you picked in one line, and move on. Don't open a
round for it — a correction from the user is cheap, and it always wins.

| Priority       | When                                                                                 |
| :------------- | :----------------------------------------------------------------------------------- |
| **1 — Urgent** | Data loss or corruption, a permission or auth hole, the product down or unusable     |
| **2 — High**   | A core path broken with no workaround: sign-in, the main write path, upload          |
| **3 — Medium** | Broken but with a workaround, or a path outside the core                             |
| **4 — Low**    | Cosmetic, wrong copy, a rare edge case                                               |

**A permissions hole is Urgent even when it is narrow.** Someone seeing or editing what
their role forbids is the failure mode this repo spends the most structure preventing — see
the doc at `docs.permissions`.

Priority ordering is how work gets ranked here, because **estimates and cycles are off.
Never set them.**

## The report

```markdown
## Summary

One sentence: what is wrong, and for whom.

## Steps to reproduce

1. Signed in as <role>, go to <route>
2. …
3. …

## Expected

What should have happened.

## Actual

What happened instead. Error text verbatim, in a fence.

## Scope

App, route, and role. How often it happens. When it was first seen — a date, a release, or
the change that introduced it, if that is known.
```

**No file paths or code snippets outside `## Diagnosis`.** They go stale before anyone
reads them, and _Steps to reproduce_ describes user actions, not function calls. The
diagnosis section is the deliberate exception: there, naming the line **is** the value, and
a bug is usually fixed close enough to filing that the path still resolves.

## Publish

**Search for duplicates first** — always, it costs one call:

```
mcp__linear__list_issues
  team:   <tracker.team>
  label:  <tracker.typeLabels.bug>
  query:  <the symptom, in the words the report uses>
```

Include completed ones. **A closed bug matching the symptom is a regression**, which is a
different and more interesting issue than the original: file it fresh, link it with
`relatedTo`, and say in the summary that it was fixed before. An open match is a duplicate
— add what you learned as a comment on it and stop, rather than filing a second copy.

Then:

```
mcp__linear__save_issue
  team:        <tracker.team>
  project:     <the open build>
  title:       <the symptom, not the suspected cause>
  state:       <tracker.states.backlog>
  priority:    <1–4>
  assignee:    "me"
  labels:      [<tracker.typeLabels.bug>, "<tracker.areaLabelPrefix>…", "<tracker.areaLabelPrefix>…"]
  description: <the report above>
```

- **`labels` replaces the whole set** — pass `tracker.typeLabels.bug` and every area label
  in the one call. Areas are flat and additive; a permission bug routinely carries the
  backend's and the app's `tracker.areaLabelPrefix` labels at once.
- **The build project.** `mcp__linear__list_projects` with `team: <tracker.team>` — one
  open build, use it and say which; more than one, ask. **Never create a project.**
- **`state`** is `tracker.states.backlog`, except a priority-1 bug you are about to act on,
  which is `tracker.states.todo`. There is no Blocked status by design — if the fix waits on something, use a
  `blockedBy` relation so the issue keeps showing its real state.
- **Title the symptom, not the cause.** _"Editors can open the approve action on their own
  posts"_ survives being wrong about why; _"Missing self-approval check in the post
  service"_ does not.

Then offer the investigation pass in one line. Don't start it unasked.

## The investigation pass

Separate, opt-in, and it does **not** fix anything.

1. **Reproduce it first, if you can.** For a UI bug a browser MCP such as `playwright`
   drives the running app. **Never start a dev server to reproduce** — if the app is not already up, ask the
   user to start it.
2. **Read the rules for the area before calling anything broken.** Behaviour that looks
   wrong is sometimes the architecture working as designed. When code and a rule disagree,
   that is a finding about which one should change, and it is the repo owner's call — not
   a licence to file the rule as a bug.
3. **Patch the diagnosis in.** `mcp__linear__save_issue` with `patch`, appending the
   section — never a full rewrite of a description someone may have edited:

   ```markdown
   ## Diagnosis

   Where it goes wrong and why, naming the file and symbol. The smallest snippet that
   makes the mechanism clear, if prose cannot. What the fix would touch — not a patch.
   ```

4. **Stop there.** Filing and fixing are separate acts, and a fix that arrives inside the
   filing conversation never gets its own review.

## Handing off to the fix

The issue is `<tracker.issuePrefix>-n`. Fixing it later goes through
[`commit-and-pr`](../commit-and-pr/SKILL.md), which already knows the wiring: Linear's own
branch name (`forge.issueBranch`), a `Refs: <tracker.issuePrefix>-n` trailer on the commits, and
`Fixes <tracker.issuePrefix>-n` in the PR body.

**Don't close the bug by hand.** The merge does it, and a bug closed manually loses the link
to the change that fixed it.

## Rules

- **Bugs are top-level, never a sub-issue of a story.** A bug found after a story shipped
  outlives that story. The in-flight exception is a task, and then this is not the skill.
- **One bug per issue.** Two symptoms sharing one cause is one bug. One symptom with two
  independent causes is two.
- **Never file a duplicate.** Comment on the open one, or link the closed one as a
  regression.
- **Don't restructure anything else** — not the story that introduced the bug, not the spec.
  A bug is new information, not a correction to the record.
