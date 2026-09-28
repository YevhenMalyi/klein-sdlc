# Rule: Design and responsibility

Copy to `.claude/docs/rules/design.md`. `design-reviewer` reads this file in full, every
run, and works from it rather than from general SOLID knowledge. Three sections are
required, in this order.

## What the structure rules already decide — do not re-review it

The list that keeps the design lane signal-dense. Everything here is
`structure-reviewer`'s: placement, naming, import direction, barrels, file layout. Name
each with the rule file that owns it, so a design finding on one of them is recognised as
another lane's and dropped.

- <placement decision> — `<rule>.md`
- <naming decision> — `<rule>.md`

## Rules

Numbered, operational, and each defines a `defect` as something checkable rather than as
taste. A rule here says what a caller must not be forced to know or supply, and what two
reasons to change look like inside one unit.

1. **<rule>.** <what must hold>. Exception: <when it does not apply>.

## Judgment

Findings here are judgment calls, not conformance checks, and that changes how they must
be written and how readily they are filed.

- **Cite the scenario, not the letter.** Every finding names the change that would hurt.
  "This violates SRP" is not a finding; "<two named concerns> now change the same
  function" is.
- **Two reasons that are one concept are one reason.**
- **Cohesion outranks splitting.** If the split makes every change a three-file edit, it is
  wrong; name the slice or placement rule that says so.
- **Size alone is not a finding.**
- **A seam with no second implementation and no test that needs it is speculative**, and
  the finding runs the other way.
- **False positives are worse than a missed finding.** When unsure, report `drift` rather
  than `defect`, or say nothing.

## Review checklist

- [ ] An exported function or hook whose name joins two jobs
- [ ] A boolean parameter selecting which of two jobs a function performs
- [ ] A function whose halves share no value and touch disjoint state
- [ ] A new caller adding a branch to an existing `if` instead of passing what differs
- [ ] A helper or component taking a whole entity to read one or two fields
- [ ] A parameter or props type where a call site must pass nothing for half the fields
- [ ] <the shapes this codebase actually produces>
