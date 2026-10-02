---
name: full-review
description: >-
  Runs every review lane the host's manifest declares — each a subagent in the host's
  `.claude/agents/`, triggered always, by the manifest's path list, or by the trigger
  list in its catalogue — in parallel against a diff, branch, or PR; verifies each
  finding in fresh context; merges what survives into one report. Use whenever the user
  wants a full review of a diff/branch/PR, asks "does this follow our structure,
  practices, and design", or wants the change checked against the repo's written rules
  before opening or merging a PR. Prefer it over running the reviewers one at a time
  whenever more than one plausibly applies.
---

# Full review

The host's review lanes review the same diff in parallel, each against its own slice of
the rules corpus. Which lanes exist is the manifest's `review.lanes`, below: one entry per
lane naming the agent to spawn, its catalogue, and its trigger. The plugin ships one lane,
`klein-sdlc:basic-reviewer`; a host usually declares several of its own, cut from it by
`implement-reviewer`.

**The declared lanes are the whole review** — nothing is delegated outside them. Running
one on its own is fine for a narrow question; most diffs touch several lanes, and reviewing
them serially costs N times the wall-clock since none reads another's output.

This skill does four things the lanes cannot do for themselves: resolve the target once,
verify every finding in fresh context, merge what survives, and persist gap findings to the
ledger. Rationale: [`design-notes.md`](${CLAUDE_PLUGIN_ROOT}/docs/design-notes.md).

The project manifest — `gates`, `docs.reviewCatalogues` and `review.lanes` below name
values in it:

!`cat .claude/sdlc.json`

## 0. Read the review contract

[`REVIEW.md`](${CLAUDE_PLUGIN_ROOT}/REVIEW.md) is what the lanes report against — the blocking bit, the
evidence bar, the skip paths, the file-scope rule, the lane procedure, what a verdict does
to a finding, and the convergence rule. Read it before spawning anything.

Each lane holds it too — its agent file preloads the `review-contract` skill — so **do not
restate its contents in their prompts**; the lane has the current version.

## 1. Resolve the target once

Make one directory for the run and keep everything in it:

```bash
RUN=$(mktemp -d)   # or the session scratchpad, if this session has one
```

**Never inside the repository.** A run directory under the working tree shows up as
untracked files, lands in the next `git status` the lanes read, and can be swept into a
commit. `mktemp -d` and the scratchpad are both outside it; nothing else is acceptable.

- **No target named** → the working tree against the merge base:
  `git diff <forge.baseBranch>...HEAD` plus `git diff HEAD` for anything uncommitted. If both are empty, say so and stop — don't
  invent a diff, and don't spawn anything.
- **A branch, commit range, or path named** → resolve it to a concrete `git diff` yourself.
- **A PR named** → get its diff (`gh pr diff <n>`, or the GitHub MCP) rather than guessing
  from the number.

Either way, produce the same two artefacts:

```bash
git diff <resolved target> > "$RUN/diff.patch"
git diff --stat <resolved target> | tee "$RUN/changed-paths.txt"
```

Pinning the diff to a file is what makes every lane review the same thing even if the
working tree moves mid-review.

## 2. Run lint and typecheck once

Run the lint and typecheck commands from `gates` — the ones whose output a lane reads —
each into its own file under `$RUN`, and note each exit status. Unfiltered: one repo-wide
run is cheaper than one per workspace, and between them the lanes cover everything.
Sequential, not `&&`: a failing lint must not skip the typecheck.

## 3. Decide which lanes apply

Walk `review.lanes` in order. For each entry:

| `trigger`                  | The lane runs when...                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------- |
| `"always"`                 | there is a diff at all — these lanes cover shared packages, tooling and config as much as the apps      |
| a list of path prefixes    | any changed path starts with one of them                                                                |
| `"catalogue"`              | any changed path matches the **trigger list the catalogue itself carries** (its `§ Trigger paths`)      |

Then **check the catalogue exists** — `docs.reviewCatalogues` joined with the entry's
`catalogue`. A lane whose catalogue is missing is not spawned, unless the entry says
`"optionalCatalogue": true`, in which case the lane runs and its agent file says how it
degrades (`REVIEW.md` § Without a rules corpus). Say in the opening line which lanes were
skipped for a missing catalogue, and point at `implement-reviewer`, which writes the agent
and the catalogue together.

Several entries can match. Only the always-on lanes running is normal too — a diff
confined to tooling, `.claude/` or root config is a complete review, not a partial one.
Don't spawn a path-triggered lane against paths it would immediately rule out of scope.

**A `"catalogue"` trigger is a list of specific files and narrow globs**, not an area
match. The list lives in the catalogue and is canonical — **read it there rather than
keeping a copy here.** Don't widen it to "anything in the area": narrowness is what keeps a
specialist lane worth reading.

## 4. Spawn every applicable lane in parallel

One message, one `Agent` call per lane, each with `subagent_type` set to the entry's
`agent` exactly as written — a bare name for a host agent in `.claude/agents/`, a
plugin-qualified one such as `klein-sdlc:basic-reviewer` where the manifest says so. They
start with no memory of this conversation, so each prompt needs to be self-contained:

- **State the exact target** resolved in step 1.
- **Name the lane's catalogue path**, so the agent does not have to find its own manifest
  entry.
- **Give the three paths** — `$RUN/diff.patch`, `$RUN/lint.txt`, `$RUN/typecheck.txt` — with
  each gate's exit status in the prompt itself ("lint: clean", or "lint: 3 errors, full
  output at …"). Say explicitly that the diff is resolved and the gates already ran, so the
  lane reads those files rather than running anything. It still opens the working tree for
  the whole of a changed file: the diff file replaces deriving the diff, not reading code.
- **Tell it to run its own normal procedure** — don't restate its rules, that risks going
  stale against the file it owns.
- **Ask for its report in the format its own instructions specify.** The merge in step 7 is
  what normalizes across reports.

## 5. Wait for all of them

Don't synthesize from a partial set. A lane you did not spawn is expected (step 3); a lane
you spawned that errors out — including an `agent` name the Agent tool does not know,
which means the host's `.claude/agents/` and its manifest disagree — gets said so in the
final report, not silently dropped.

## 6. Verify every finding before reporting it

Spawn `finding-verifier` — `subagent_type: klein-sdlc:finding-verifier` — **one per finding**, in
parallel. The verifier gets the claim and the artefact, and nothing that argues for either:

| Pass                                                  | Withhold                                             |
| ------------------------------------------------------ | ---------------------------------------------------- |
| the `file:line`                                       | the reviewer's reasoning or explanation              |
| the tier and the blocking bit                         | the reviewer's suggested fix                         |
| the rule or practice cited, by file and section       | this prompt, the ticket, the branch's purpose        |
| one or two sentences: what the code does, what breaks | the other findings, and the other lanes' reports     |
| `$RUN/diff.patch`, and the gate outputs if relevant   | which lane produced it, where it can be dropped      |

The withheld column **is** the stage — passing the reasoning along to save the verifier time
converts it into the condition measured worst (`design-notes.md` § Verification is blind,
single-pass, and biased against the finding).

**Which findings.** Every `(blocking)` finding, always. Verify the advisory ones too while
the whole set fits in ten spawns; past that, verify the blocking ones and say in the report
how many advisory findings went unverified.

| Verdict           | What you do with it                                                   |
| ----------------- | ----------------------------------------------------------------------- |
| `confirmed`       | Report it as the reviewer wrote it, at its original bit               |
| `refuted`         | Drop it, and count it in the roll-up's suppressed line                |
| `unsubstantiated` | Report it, marked **unverified**, demoted to `(non-blocking)`         |

**Do not run a second verification pass**, and do not hand a refuted finding back to its
reviewer to argue.

## 7. Merge into one report

Each lane has its own severity vocabulary. Don't force them onto one scale — a structural
`drift` and a design `drift` aren't the same claim.

1. **Report each lane's findings under its own heading, in manifest order.** The host put
   the lanes whose findings are things that are broken — reachability, wrongness — ahead of
   the conformance ones for that reason. Preserve each finding's original file:line,
   citation, scenario and fix.
2. **Call out overlaps explicitly.** Two lanes on one file:line is a stronger signal than
   either alone — name it as such rather than leaving two bullets the reader must connect,
   and don't discard either. A catalogue that says an overlap with another lane is
   deliberate means a double report is the signal working, not a duplicate to dedupe.
3. **Roll up one combined verdict line**, leading with the blocking count across all lanes —
   that is the number the reader acts on, and it is never folded into a tier total. Then the
   most-severe-tier totals with a per-lane breakdown, then the rest.

   Give the gap tiers their own line rather than burying them in "the rest": they are the
   only signal the rules corpus has a hole.

   **Report what verification did** in one line: how many findings verified, how many
   refuted and dropped, how many survived unsubstantiated. A refuted finding that vanishes
   without a count is indistinguishable from a lane that missed it.

   A diff clean across every lane that ran says so in one sentence.

## 8. On a re-review, report blocking findings only

If this branch has already been reviewed — by an earlier run in this session, or by one the
caller names — `REVIEW.md` § Re-review convergence applies: **report `(blocking)` findings
only, and suppress new advisory ones.** Say in one line that convergence is in effect and
how many advisory findings were suppressed.

Convergence narrows step 6: verify the blocking findings and skip the advisory ones you are
about to suppress. It is per branch, not per session. When in doubt whether a branch has
been reviewed before, ask — suppressing findings on a first pass is the worse error.

Skip a lane's section header entirely if it wasn't spawned; the opening line already
explains it ("3 of 5 lanes ran: structure, design, correctness — no path in the
backend-practices list changed; security's trigger list untouched").

## 9. Append any gap findings to the ledger

**After the report is delivered, not before** — a failed write must not swallow a finished
review. No lane holds a write tool, so this step is the only thing that persists a gap.

Append to [`rule-gaps.md`](.claude/docs/rule-gaps.md), which carries the entry format and the
graduation criteria. Read it first — three things are easy to get wrong from memory:

- **`Occurrences` is a command plus a dated count, never a bare number.** A frozen count
  rots, and the ledger's whole value is that its numbers are current when someone judges a
  graduation.
- **The `Pattern` line is the identity key.** State what the code does, not how the reviewer
  worded it. A gap already in the ledger gets **a new `Raised` line on the existing entry**,
  not a second entry — that collision is the point of the file.
- **Record what the reviewer said, not your opinion of it.** Graduating a gap is the repo
  owner's call.

| Finding                                                                    | Logged                                           |
| -------------------------------------------------------------------------- | ------------------------------------------------ |
| Any gap tier, verified or unverified                                       | Yes                                              |
| A gap the verifier **refuted**                                             | No                                               |
| A gap the verifier could not reach                                         | Yes, with `unsubstantiated` in its `Raised` line |
| Any non-gap tier                                                           | No — those are the report's job                  |

Say in one line what was appended ("G3 opened; G1 raised again"), or nothing if there were
no gaps. Don't print the ledger back.

## When two lanes disagree

Surface it, don't referee it: present both and say they conflict. Resolving a substantive
disagreement is the repo owner's call. A verifier's verdict is not the referee either — it
settles whether the code supports one finding, not which lane is right about what the code
should be.
