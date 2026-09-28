# Conventional Commits Reference

> Format: https://www.conventionalcommits.org/en/v1.0.0/
> Types, scopes, and body rules below are this repo's, and are stricter than the spec.

Don't pattern-match on `git log` for what a commit should look like — a repo's history
often predates its convention. The rules and examples here are the reference.

## Format

```
type(scope): short description

Body: what changed and why. Mandatory — never commit a subject alone.

BREAKING CHANGE: description (if applicable)
Refs: <prefix>-XX (if there is a tracker issue)
```

**Subject line**

- 72 characters max, including `type(scope): `
- Imperative mood — "add", not "added" or "adds"
- Lowercase after the colon, no trailing period
- Describes the change, not the file touched: `fix(api): reject a publish date in
the past`, not `fix(api): update service.ts`
- If the subject needs "and", it's two commits

**Body** — mandatory, wrapped at 80 characters, separated from the subject by a blank
line. A good body answers three questions in whatever order reads best:

1. **What was wrong or missing**, concretely enough that the reader doesn't need the
   issue open to follow it
2. **What this does about it**, and the mechanism if it isn't obvious from the subject
3. **What was rejected**, and why — the alternative considered and dropped is the part
   nobody can reconstruct from the diff six months later

Skip any of the three that genuinely doesn't apply, but a body that only restates the
subject in longer words is worse than useful. If nothing beyond the subject is worth
saying, the commit is probably too small to stand alone.

**Trailers** — `Refs: <prefix>-XX` for the tracker issue, where `<prefix>` is
`tracker.issuePrefix`; `BREAKING CHANGE:` where it applies.
Nothing else. Never an AI-attribution trailer.

## Types

| Type       | When to use                       | Example                                              |
| ---------- | --------------------------------- | ---------------------------------------------------- |
| `feat`     | New user-visible capability       | `feat(admin): let editors bulk-restore items`        |
| `fix`      | Corrects broken behavior          | `fix(api): reject a publish date in the past`        |
| `refactor` | Restructure, no behavior change   | `refactor(admin): move the status chip into shared`  |
| `perf`     | Same behavior, measurably faster  | `perf(api): batch tag counts into one query`         |
| `docs`     | Documentation only                | `docs(rules): document the extraction threshold`     |
| `test`     | Tests only                        | `test(domain): cover the slug validator`             |
| `chore`    | Maintenance, dependency bumps     | `chore(deps): upgrade the ORM to its next minor`     |
| `ci`       | CI/CD configuration               | `ci: cache the package store between runs`           |
| `build`    | Build system, monorepo, tsconfig  | `build(tooling): add a shared bundler preset`        |
| `style`    | Formatting only, no logic change  | `style: sort every import block`                     |
| `revert`   | Reverts a prior commit            | `revert: feat(admin): bulk-restore items`            |

`refactor` and `perf` both promise no behavior change — if behavior shifts at all, even
in an edge case, it's a `feat` or a `fix`. `perf` should carry a number in the body.

## Scopes

Lowercase, named for the workspace the change lands in. Use the most specific scope that
covers the whole commit. **The scope list is `commits.scopes` in `.claude/sdlc.json`** —
each key is a scope, its value what the scope covers. The skill injects that file; do not
copy the table here.

Omit the scope only when the change is genuinely repo-wide (`style:`, `ci:`). Don't
invent a scope for one file — widen to its workspace.

A commit spanning several workspaces usually wants splitting. When it genuinely can't be
split — a contract change and the consumers that won't typecheck without it — scope it
where the change originates, normally the shared or domain package.

**Be consistent** — use the same scope for related changes across commits. A series that
drifts between `api` and `db` for the same piece of work is harder to read back than one
that picks one and stays there.

## Breaking changes

```
feat(domain)!: replace the boolean isPublished with a status union

BREAKING CHANGE: posts now carry status: "draft" | "scheduled" |
"published" instead of isPublished. Existing rows need the migration in
this commit to backfill status before the API will accept them.

The boolean couldn't express a scheduled item, which the publish job
needs to distinguish from a draft.
```

- Add `!` after `type(scope)` to flag the breaking change in the subject line
- Add a `BREAKING CHANGE:` footer carrying the migration guidance — what breaks, and
  what a consumer has to do about it

## Grouping principles

Apply in order when splitting changes into commits:

1. **One concern per commit** — describable in a single sentence without "and"
2. **Layer separation** — domain, backend, and frontend go in separate commits where
   they're independent. Where they aren't, keep them together: a commit that doesn't
   typecheck on its own is worse than a broad one
3. **Tests travel with their implementation** — never split a feature from its tests
4. **Dependency order** — if commit B imports from commit A, A comes first
5. **Config and docs last** — dependency bumps and documentation after functional code

## Examples

**A feature, scoped to one app:**

```
feat(admin): let editors bulk-restore soft-deleted items

The items list could restore one item at a time from its row menu, so
recovering from an accidental multi-select delete meant clicking through
every row.

Selection state already existed for the delete action, so restore reuses
it and posts one request per selected id rather than a new bulk endpoint —
the operation is rare and the round trips are cheap. A bulk contract
procedure is the right call if it ever runs on hundreds of rows.

Refs: <prefix>-XX
```

**A fix, where the root cause is the interesting part:**

```
fix(api): reject a publish date more than a year out

createItem accepted any future timestamp, so a typo in the year field
scheduled an item past the point the publish job would realistically ever
reach, with no feedback to the editor.

Validation lands in the shared schema rather than the service, so the
admin form and the API reject it identically instead of the browser accepting
what the server later refuses.

Refs: <prefix>-XX
```

**A refactor, promising no behavior change:**

```
refactor(admin): move the item status chip into shared

Three tables rendered their own status chip with the same colour map
copied into each. Promoted one component to the shared layer and deleted the
copies.

Rendered markup is identical — the only change is where the colour map
lives.
```

A breaking change is shown under [Breaking changes](#breaking-changes) above.
