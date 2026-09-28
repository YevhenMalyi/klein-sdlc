---
name: full-review
description: >-
  Runs structure-reviewer, design-reviewer, correctness-reviewer, whichever practices
  reviewer(s) apply (frontend or backend, by the manifest's `review.lanes` paths), and
  security-reviewer when the diff touches the auth surface, in parallel against a diff,
  branch, or PR; verifies each finding in fresh context; merges what survives into one
  report. Use whenever the user wants a full review of a diff/branch/PR, asks "does this
  follow our structure, practices, and design", or wants the change checked against the
  repo's written rules before opening or merging a PR. Prefer it over running the
  reviewers one at a time whenever more than one plausibly applies.
---

# Full review

Six lanes review the same diff in parallel, each against its own slice of the rules corpus:
`structure-reviewer` (placement, naming, layers, barrels), `design-reviewer`
(responsibilities, seams, flags), `correctness-reviewer` (this repo's invariants, and
ordinary bugs), `frontend-practices-reviewer` (frontend library idiom at the pinned
versions), `backend-practices-reviewer` (backend library idiom likewise), `security-reviewer`
(authentication and authorization, on a listed path set).

**The six lanes are the whole review** — nothing is delegated outside them. Running one on
its own is fine for a narrow question; most diffs touch several lanes, and reviewing them
serially costs six times the wall-clock since none reads another's output.

This skill does four things the lanes cannot do for themselves: resolve the target once,
verify every finding in fresh context, merge what survives, and persist gap findings to the
ledger. Rationale: [`design-notes.md`](${CLAUDE_PLUGIN_ROOT}/docs/design-notes.md).

The project manifest — `gates` and `review.lanes` below name values in it:

!`cat .claude/sdlc.json`

## 0. Read the review contract

[`REVIEW.md`](${CLAUDE_PLUGIN_ROOT}/REVIEW.md) is what the lanes report against — the blocking bit, the
evidence bar, the skip paths, the file-scope rule, the lane procedure, what a verdict does
to a finding, and the convergence rule. Read it before spawning anything.

Each lane reads it too, so **do not restate its contents in their prompts** — name it and
let them read the current version.

## 1. Resolve the target once

Make one directory for the run and keep everything in it:

```bash
RUN=$(mktemp -d)   # or the session scratchpad, if this session has one
```

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

`structure-reviewer` and `design-reviewer` run **unconditionally** whenever there is a diff
— they cover shared packages, tooling and config as much as the apps. The rest are
conditional:

| Changed paths include...                                    | Also run                      |
| ----------------------------------------------------------- | ----------------------------- |
| any path in `review.lanes.correctness`                      | `correctness-reviewer`        |
| any path in `review.lanes.frontendPractices`                | `frontend-practices-reviewer` |
| any path in `review.lanes.backendPractices`                 | `backend-practices-reviewer`  |
| the auth surface — the trigger list in the security catalogue | `security-reviewer`         |

The path lists are the host's, in `.claude/sdlc.json` under `review.lanes`; a lane whose
list is absent or empty there is never spawned. **Check the corpus exists before spawning**
— `REVIEW.md` § Without a rules corpus says what each lane does when its rules, practices
or catalogue file is missing. Don't spawn a lane that would only report "nothing to review
against"; say in the opening line which lanes were skipped for that reason, and point at
the plugin's `templates/`. Several rows can match. Only the two
unconditional ones running is normal too — a diff confined to tooling, `.claude/` or root
config is a complete review, not a partial one. Don't spawn a practices lane against paths
it would immediately rule out of scope.

**The security row's trigger is a list of specific files and narrow globs**, not an area
match. That list lives in [`docs/review/security.md`](.claude/docs/review/security.md) § Trigger
paths and is canonical — **read it there rather than keeping a second copy here.** Don't widen it to
"anything security-adjacent": narrowness is what keeps that lane worth reading.

## 4. Spawn every applicable lane in parallel

One message, one `Agent` call per lane, each with `subagent_type` set to the lane's
plugin-qualified name — `klein-sdlc:structure-reviewer`, `klein-sdlc:design-reviewer`, and so on.
They start with no memory of this conversation, so each prompt needs to be self-contained:

- **State the exact target** resolved in step 1.
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
you spawned that errors out gets said so in the final report, not silently dropped.

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

1. **Report each lane's findings under its own heading**, in the order: security,
   correctness, structure, design, then the practices lane(s) that ran. Security and
   correctness lead because a `hole` and a `breach` are things that are broken. Preserve
   each finding's original file:line, citation, scenario and fix.
2. **Call out overlaps explicitly.** Two lanes on one file:line is a stronger signal than
   either alone — name it as such rather than leaving two bullets the reader must connect,
   and don't discard either. **One overlap is expected rather than rare:** an authorization
   check enforced in a router and not the service is on both `correctness-reviewer`'s
   catalogue and `security-reviewer`'s. When both report it, that is the signal working.
3. **Roll up one combined verdict line**, leading with the blocking count across all lanes —
   that is the number the reader acts on, and it is never folded into a tier total. Then the
   most-severe-tier totals with a per-lane breakdown, then the rest.

   Give `rule gap` / `practice gap` / `invariant gap` / `exposure gap` their own line rather
   than burying them in "the rest": they are the only signal the rules corpus has a hole.

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
explains it ("4 lanes ran: structure, design, correctness, backend-practices — no frontend
paths changed").

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
| `rule` / `practice` / `invariant` / `exposure gap`, verified or unverified | Yes                                              |
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
