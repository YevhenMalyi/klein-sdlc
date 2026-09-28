# Notices

This plugin is MIT-licensed (see `LICENSE`). Two parts of it were adapted from other
MIT-licensed work; the mechanic carried over, the question agenda and every tracker and
forge detail are this plugin's.

- **The interview loop** in `write-spec` and `report-bug` — a design tree worked in rounds,
  asking the whole answerable frontier at once with a recommendation attached to each
  question — and the vertical-slicing and quiz-before-publish steps of `spec-to-stories`,
  are adapted from [`mattpocock/skills`](https://github.com/mattpocock/skills) (MIT): the
  `grilling` primitive and `to-tickets`.
- **`craft-commits` and `commit-and-pr`** were adapted from a pair written for another
  repository; the git mechanics carried over, everything project-specific was rewritten.

The plugin was extracted from the Claude Code setup of a private project in September
2026. The reasoning behind its shape is rewritten for the plugin in `docs/design-notes.md`.
