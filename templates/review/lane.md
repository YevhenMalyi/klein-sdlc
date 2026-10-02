# <Lane> catalogue

Copy to `<docs.reviewCatalogues>/<lane>.md`, the file the lane's `review.lanes` entry
names — `implement-reviewer` does this with the agent file. A lane that fires on its
catalogue's own trigger list has its own skeleton, `security.md`, because that list is
canonical. The lane reads this file first, every run. It is the search, not a second
rulebook: every entry cites the rule or practice file the finding is reported against.

Not every section applies to every kind of lane. Which are required:

| Section                                    | placement / conformance | judgment (design) | invariants (correctness) | library idiom (practices) |
| ------------------------------------------ | :---------------------: | :---------------: | :----------------------: | :-----------------------: |
| Scope                                      |                         |                   |                          |             ✓             |
| Gates, scoped to the lane                  |                         |                   |                          |             ✓             |
| What lint and typecheck already rule out   |            ✓            |                   |                          |             ✓             |
| Which rule or practice file the diff needs |                         |         ✓         |                          |             ✓             |
| Entries                                    |                         |                   |            ✓             |                           |
| High-value greps                           |            ✓            |         ✓         |            ✓             |             ✓             |
| Sanctioned forms                           |            ✓            |                   |                          |             ✓             |
| Deliberate arrangements                    |                         |                   |            ✓             |             ✓             |

## Scope

The path prefixes this lane owns in this repo. They match the lane's `trigger` list in
`.claude/sdlc.json` under `review.lanes`; "nothing of mine changed" is a complete answer.

## Gates, scoped to the lane

How to run the lint and typecheck gates for only this lane's workspaces, when the caller
did not already run them.

## What lint and typecheck already rule out

The classes a clean run already catches, so the lane reports nothing on them. Point at
`docs/practices/README.md § What lint already enforces` rather than copying it; add only
what is specific to this lane's surface.

## Which rule or practice file the diff needs

| Changed path | Read |
| ------------ | ---- |
| `<path>`     | `docs/<rules or practices>/<file>.md` |

## Entries

For an invariants lane: one per failure shape, each stating **what breaks**, **the rule
that carries it** (file and section), and usually **a grep**. An entry states a failure,
not a smell — "a second caller of this service bypasses the check the router made",
not "authorization looks inconsistent".

### <Failure shape>

**What breaks.** <for whom, under what conditions>.
**Rule.** `docs/rules/<file>.md § <section>`.
```bash
<grep>
```

## High-value greps

```bash
# <what it hunts> — docs/rules/<file>.md § <section>
<grep>
```

## Sanctioned forms — not findings

What the greps above hit that the rules explicitly allow, each with the rule line that
allows it.

## Deliberate arrangements — open the doc before reporting

Choices that read as wrong to a general instinct and are not, each as a **pointer to the
doc that mandates it**. Never the current state of the code as a standing fact — "the
error handler is already mounted" is right on the day it is written and wrong on some
later day nobody notices. The lane opens the doc and checks the code against it each time.

- <arrangement> — `docs/rules/<file>.md § <section>`
