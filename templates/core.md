# Core rules

Copy to `.claude/rules/core.md` in the host. It is always in context, so it stays small:
a routing table to the rules corpus, the manifest paragraph the `klein-sdlc` skills rely
on, and only the invariants that break *silently*, where knowing the rule late is too late.

**This file is not the rulebook.** Everything normative lives in `.claude/docs/rules/` and
`.claude/docs/practices/`. **Read the file matching what you are about to touch, before
writing.** Don't work from memory or from general framework knowledge: this repo deviates
from the canonical conventions deliberately, and the deviations are the point. Where the
two corpora overlap, `docs/rules/` wins — it is the owner's decision; `docs/practices/`
tracks upstream and goes stale on a major version bump.

| Touching                          | Read                                                                 |
| --------------------------------- | -------------------------------------------------------------------- |
| `<path or kind of file>`          | [`<rule>.md`](../docs/rules/<rule>.md)                               |
| `<path or kind of file>`          | [`<rule>.md`](../docs/rules/<rule>.md) + [`<lib>.md`](../docs/practices/<lib>.md) |
| Designing a unit: a function, hook, props type, payload | [`design.md`](../docs/rules/design.md)         |
| Any test file                     | [`testing.md`](../docs/rules/testing.md)                             |

This table is the one copy of the path → file mapping. The conformance lanes and
`implement-ticket` read it; do not duplicate it elsewhere.

Reviewing a diff: `/klein-sdlc:full-review`, whose contract is `REVIEW.md` in the
`klein-sdlc` plugin. The lanes it runs are this repo's: `review.lanes` in `../sdlc.json`
names them, their agent files are `../agents/`, and what each looks for **in this repo** is
`../docs/review/`. A new lane is `/klein-sdlc:implement-reviewer`.

**Project names live in [`../sdlc.json`](../sdlc.json)** — the tracker's team, project,
issue prefix, states and labels; the forge's owner, repo, base branch, branch pattern and
scope labels; the verification gates; the commit scopes; the paths of the instance docs;
the review lanes, their catalogues and triggers. A workflow skill injects that file at load time and names a value by its path
(`tracker.states.inReview`) rather than quoting it. Change the value there, never in a
skill.

## The invariants that fail silently

Only the rules whose violation compiles, lints and typechecks clean and is still wrong.
One line each, with the file that carries the full rule. Everything else belongs in that
file, not here.

- **<invariant>** — <one sentence on what breaks>. Full rule: `docs/rules/<rule>.md § <section>`.
