# Basic catalogue

Read by the fixture's one lane, `klein-sdlc:basic-reviewer`. The rules are `docs/rules/`;
this file is where in this codebase they are most likely to be broken.

## What lint and typecheck already rule out

Nothing. This fixture has no lint.

## High-value greps

```bash
# wall-clock reads in a render body — data-loading.md § Rules 2
grep -rnE "new Date\(|Date\.now\(" src --include=*.tsx
# a filter predicate the schema makes always true — data-loading.md § Rules 3
grep -rn "publishedPostCount >= 0" src
# a loader waterfall — data-loading.md § Rules 1
grep -c "await " src/pages/**/*.server.ts
```

## Sanctioned forms — not findings

- A `new Date()` inside a `loader` export is the sanctioned shape
  (`data-loading.md § Rules 2`: resolve the instant in the loader).

## Deliberate arrangements — open the doc before reporting

None yet.
