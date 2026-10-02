# Review catalogues

What each review lane checks **in this repo**, one file per lane. The lane's agent file
says what the lane owns, how it proceeds, and how it grades a finding; the catalogue here
is the part that is true only of this repo: the greps that find its failure shapes, the
exceptions its rules sanction, and the arrangements that look wrong and are deliberate.

The lanes, their catalogues and their triggers are `review.lanes` in `.claude/sdlc.json`;
this table mirrors it for a reader.

| Lane                         | Catalogue                | Trigger |
| ---------------------------- | ------------------------ | ------- |
| `klein-sdlc:basic-reviewer`  | [`basic.md`](./basic.md) | always  |

This fixture has no lanes of its own yet, so its manifest names the plugin's generic lane
directly. A lane reads its catalogue first, every run. The catalogue is not a second
rulebook: every entry cites the rule file that carries it, and a finding is reported
against that file, not against this one.
