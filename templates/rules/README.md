# Rules — detail

Copy to `.claude/docs/rules/README.md`. Normative rules, scoped by area. **These are rules,
not docs** — they live under `docs/` only because everything in `.claude/rules/` is loaded
into every session's context, and these are not needed until you touch the area they
cover.

- `.claude/rules/core.md` — the always-loaded invariants, plus the path → file table.
  Start there.
- How to use the **libraries** is a separate corpus, [`../practices/`](../practices/README.md).
  These rules answer "does this fit our architecture"; those answer "is this how the
  library is meant to be used". Where they overlap, **these win**.

| Area                                                   | File                         |
| ------------------------------------------------------ | ---------------------------- |
| `<area>`                                               | [`<rule>.md`](./<rule>.md)   |
| Test placement and runner                              | [`testing.md`](./testing.md) |
| Responsibilities, flags, seams — SOLID after the above | [`design.md`](./design.md)   |

## What every rule file carries

The review lanes depend on two things being true of every file here:

- **It ends with a `## Review checklist`**, written to be greppable: one line per failure
  shape, phrased as what the code does. A conformance lane works these in full for each
  file the diff's paths route to. `templates/rules/rule.md` in the plugin is the skeleton.
- **It states its exceptions next to the rule.** A lane applies a rule without its
  exception and reports a false positive, and false positives are what stop review output
  being read.

Two files are read by name:

- **`testing.md`** — where tests live and whether they travel with a feature or land in
  dedicated passes. `implement-ticket` and `commit-and-pr` in the plugin read it to decide
  whether "no new tests" is the right answer, and so does a lane that flags missing tests.
- **`design.md`** — the rulebook of a design lane, if this repo declares one. It needs
  three sections in this order: what the placement rules already decide (so design does
  not re-review it), `## Judgment`, and `## Review checklist`. `templates/rules/design.md`
  is the skeleton.
