# Eval harness

An eval-only wrapper around the plugin, for skills that need the tracker.

`claude plugin eval` loads none of the host's MCP servers and mocks only the servers the
plugin under test declares. klein-sdlc declares none — the host brings its own `linear` —
so a skill that fetches a ticket has no tool to fetch it with inside an eval. This
directory is a plugin of the same name whose skills, agents and docs are copied from the
real ones by `sync.sh` before each run (copies, not symlinks: the eval sandbox refuses
reads that resolve outside the plugin), plus a `.mcp.json` declaring `linear`, which
`evals/mocks/linear/` answers. The real server never starts under the default
`--mocks record`.

Two limits follow from the eval tooling, not from this harness:

- The mocked tools register as `mcp__plugin_klein-sdlc_linear__*`, not `mcp__linear__*`.
  The orchestrator finds them; an agent whose `tools:` lists `mcp__linear__*` — the
  architect, the plan reviewer, the babysitter — cannot. So only paths that reach none of
  those agents are testable here: today, `deliver-ticket`'s `s` profile up to the commit
  stop.
- `/usr/bin/git` (the Xcode shim) is blocked in the sandbox on macOS; runs fall back to
  another git on `PATH`, such as Homebrew's.

It sits outside `evals/` on purpose: the main suite collects every case below `evals/`,
and these cases would fail against the real plugin.

```bash
npm run eval:harness
```

`probe-linear-mock` is a cheap smoke test of the harness itself: run it first after
changing the mocks or the eval tooling.
