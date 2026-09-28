# Correctness catalogue

Read by `correctness-reviewer`.

## Deliberate arrangements

None yet.

## Entries

**A filter predicate the schema makes always true.** `src/domain/category.ts` declares
`publishedPostCount` as an integer that is never negative. A filter comparing it with `>= 0`
keeps every row; the comment above such a filter usually says otherwise. Rule:
`docs/rules/data-loading.md § Rules 3`.

```bash
grep -rn "publishedPostCount >= 0" src
```

**A loader waterfall.** Rule: `docs/rules/data-loading.md § Rules 1`.

```bash
grep -c "await " src/pages/**/*.server.ts
```
