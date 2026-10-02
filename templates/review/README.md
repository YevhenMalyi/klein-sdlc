# Review catalogues

What each review lane checks **in this repo**, one file per lane. The lane's agent file
in `.claude/agents/` says what the lane owns, how it proceeds, and how it grades a
finding; that part would be the same in any repo with that lane. The catalogue here is the
part that is not: the invariants of this architecture, the paths that make up its auth
surface, the greps that find its failure shapes, the exceptions its rules sanction, and
the arrangements that look wrong to a general instinct but are deliberate.

The lanes, their catalogues and their triggers are `review.lanes` in `.claude/sdlc.json`;
this table mirrors it for a reader.

| Lane                   | Catalogue                          | Trigger             |
| ---------------------- | ---------------------------------- | ------------------- |
| `<name>-reviewer`      | [`<name>.md`](./<name>.md)         | always / paths / catalogue |

`lane.md` and `security.md` in the plugin's `templates/review/` are the skeletons, and
`implement-reviewer` writes a lane's agent, catalogue and manifest entry together.

A lane reads its catalogue first, every run. The catalogue is not a second rulebook: every
entry cites the rule or practice file that carries it, and a finding is reported against
that file, not against this one. What this corpus adds is the **search**: where in this
codebase the rule is most likely to be broken, what a hit looks like, and what a hit that is
not a finding looks like.

## What a catalogue holds

- **Trigger paths**, where the lane fires on a path list rather than on any diff.
- **Entries**: one per failure shape the lane hunts. Each names what breaks and cites the
  rule, and most carry a grep. An entry states a failure, not a smell.
- **Sanctioned forms**: what the greps hit that is *not* a finding.
- **Deliberate arrangements**: choices that read as wrong to a general instinct and are
  not, each with the doc that says why. A lane opens that doc before reporting.

## What a catalogue does not hold

**The current state of the code, recorded as a standing fact.** "The error handler is
already mounted", "the compiler is enabled", "a backlog of N remains" — every such line is
right on the day it is written and wrong on some later day nobody notices, and a lane that
trusts it then reports the code against a description of the code. The lanes this plugin
was extracted from carried blocks like this, one of which had been stale for a week. A deliberate
arrangement is recorded as a pointer to the doc that mandates it, and the lane checks the
code against the doc each time.

**A rule.** Rules are [`../rules/`](../rules/README.md) and [`../practices/`](../practices/README.md).
When a catalogue entry and a rule file disagree, the rule file wins and the entry is a bug.

## Keeping it current

A catalogue changes when the architecture does: a new invariant, a new path on the auth
surface, a grep that no longer matches the shape it hunts. A `rule gap` that graduates into
a rule usually earns a catalogue entry in the same change, so the lane that raised it can
find the next instance.
