# Rule gaps

Candidate rules, raised by review and not yet decided.

Every reviewer can emit a gap finding — `rule gap`, `practice gap`, `invariant gap`,
`exposure gap`, depending on the lane. They all mean the same thing: **the code is
reasonable and no rule covers it.** A gap is not a defect, never blocks, and no reviewer
is allowed to act on one, because changing the rules is the repo owner's call
(`REVIEW.md` in the klein-sdlc plugin § What blocks, by default).

That prohibition is right, and until this file existed it was also where the loop ended.
A gap landed in a chat report, no reviewer had a write tool, and nothing aggregated it —
so the same gap raised twice, three months apart, was two forgotten sentences rather than
one recurring signal. This file is the durable half.

**It is deliberately manual bookkeeping**, and it is kept small enough to survive being
manual. No tooling for this exists anywhere — a search across both academic and commercial
work came back empty, and the nearest things classify individual comment usefulness or
feed a bot's prompt memory without emitting any durable artefact.

## How an entry graduates

On two axes, and **neither of them is how many times the comment was made**:

1. **How often the pattern occurs in the code.** A pattern appearing twice is not worth a
   rule; one appearing in forty files is.
2. **How often the check would be wrong.** A check that cannot be almost always right does
   not belong in a gate, whatever it would catch when it is right.

"Said twice in review, therefore make it a rule" is folklore — it appears in none of the
source material it is usually attributed to. **The ledger records occurrences of the
pattern, not repetitions of the comment.** The `Raised` field exists so recurrence is
visible, not so it can be counted into a threshold.

A gap that clears both axes goes one of two ways: into `rules/` or `practices/` as a
written rule, or onto the promotion ladder as a lint rule — a built-in with configuration,
then a syntax-selector restriction, then a glob-based filename rule, then a custom rule,
ascending in cost.

## The `Occurrences` field is a command, not a number

**Record the grep, and the count on the day it last ran.** Not the count alone.

This is the one rule about this file that is load-bearing. A frozen count rots — the repo this
was extracted from once spent a whole task removing stale counts from two reviewers, and a
ledger of frozen numbers reproduces that failure in a file whose entire value is that the
numbers are current when someone judges a graduation. Storing the command makes the
number cheap to refresh and impossible to quietly go wrong.

## Entry format

````markdown
### G<n> — <the pattern, stated as what the code does>

**Status:** open | graduated → `<where>` | rejected → `<why>`

**Pattern.** What the code does, in a sentence. Never the reviewer's wording — this is the
identity key, and a gap raised again has to collide with it rather than open a second entry.

**Occurrences.**

```bash
<a command that counts them>
```

<count> as of <date>.

**Check.** Which rung of the promotion ladder could express it, and where it would misfire.
"Not mechanically checkable" is a valid and useful answer — say why.

**Raised.** <date>, `<lane>`, on <branch or PR>. One line appended per raising.
````

Numbering is `G1`, `G2`, … in the order entries are opened, and a number is never reused.

**Graduated and rejected entries stay in the file.** "We looked at this and said no" is
what stops a gap being re-raised forever, and it is only worth anything if it is still
readable a year later. A rejected entry keeps its `Raised` history.

## Who writes here

The `full-review` skill, as its last step, after the report has been delivered
(the `full-review` skill § 9). The reviewers
cannot — they hold `Read, Grep, Glob, Bash` and no write tool, which is deliberate.

A gap the verifier **refuted** is not logged. A gap it could not reach —
`unsubstantiated` — is, and says so in its `Raised` line.

---

## Ledger

_No entries yet._
