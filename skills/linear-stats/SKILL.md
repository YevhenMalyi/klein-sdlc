---
name: linear-stats
description: >-
  Shows Linear ticket counts by status for a build project (default: the manifest's
  `tracker.project`), as one
  table. Use when the user asks "how many tickets are left", "where does the board stand",
  "ticket counts", "show me the stats", or invokes /klein-sdlc:linear-stats. Read-only: it prints the
  table and stops.
allowed-tools: Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/linear-stats.mjs*)
argument-hint: [project name]
---

!`node ${CLAUDE_PLUGIN_ROOT}/scripts/linear-stats.mjs $ARGUMENTS`

Show the table above to the user as-is. Do not re-fetch or re-derive it via other tools.

With no argument the script reads the project from `tracker.project` in
`.claude/sdlc.json`. It needs `LINEAR_API_KEY` — the same requirement as `whats-next`'s script. It goes
through the GraphQL API rather than the Linear MCP so it runs as a plain script without a
live MCP session.
