---
name: commit-and-pr
description: End-to-end workflow for committing branch changes and opening PRs. Encapsulates branch separation by concern, conventional commits via the craft-commits skill, Linear issue wiring, an embedded PR body template, a local git push, GitHub MCP PR creation, and the standard assignee+label workflow. Use when the user says "commit and create PR", "ship this branch", "push and open PR", "commit these changes and create PRs", or after completing implementation work that needs to land on GitHub.
---

# Commit and Create PRs

End-to-end workflow for taking work to review-ready PRs on `forge.owner/forge.repo`.

The project manifest — `tracker.*`, `forge.*`, `gates` and `commits.*` below name values
in it:

!`cat .claude/sdlc.json`

## When to use

- Uncommitted changes (staged, unstaged, or both) that need to become PRs.
- A branch with commits that needs pushing and a PR opened.
- The user invokes `/klein-sdlc:commit-and-pr` or says any trigger phrase.

## When NOT to use

- Commits only, no PR → use the `craft-commits` skill directly.
- Reviewing existing PRs.
- Work that is incomplete or conflicted — resolve first.

## Hard rules

1. **Never add Claude/AI attribution** to commits, PR titles, PR bodies, or anything
   else. No `Co-Authored-By: Claude`, no `🤖 Generated with Claude Code`.
2. **Never commit or push without an explicit ask.** The trigger phrases are that ask;
   absent them, stop after presenting the plan.
3. **Conventional Commits are mandatory** — `type(scope): description`, with a body that
   explains _why_. Scopes are `commits.scopes`.
4. **PR titles are prefixed with the tracker issue**: `[<tracker.issuePrefix>-XX] Imperative
   phrase`, or `forge.noIssueTag` when there genuinely isn't one.
5. **Use the embedded PR body template** in Phase 3. To change the format, edit this
   skill — see "Modifying the PR template" at the end.
6. **Run verification before committing**: every command in `gates`, in order. Abort on
   any failure. `gatesNote` says what each gate carries — never report a command as
   passing that wasn't run, and never lower a threshold to get green.
7. **Push the way `forge.pushVia` says** — here local git, for the reason in
   `forge.pushViaNote`. The MCP is still how the PR itself is opened and labelled.
8. **No local-file references in PR bodies.** Nothing under `.claude/docs/`,
   `.claude/plans/`, `*.local.md`, or `/tmp` — the reviewer sees only the merged branch.
   Inline the relevant excerpt instead of linking out.
9. **Never force-push a branch with an open PR** without saying so first.

---

## Workflow

### Phase 0 — Inventory and classify

1. `git status` and `git diff --stat` (parallel).
2. Base branch is `forge.baseBranch`.
3. Read each changed file briefly and bucket it:
   - **Feature / fix** — the named work, normally one Linear issue per branch
   - **Refactor** — cleanup not tied to an issue, often a follow-up to recent work
   - **Tooling / chore** — `.claude/**`, `.github/**`, root config, `tooling/*`
4. Print the inventory before proposing branches. Call out any file that doesn't
   obviously belong to what the user described — it may be a leftover.

### Phase 1 — Branch strategy

Default: **one concern per branch, one PR per branch.** Three mixed concerns in the
working tree means three branches and three PRs.

**Branch naming — include the tracker issue ID** so the GitHub integration links the
branch to the issue and moves it to `tracker.states.inProgress`:

| Concern                   | Pattern               |
| ------------------------- | --------------------- |
| Work with a tracker issue | `forge.issueBranch`   |
| No issue                  | `forge.noIssueBranch` |

**Take the issue branch name from Linear**, then strip the leading username segment —
its "Copy git branch name" action prefixes the name with the assignee's username
(`<username>/<forge.issueBranch>`), which `forge.issueBranch` does not carry. Keep the rest
verbatim so the issue ID still matches and the branch, the issue, and the PR link up
without anyone hand-typing an ID that has to.

**No username, `feature/`, `chore/`, `refactor/` prefixes.** Branch names describe the
change; conventional-commit types carry the categorization, and the PR author already
carries who.

**Present the branch plan before executing** unless in auto mode — branch name, base,
files per branch, expected commit count, and the tracker issue each maps to.

### Phase 2 — Per-branch commit work

For each branch, smallest and safest first:

1. **Switch to base.** `git checkout <forge.baseBranch>`.
2. **Create the branch.** `git checkout -b <branch-name> <forge.baseBranch>`. Unstaged work belonging
   to other branches stays in the tree across checkout — intentional, it gets committed
   on its own branch later.
3. **Stage only this branch's files.** `git add <specific files>`. **Never `git add .` or
   `git add -A`** — that is exactly how cross-branch leakage happens.
4. **Verify.** Run every command in `gates`, in order, each to completion. They are
   repo-wide and fast; run them all rather than guessing at scope. `gatesNote` says what
   each one carries. **Abort on any failure** — do not commit broken code, and do not
   "fix" it by relaxing a rule.
5. **Invoke the `klein-sdlc:craft-commits` skill** via the Skill tool. It sees the whole working
   tree, so scope it explicitly: _"Only the staged files belong to this branch; leave
   unstaged work alone for subsequent branches."_ It produces the grouped conventional
   commits with bodies and the `Refs: <tracker.issuePrefix>-XX` trailer.
6. **Verify the result.** `git log <forge.baseBranch>..HEAD --oneline` matches the plan.
7. **Return to base.** `git checkout <forge.baseBranch>` — committed files revert to the
   base branch's content; the next branch's unstaged work is still waiting.

### Phase 3 — Push and open the PR

#### Push the branch — local git

```bash
git push -u origin <branch>
```

That is the whole of it. The commits crafted in Phase 2 are the commits that land, so
local and remote SHAs match and there is nothing to reconcile afterwards.

**Do not push through the MCP** — `forge.pushViaNote` says why. The MCP's read calls and
its PR-level writes (`create_pull_request`, `issue_write`, `get_me`, `list_label`) are
unaffected and are still the right tool for the steps below.

On `Permission denied (publickey)`: do **not** silently rewrite SSH config. Ask the user
to run `! gh auth login --hostname github.com --git-protocol https --web` in their
session, then continue.

#### Open the PR

**Title:** `[<tracker.issuePrefix>-XX] Imperative verb phrase` — no trailing period, under
~70 characters. `forge.noIssueTag` when there is no tracker issue.

**Body template — embedded here deliberately, and authoritative for skill-generated
PRs.** Edit this block to change the format.

```markdown
# [<tracker.issuePrefix>-XX] Imperative verb phrase

#### Functional Summary

- What changes for the end user? Plain-language description of user-visible behavior —
  no jargon, no file names, no library names.
- Where does the change appear in the app? Name the screen or route a non-engineer can
  navigate to (`/settings`, the item editor, the public detail page).
- What's the user-facing acceptance? Specific scenarios with expected outcomes
  ("clicking Now fills the date field with the current local time" — not "the handler
  calls `new Date()`"). Use the `AC1`, `AC2`, … convention when referencing
  the Linear story's acceptance criteria (no `#`, no spaces).
- Out of scope or known limitations? Anything explicitly NOT covered by this PR. When
  something is picked up later, name the **tracker issue** that owns it
  (`<tracker.issuePrefix>-YY`).

#### Technical Summary

- Where should the reviewer start? Name the file(s) and the entry point — repo-relative
  paths only, and only files that exist on the merged branch.
- Root cause / approach. For bugs: what was broken and why. For features: the design
  choice, and the alternatives considered and rejected.
- Significant decisions or trade-offs. Anything non-obvious — name it and explain why.
  Call out anything that deviates from `.claude/rules/core.md`, and why.
- Files deliberately NOT changed but that a reviewer might expect to see touched. State
  why.
- Technical debt introduced or left? Be honest.
- Follow-up work for the backlog? List the Linear issues, or say "None."

#### How should this be tested?

- The verification commands that were run — the `gates` list. State the actual result — never claim a command passed
  that wasn't run, and say plainly when one wasn't.
- Manual scenarios with expected outcomes, step by step from a freshly started dev server.
- Tests: say what the suite covers for this change, or say plainly that the change is
  outside what is covered. Where the host's convention is dedicated testing passes rather
  than tests alongside features, "no new tests" is usually the correct answer and should
  be stated rather than left out. Never imply coverage that doesn't exist.
- AC coverage line: which ACs this PR meets (e.g. "AC1–AC4 met by this PR. AC5 deferred
  to <tracker.issuePrefix>-YY"), so the reviewer doesn't have to re-derive coverage from
  the story.

Fixes <tracker.issuePrefix>-XX
```

Notes on the template:

- **The `Fixes <tracker.issuePrefix>-XX` trailer is what closes the tracker issue on
  merge.** Use `Fixes`, `Closes`, or `Resolves`. Omit it entirely for `forge.noIssueTag`
  PRs. If the PR only partially addresses the issue, write `Refs <tracker.issuePrefix>-XX`
  instead so it stays open.
- **AC reference style: `AC1`, `AC2`, … no hash, no spaces.** Write "AC3 marks all three
  fields required" — not `AC #3`, `AC-3`, or `Acceptance Criterion 3`. Ranges use an
  en-dash: `AC1–AC6`. Applies to PR titles, PR bodies, commit bodies, and code comments.
- A change spanning the stack may add sub-headings inside the Technical Summary — one per
  layer (contract, backend, frontend) reads better than one long list. They go **inside**
  that section, never in place of it.
- **No AI attribution footer. No local-file references.**

Call `mcp__github__create_pull_request` with `owner: <forge.owner>`, `repo: <forge.repo>`,
`base: <forge.baseBranch>`, `head: <branch-name>`, the title, and the body.

**Move the tracker issue to `tracker.states.inReview`.** Call `mcp__linear__save_issue`
with `id: <tracker.issuePrefix>-XX` and `state: <tracker.states.inReview>`. Do this explicitly rather than relying on the
Linear–GitHub integration alone — it usually makes the same move on its own, but this
keeps status correct even on the runs where a webhook lags or doesn't fire. Skip for
`forge.noIssueTag` PRs — there's no issue to move.

**Return to base.** `git checkout <forge.baseBranch>`, always, once the PR is open. The
push leaves the local checkout on the feature branch, and the next branch's Phase 2
assumes it is starting from the base branch.

### Phase 4 — Assignee and labels

Neither can be set by `create_pull_request`; use `mcp__github__issue_write` with the PR
number afterwards.

**Assignee — always the user.** Resolve it dynamically via `mcp__github__get_me` and use
the returned `login`; don't hardcode.

**Scope labels are additive — apply every one the diff touches**, decided by the actual
diff against `forge.baseBranch`, not by what the work "feels like". The mapping is
`forge.scopeLabels`: each label lists the path prefixes that earn it.

A full-stack change gets several. Don't drop the backend's label because the frontend
diff dominates — a stealth backend change is what gets missed on review. A change to a
domain package plus its two consumers carries the package label and both consumers'.

```
mcp__github__issue_write
  method: update
  owner: <forge.owner>
  repo: <forge.repo>
  issue_number: <PR number>
  assignees: [<login from get_me>]
  labels: [<every scope the diff touches>]
```

**Verify each label exists before applying it** — `mcp__github__list_label` lists what
the repo has. A `forge.scopeLabels` key can be renamed or deleted on the forge, and
`issue_write` fails the whole call on an unknown one. If a
label is genuinely missing, ask the user rather than creating it silently.

### Phase 5 — Report

Hand back branch names, PR numbers and URLs, the tracker issues they close, confirmation
that the issue moved to `tracker.states.inReview`, that assignee and labels landed, and any
verification warnings worth flagging.

**Stop there. Do not post PR comments** — the user authors all PR replies themselves.

---

## Common pitfalls

### Stale `.git/index.lock`

Long-running gate commands sometimes leave a 0-byte `.git/index.lock` behind with no git
process running. Symptom: "Another git process seems to be running."

```bash
ls -la .git/index.lock              # confirm 0 bytes
ps aux | grep "git " | grep -v grep # confirm no git process
rm .git/index.lock
```

Only after confirming **both**. Never remove the lock blindly.

### Base branch drift mid-flight

Branches are cut from the local base branch, so `git fetch origin <forge.baseBranch>`
before Phase 2 — a stale local base silently bases the branch on old content, and the PR then carries a
diff nobody asked for.

### Mixed concerns surfaced mid-execution

If a file turns out to have changed for two unrelated reasons, **stop and ask the user**
how to split it. Don't commit the mixed change to either branch.

### Lint failures that are formatting

The formatting gate failing is fixed by the formatter's write mode, which is safe and
mechanical — run it, then re-verify. A lint failure is not; it needs a
real fix, and relaxing the rule to get green is a finding to raise, not a workaround to
apply.

---

## Modifying the PR template

The template is embedded in Phase 3 under "Open the PR". Edit that code block to change
the format for skill-generated PRs.

Keep the H1 title placeholder, the three `####` headings (Functional Summary / Technical
Summary / How should this be tested?), the tracker closing trailer, and the
no-attribution rule. The Functional/Technical split is deliberate and load-bearing: the
first half is readable by someone who never opens the diff, the second half is the
reviewer's entry point. Don't collapse them into one summary.

---

## References

- Conventional Commits:
  [`../craft-commits/references/conventional-commits.md`](../craft-commits/references/conventional-commits.md);
  this repo's scopes are `commits.scopes` in the manifest
- Related skill: `craft-commits`
- Repo rules: [`.claude/rules/core.md`](.claude/rules/core.md)
