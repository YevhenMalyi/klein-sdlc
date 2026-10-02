# Security catalogue

Copy to `<docs.reviewCatalogues>/security.md`, the catalogue of a lane whose manifest
entry says `"trigger": "catalogue"`. `security-reviewer` fires only when the diff touches
a path listed below, asks one question — can an attacker or the wrong role reach
something — and works the entries. `full-review` reads the trigger list from here rather
than keeping a copy. Any lane on a narrow surface uses this shape.

## Trigger paths

**Specific files and narrow globs, not whole trees.** Narrowness is what keeps this lane
worth reading: volume stays low, so its findings keep their credibility. A diff touching
one row does not license reviewing the others.

| Path                 | Why it is on the surface                        |
| -------------------- | ----------------------------------------------- |
| `<file or glob>`     | <what an attacker reaches through it>           |

## Deliberate arrangements — open the doc before reporting

Arrangements that read as holes to a general security instinct and are deliberate, each as
a pointer to the doc that says why. Never the current state of the code as a standing
fact. Reporting one of these as a hole is how a specialist lane loses its audience in one
review.

- <arrangement> — `docs/rules/<file>.md § <section>`

## Entries

One per failure shape. Each states **who reaches what** — the role or unauthenticated
caller, the asset, the conditions — cites the doc that carries the rule, and usually names
a reference implementation to compare against.

### <Failure shape>

**Who reaches what.** <caller> reaches <asset> when <condition>.
**Rule.** `docs/rules/<file>.md § <section>`.
**Reference.** `<path to the implementation that does it right>`.
```bash
<grep>
```

An overlap with another lane can be deliberate — an authorization check enforced at the
edge and not in the service belongs on this catalogue and on an invariants lane's. Say so
here, and in the other catalogue: when both report it, that is the signal working, not a
duplicate to dedupe.
