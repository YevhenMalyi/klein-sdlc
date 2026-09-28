# Frontend practices catalogue

Read by `frontend-practices-reviewer`.

## Scope

`src/**`.

## What lint already rules out

Nothing. This fixture has no lint.

## Which practice file the diff needs

There are no practice files; report against `docs/rules/data-loading.md` where it carries
the finding, or raise a `practice gap`.

## High-value greps

```bash
# wall-clock reads in a render body — data-loading.md § Rules 2
grep -rnE "new Date\(|Date\.now\(" src --include=*.tsx
```

## Sanctioned forms

A `new Date()` inside a `loader` export is the sanctioned shape.
