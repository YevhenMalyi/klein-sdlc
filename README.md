# klein-sdlc

A Claude Code plugin that carries a software delivery method: interview a spec, refine it,
slice it into stories, pick the next work, implement a ticket, craft commits, open a PR,
and review a diff through parallel specialist lanes whose every finding is verified in
fresh context before it is reported.

The plugin holds the **method**. The host repository holds everything that is true only of
that repository: its architecture rules, its library practices, the review lanes
themselves — one subagent each, cut from the plugin's `basic-reviewer` — with a catalogue
per lane saying where in that codebase each rule tends to break, and one manifest naming
its tracker, forge, gates and lanes. The seam between the two is deliberate, and it is the
reason the plugin can be reused.

## What is in it

| Piece                                     | Purpose                                                                                        |
| :---------------------------------------- | :--------------------------------------------------------------------------------------------- |
| `skills/write-spec`                       | Interview the user as a client, publish a `Spec:` document to the tracker                      |
| `skills/refine-spec`                      | Review a spec against UX practice, patch the accepted findings back                            |
| `skills/spec-to-stories`                  | Turn a spec into stories, and one story into tasks, as tracker issues                          |
| `skills/report-bug`                       | File a bug as a top-level issue, then optionally diagnose it                                   |
| `skills/whats-next`                       | Read the board and the open PRs, propose the next coherent batch of work                       |
| `skills/implement-ticket`                 | Pick up a ticket by number and implement it on the base branch, without branching             |
| `skills/craft-commits`                    | Regroup branch changes into conventional commits, one concern per commit                       |
| `skills/commit-and-pr`                    | Branch, verify, commit, push, open a PR with tracker wiring and labels                         |
| `skills/full-review`                      | Run the host's review lanes in parallel, verify every finding, merge one report, log the gaps  |
| `skills/implement-reviewer`               | Add a review lane to the host: agent, catalogue and manifest entry, cut from `basic-reviewer` |
| `skills/review-contract`                  | `REVIEW.md` as a skill, so a host's lane preloads the contract from the plugin                 |
| `skills/linear-stats`                     | Print the board's ticket counts by status                                                      |
| `skills/onboarding`                       | Tour the setup and the planning workflow, then walk a newcomer through a first ticket for real |
| `agents/basic-reviewer`                   | The one lane the plugin ships: rules conformance plus ordinary bugs, and the boilerplate every host lane is cut from |
| `agents/finding-verifier`                 | One finding in, one verdict out, in fresh context                                              |
| `agents/manual-qa-engineer`               | Drives the running app in a browser and reports what is broken                                 |
| `REVIEW.md`                               | The review contract: the blocking bit, the evidence bar, the lane procedure, verification      |
| `TRACKING.md`                             | The tracking contract: specs, stories, tasks and bugs, and what a priority ranks               |
| `schema/sdlc.schema.json`                 | The shape of the host's `.claude/sdlc.json`                                                    |
| `templates/`                              | Skeletons for everything the host provides: manifest, MCP servers, core rules, rule and practice files, lane catalogues, ledger, QA, house rules — and the spec template `write-spec` uses. The lane agent skeleton is `agents/basic-reviewer.md` itself |
| `docs/design-notes.md`                    | Why it is shaped this way, and what was rejected                                               |

The intended path from idea to merged PR: `write-spec` → `refine-spec` → `spec-to-stories`
→ `whats-next` → `implement-ticket` → `full-review` → `commit-and-pr`, with `report-bug`
as the other way onto the board and `implement-reviewer` for growing the review itself.

## What the host provides

Read relative to the working directory, so they live in the host repo:

- **`.claude/sdlc.json`** — the manifest. Tracker team, project, issue prefix, states and
  labels; forge owner, repo, base branch, branch pattern and scope labels; the verification
  gates; the commit scopes; the review lanes — each entry an agent, a catalogue and a
  trigger, in spawn order. Validated by `schema/sdlc.schema.json`. Every skill injects it
  at load time and names a value by its path (`tracker.states.inReview`) rather than
  quoting it.
- **`.claude/agents/<lane>.md`** — the review lanes, one subagent each, named by the
  manifest. Each is `agents/basic-reviewer.md` narrowed to one question, and preloads
  `klein-sdlc:review-contract` so it starts with `REVIEW.md` in context.
  `implement-reviewer` writes one. Until a host has any, its manifest can name
  `klein-sdlc:basic-reviewer` directly and run the generic lane.
- **`.claude/docs/rules/`** and **`.claude/docs/practices/`** — the normative corpora
  findings are reported against. The plugin ships no rules, and no fallback: a lane whose
  corpus is missing says so and stops (`REVIEW.md` § Without a rules corpus). The lanes do
  depend on the corpus having a shape — every rule and practice file ends with a
  `## Review checklist`, the practices README has a `§ What lint already enforces`
  section, `design.md` and `testing.md` exist under those names — and `templates/rules/`
  and `templates/practices/` are those shapes.
- **`docs.reviewCatalogues`** — one catalogue per review lane, the file its manifest
  entry names: the invariants, the trigger paths of a narrow-surface lane, the greps, the
  sanctioned forms, and the arrangements that read as wrong and are deliberate.
  `templates/review/README.md` says what a catalogue holds and, more importantly, what it
  must not.
- **`.claude/docs/rule-gaps.md`** — the ledger `full-review` appends gap findings to.
  `templates/rule-gaps.md` is its header.
- **The QA catalogue** at `docs.qa` — which apps run where, how to sign in as each role
  locally, which failures are blocked rather than defects. `manual-qa-engineer` stops
  without it. `templates/qa-catalogue.md` is the shape.
- **The UX house rules** at `docs.uxHouseRules` — the product's audiences and the rules
  that take sides for each. `refine-spec` and `manual-qa-engineer` read them after the
  plugin's product-agnostic floor. `templates/ux-house-rules.md` is the shape.
- **`.claude/rules/core.md`** — always-loaded rules: the path → file routing table the
  lanes and `implement-ticket` read, the manifest paragraph, and the invariants that fail
  silently. A plugin cannot ship always-loaded rules; `templates/core.md` is the skeleton.

Optional, because the plugin carries a working default:

- **A spec template** at `docs.specTemplate` — for a host whose specs need different
  sections. Without the key, `write-spec` uses `templates/spec-template.md`.

**Nothing the plugin needs lives in the host's tracker.** The tracker holds specs, stories,
tasks and bugs — the work. How that work is tracked is `TRACKING.md`, and why the plugin is
shaped this way is `docs/design-notes.md`; both ship with the plugin, so anyone who
installed it can read them.

## Requirements

- Three MCP servers connected by the host, **under these exact names**: `linear`,
  `github` and `playwright`. The skills call `mcp__linear__*` and `mcp__github__*`, and
  `manual-qa-engineer` lists `mcp__playwright__*` in its tools, so a server under another
  name is invisible to them. The plugin deliberately bundles none of them: a bundled server's
  tools are namespaced under the plugin, and a host that already runs its own would get
  two. `templates/mcp.json` is the three entries, ready to copy to the host's `.mcp.json`.
  Only Linear and GitHub are implemented as tracker and forge; the manifest's `kind` fields
  are where a second adapter would attach.
- `LINEAR_API_KEY` in the environment for the two board scripts, which go through Linear's
  GraphQL API because the MCP cannot express their filters in one call.
- `gh` authenticated, for the PR half of `whats-next`.

## Running it

Locally, against a host repo, without publishing:

```bash
cd <host-repo>
claude --plugin-dir ../klein-sdlc
```

From the marketplace this repo is:

```bash
claude plugin marketplace add YevhenMalyi/klein-sdlc
claude plugin install klein-sdlc@klein-sdlc
```

Skills are namespaced: `/klein-sdlc:whats-next`, `/klein-sdlc:full-review`. The plugin's
agents likewise: `klein-sdlc:finding-verifier`, `klein-sdlc:basic-reviewer`. A host's own
lanes in `.claude/agents/` keep their bare names, and that is how the manifest names them.

## Evals and tests

Three tiers, cheapest first. `npm install` once for the two free ones.

| Tier | Command | What it proves | Cost |
| :--- | :--- | :--- | :--- |
| Scripts and schema | `npm test` and `npm run test:schema` | The board scripts fail loudly without a manifest or a key; every manifest we ship validates against `schema/sdlc.schema.json` | free |
| Trigger | `npm run eval:trigger` | Each skill fires on a natural prompt for it, no other skill steals the prompt, and three non-workflow prompts fire nothing. One run per case, no baseline arm | about $1 |
| Scenario | `npm run eval:scenario` | `full-review` on a fixture host with two planted defects: the lane the fixture's manifest declares (`klein-sdlc:basic-reviewer`, since an eval loads nothing from the fixture's `.claude/agents/`) and the verifier are spawned by name, both defects are reported as `(blocking)`, and the report accounts for verification | about $1–2 |

Cases live under `evals/`, one directory each: `prompt.md` plus `graders/`, and for the
scenario a `case.yaml`, a `scaffold.sh` that builds the fixture repo in the run directory,
and the fixture itself under `fixture/`. Results land in `evals/results/`, which is ignored.

CI runs the free tier only. The eval tiers spawn real Claude sessions: locally they run
on your subscription through your own login, but in CI the runner accepts only an API key,
billed per token, so they stay local by design. Run the trigger tier after editing any
skill's description, and the scenario tier after touching `full-review`, a lane, the
verifier or `REVIEW.md`. A single failing grader fails the run.

## Releasing a change

An installed copy stays at the version in `.claude-plugin/plugin.json` until that number
changes; `claude plugin update` reports "already at the latest version" otherwise, whatever
`main` holds. So every change that should reach a host ends with a version bump in the same
PR, and hosts pick it up with:

```bash
claude plugin update klein-sdlc@klein-sdlc
```

Patch for a fix inside a skill or agent, minor for a new skill, agent, manifest field or
template, major when a host must change its manifest or catalogues to keep working.

## Adopting it in a new repo

Not automated yet. By hand, from `templates/`:

1. `sdlc.example.json` → `.claude/sdlc.json`, every value replaced. The schema validates it.
2. `core.md` → `.claude/rules/core.md`, with the routing table filled in.
3. `rules/README.md`, `rules/design.md`, and `rules/rule.md` once per area →
   `.claude/docs/rules/`. `practices/README.md` and `practices/practice.md` once per
   library → `.claude/docs/practices/`.
4. `review/README.md` → `.claude/docs/review/README.md`. Then the lanes, one at a time,
   with `/klein-sdlc:implement-reviewer`: it writes the agent into `.claude/agents/`, the
   catalogue from `review/lane.md` or `review/security.md`, and the manifest entry. Start
   with the manifest naming `klein-sdlc:basic-reviewer` on an `"always"` trigger if the
   first real lane is not ready. A lane with no catalogue is skipped, not guessed.
5. `rule-gaps.md`, `qa-catalogue.md` and `ux-house-rules.md` → the paths the manifest names.
6. `mcp.json` → `.mcp.json`, unless the host already runs `linear`, `github` and
   `playwright` under those names.
7. Only if the plugin's spec template does not fit: `spec-template.md` → a path in the host
   repo, edited, and named at `docs.specTemplate`.

In the tracker: the team, the build project, the five states and the five type labels the
manifest names. No documents.
