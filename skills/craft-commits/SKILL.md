---
name: craft-commits
description: >
  Analyze all changes on a feature branch — committed, staged, unstaged,
  and untracked — and organize them into clean conventional commits
  grouped by logical concern.
  Use when user says "clean up my commits", "organize my commits",
  "rewrite commits", "craft commits", "structure my changes into commits",
  "split changes into commits", or "make my branch reviewable".
---

# Craft Commits

Organize all changes on the current branch into clean conventional commits grouped by
logical concern. Covers both rewriting messy WIP commits and creating commits from
scratch when none exist yet.

Read `references/conventional-commits.md` for the message format and the grouping
principles. This repo's scopes are `commits.scopes` in the project manifest:

!`cat .claude/sdlc.json`

## Hard rules

- **Never push.** Pushing belongs to the user or to the `commit-and-pr` skill.
- **Never modify source files.** Git operations only.
- **Never run quality gates** (lint, typecheck, format) — that is `commit-and-pr`'s job.
- **Never add Claude/AI attribution** to a commit message. No `Co-Authored-By: Claude`,
  no `🤖 Generated with Claude Code`, no equivalent.
- **Conventional Commits format is required** for every commit subject —
  `type(scope): description`, from the type and scope tables in the reference.
- **Every commit needs a body.** A one-line commit is not acceptable.
- **Each commit must stand alone** — no commit may reference a symbol or file introduced
  in a later one.
- **Class A or Mixed always blocks for approval before execution** — it rewrites commits
  that already exist (`git reset --soft` and regroup), which needs a human sign-off since
  it's destructive to history. **Class B does not block** — there's nothing to rewrite,
  only uncommitted changes being organized into first commits, so proceed straight from
  Step 5's proposal into Step 6 and report the result.

## Step 1 — Assess

1. `git status` — staged, unstaged, untracked.
2. `git merge-base HEAD <forge.baseBranch>` — the base branch is `forge.baseBranch`.
3. `git log <merge-base>..HEAD --oneline` — commits on this branch.
4. Read existing commit messages in full; keep any worth reusing.
5. `git log origin/<branch>..HEAD 2>/dev/null` — if the branch exists on the remote, a
   force-push will be needed later. Note it now.

**Classify:**

- **A** — messy commits exist ("wip", "fix", "asdf"); tree may be clean or dirty
- **B** — no commits beyond merge-base; everything is in the working tree
- **Mixed** — meaningful commits plus uncommitted changes

## Step 2 — Confirm (class A or Mixed only)

Skip this step entirely for class B — go straight to Step 3.

```
Branch:             <branch-name>
Base commit:        <short SHA> (<forge.baseBranch>)
Commits to rewrite: <count>
Uncommitted files:  <count>
Previously pushed:  Yes / No

⚠️  This rewrites history for this branch. Recovery via `git reflog`.

Proceed?
```

Do not continue without an explicit yes.

## Step 3 — Collapse

Flatten everything into an unstaged working tree so it can be regrouped freely.

**A or Mixed:**

1. Dirty tree → `git stash --include-untracked`
2. `git reset --soft <merge-base>`
3. `git reset HEAD`
4. Stashed → `git stash pop`

**B:** `git reset HEAD` to unstage; the working tree is untouched.

Result: all changes unstaged or untracked, no commits beyond merge-base.

## Step 4 — Analyze

1. `git diff --stat`
2. Read per-file diffs for anything non-trivial
3. `git ls-files --others --exclude-standard` for new files

For each file, identify the workspace it belongs to (an app, a shared package, tooling,
the repo root — the keys of `commits.scopes` usually map onto them), whether it imports
from another changed file, and whether it is added, modified, or deleted.

The workspace usually _is_ the commit scope — see the scope table in the reference.

## Step 5 — Propose

**Grouping principles** (in full in `references/conventional-commits.md`):

- One concern per commit — describable in one sentence without "and"
- Layer separation — domain, backend, and frontend in separate commits where independent
- Tests travel with their implementation — never split a feature from its tests
- Config and docs last — dependency bumps and documentation after functional code

**Dependency-aware ordering.** Analyze imports, type references, and module boundaries.
No commit may reference a symbol or file introduced in a later one. Where two changes are
tightly coupled — a migration and the table it alters, a contract procedure and its only
consumer — **group them in the same commit rather than splitting**: a commit that doesn't
typecheck standalone is worse than a broad one.

Group into commits and present for approval:

```
1. feat(domain): add a scheduledAt field to the item schema
   packages/domain/src/item/{schema,contract}.ts

2. feat(api): persist and query scheduledAt
   apps/api/src/item/{table,repo,service}.ts, migrations/0009_*.sql

3. feat(admin): add a schedule control to the item editor
   apps/admin/src/item/ItemForm/...

⚠️  1 must precede 2 (repo.ts imports the schema type)
```

Reuse good existing commit messages where they match a group. Flag any commit that may
not typecheck standalone, and say why.

**Class A or Mixed: block for approval.** Revise and re-present if the user asks for
adjustments. **Class B: present the plan, then proceed straight to Step 6** without
waiting for a yes — there's no existing history at stake, only how the uncommitted
changes get grouped. Still revise and re-present if the user interrupts with a change.

## Step 6 — Execute

Per commit, in order:

1. `git add <files for this commit>` — never `git add .` or `-A`
2. `git diff --cached --stat` — verify what's staged
3. Commit with a subject and a mandatory body:

```bash
git commit -m "type(scope): short description

What changed and why: the problem being addressed, the decision taken and
what was rejected, and any non-obvious consequence.

Refs: <tracker.issuePrefix>-XX"
```

Include the `Refs: <tracker.issuePrefix>-XX` trailer when the work has a tracker issue. Linear picks it up
through the GitHub integration and links the commit to the issue.

**Validate each message.** If the repo has a commitlint config, run it; otherwise check
the subject with a shell regex:

```bash
git log -1 --pretty=%s | grep -qE '^(feat|fix|refactor|perf|docs|test|chore|ci|build|style|revert)(\(.+\))?!?: .+' \
  || echo "✗ subject is not Conventional Commits"
```

This checks that the subject:

- starts with a valid type
- has an optional scope in parentheses
- has an optional `!` for breaking changes
- has a colon, a space, and a non-empty description

It cannot check the body, so confirm by eye that a blank line and a body follow.

On failure, `git commit --amend` and re-check. Up to 3 attempts, then warn and continue.

## Step 7 — Verify

1. `git status` — must be clean
2. `git diff <merge-base>..HEAD --stat` — must match the Step 1 changeset exactly
3. `git log <merge-base>..HEAD --oneline`

Report the result to the user:

```
✓ Committed X changes across Y commits
✓ Working tree clean
✓ All original changes preserved

Next steps:
- Push with: git push --force-with-lease origin <branch>  (if previously pushed)
- Push with: git push -u origin <branch>  (if not yet pushed)
- Or run the commit-and-pr skill to verify quality gates, push, and open a PR
```
