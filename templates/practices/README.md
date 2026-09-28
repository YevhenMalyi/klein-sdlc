# Framework practices

Copy to `.claude/docs/practices/README.md`. How to use the **libraries** this repo pins,
at the versions it pins them. This corpus answers "is this how the library is meant to be
used"; [`../rules/`](../rules/README.md) answers "does this fit our architecture", and
where they overlap the rules win.

| Library    | File                         | Read from version |
| ---------- | ---------------------------- | ----------------- |
| `<lib>`    | [`<lib>.md`](./<lib>.md)     | `<x.y>`           |

## What lint already enforces — do not re-review it

**The review lanes read this section by name.** `REVIEW.md` § Skip paths points here as
the authoritative list of what formatting, lint and typecheck already catch; a lane
reports nothing on it, and a finding on this list that slipped through is a gap in the
lint config, not a code finding.

List each class with the rule or compiler option that catches it:

- <class of defect> — `<lint rule or tsconfig flag>`

## Every file ends with a Review checklist

Greppable, one line per failure shape, phrased as what the code does. The practices lanes
work each loaded checklist after running their catalogue's greps.
`templates/practices/practice.md` in the plugin is the skeleton.

## Staleness

Each file states the version it was read from. Widely-repeated advice is often for the
previous major and is wrong here; the file is the authority. A practice file that
contradicts current upstream docs is a bug in the file — a lane reports it that way, with
the upstream link, rather than enforcing it.
