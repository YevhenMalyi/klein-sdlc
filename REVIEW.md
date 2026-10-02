# REVIEW.md

How a finding is reported here. Read by every review lane the host declares, by
`finding-verifier`, and by the `full-review` skill that orchestrates them. A lane holds it
in context from the start: its agent file preloads the `review-contract` skill, which
injects this file at load time.

It carries no rules of its own — those live in [`.claude/docs/rules/`](.claude/docs/rules/README.md)
and [`.claude/docs/practices/`](.claude/docs/practices/README.md), and this file links to
them rather than restating them. Why it is shaped this way:
[`design-notes.md`](${CLAUDE_PLUGIN_ROOT}/docs/design-notes.md).

## The lanes are the host's

The plugin ships one lane, `basic-reviewer`, and the method. Which lanes review a diff, in
what order, and on what trigger is the host's manifest, `.claude/sdlc.json` → `review.lanes`:
one entry per lane naming the agent, its catalogue under `docs.reviewCatalogues`, and
whether it runs always, on a path list, or on the trigger list its catalogue carries. The
agent files live in the host's `.claude/agents/`, each cut from `basic-reviewer` by
`implement-reviewer`. An agent file is the half that would be the same in any repo with
that lane — what it owns, what it leaves to the others, its procedure, its severity table.
The catalogue is the half that is not.

## The blocking bit

Every finding carries one bit ahead of its severity — `(blocking) violation`,
`(if-minor) stale` — borrowed from [Conventional Comments](https://conventionalcomments.org/):

| Bit              | Means                                                         |
| ---------------- | ------------------------------------------------------------- |
| `(blocking)`     | Prevents the change being accepted until it is resolved       |
| `(non-blocking)` | Does not                                                      |
| `(if-minor)`     | Resolve only if the fix turns out to be trivial               |

The bit is orthogonal to severity, not a replacement for it: it answers "does this stop the
change?", severity answers "what kind of wrong is it?". Each lane keeps its own vocabulary
rather than collapsing onto one shared scale — a structural `drift` and a design `drift` are
not the same claim.

## What blocks, by default

**Each lane's severity table carries a "Blocks by default" column**, and that column is the
default for its tiers. The contract fixes only what every lane's table must honour:

- **A tier blocks by default when a finding in it is checkable against a document or a
  concrete failure, so that it is rarely wrong.** A tier that is often wrong when it blocks
  poisons trust in every finding beside it; if a blocking tier starts arriving wrong,
  tighten its bar, not its bit.
- **A tier that makes a behaviour claim earns its blocking bit by naming the concrete
  failure** — what breaks, for whom, under what conditions — and drops to the lane's
  non-blocking hazard tier when it cannot. A reachability claim walks the path in: which
  caller, which asset, under what conditions. A hazard you cannot make fail, even on
  paper, or cannot walk from an actor to an asset, does not block.
- **Gap tiers never block.** `rule gap`, `practice gap`, `invariant gap`, `exposure gap` —
  whatever a lane calls it — means the code is reasonable and no rule covers it. A lane
  raises a gap and is forbidden from acting on it; `full-review` appends it to
  [`.claude/docs/rule-gaps.md`](.claude/docs/rule-gaps.md) after the report is out, since no
  lane holds a write tool. A gap graduates on how often the pattern occurs and how wrong a
  check would be — never on how often it was raised.

**Defaults, not a ceiling.** Raise or lower a finding's bit and say why in the same line.
A finding touching secrets, tokens or authorization blocks whatever its tier.

## Scope: the changed file, not the changed hunk

**A finding on an untouched line of a file in the diff is still a finding.** The rules say
"new and touched code follows it" — touched means the file.

- **An established pattern is not a defence.** "The rest of this file already does it this
  way" widens the finding to the rest of the file. Precedent can inform severity or
  phrasing; it never converts a real defect into a non-finding.
- **A diff can get larger than the change that prompted it.** That is the accepted cost.
- **Files not in the diff stay out of scope.** Clearing an untouched backlog is its own task.

Each lane's catalogue in [`.claude/docs/review/`](.claude/docs/review/README.md) lists the
arrangements that are deliberate, with the doc that mandates each; a lane opens that doc
before reporting and never carries the current state of the code as a standing fact. A
deliberate arrangement is not a finding; it does not exempt a file that is in the diff from
everything else.

## The evidence bar

**A behaviour claim needs a `file:line` citation in source, not an inference from naming.** A
lane that has not opened the file does not have a finding; it has a lead. A `grep` hit is a
lead. A plausible-sounding name is a lead.

A `(blocking)` finding additionally names the rule or practice by file and section, and
states the concrete failure in terms of this codebase. "This looks like it might be a
layering issue" is not reportable at any bit.

## Lane procedure

Shared by every lane; each agent file adds only what is its own.

### 1. Establish the diff

**If the caller resolved the target, use it.** `full-review` writes the diff to a file and
passes that path along with the lint and typecheck output it already ran. Read those files;
do not re-derive the diff and do not re-run the gates.

Otherwise, review the working tree against the merge base:

```bash
git diff --stat <forge.baseBranch>...HEAD
git diff <forge.baseBranch>...HEAD    # or: git diff HEAD  for uncommitted work
git status --short
```

`forge.baseBranch` is in `.claude/sdlc.json`.

If both are empty, say so and stop. Never invent a diff. Then narrow to your lane's paths —
"nothing of mine changed" is a complete answer, not a failure.

### 2. Read the rule before reporting against it

Open the file your finding cites; do not work from memory of this repo or from general
framework knowledge. Several rules here are deliberate deviations, and reporting a
deliberate choice as a defect is the worst failure available to a lane.

Read the surrounding file before calling something a finding. Most rules have sanctioned
exceptions, and applying a rule without its exception is a false positive — and false
positives are worse than a missed finding, because they train people to skip the review.

### 3. Report

Most severe first. Per finding:

- **file:line**
- **the bit**, ahead of the severity, with a reason whenever it departs from the default
- **the rule, practice or doc**, by file and section — `docs/rules/<file>.md § <section>`
- **what the code does** and **what the rule requires**
- **the concrete fix**

A finding with no document behind it — a plain bug — cites the line and the input that
breaks it, and does not invent a rule to attach.

End with a one-line verdict — clean, or the tier counts and how many are `(blocking)`. A
clean diff gets a sentence or two. No restated rules, no praise, no summary of what the diff
does: the caller wrote it.

### 4. Do not edit anything

Not the rule files, not the practice files, not the source — unless the caller explicitly
asked you to fix rather than review. **When code and a rule disagree, that is a finding**:
say which you think is wrong and leave the call to the repo owner.

## Without a rules corpus

A lane reports against a document, never from general knowledge. When the document is
missing, the lane degrades explicitly rather than improvising, and **each agent file says
how, in its own "No catalogue?" line**: most lanes say so in one line and stop, reporting
nothing; a lane with a tier that cites code rather than a rule runs that tier only and
says which tier was skipped. `full-review` does not spawn a lane whose catalogue is absent
unless the manifest entry marks the catalogue optional, and it says in its opening line
which lanes it skipped for that reason.

A missing corpus is not a gap finding. It is the adoption step not yet done. The shapes to
fill are the `templates/` in the plugin, and `implement-reviewer` writes a lane's agent
and catalogue together.

## Skip paths

**Do not report anything that formatting, lint, or typecheck already enforces.** The
authoritative list is
[`.claude/docs/practices/README.md` § What lint already enforces](.claude/docs/practices/README.md),
and it is not restated here.

- If a check on that list would have caught the finding, run the lint gate from `gates`
  instead. Either it is already caught, or the config has a gap — **and the gap is the
  finding**.
- Formatter output is never a finding. Formatting in a file the formatter ignores is
  `(if-minor)` at most.

## Verification

**A `(blocking)` finding is checked by something other than the agent that wrote it before it
reaches the report.** `full-review` spawns `finding-verifier` once per finding, in fresh
context.

The verifier receives the claim and the diff — the `file:line`, the tier and bit, the rule
cited, and a sentence or two on what breaks. It does not receive the reviewer's reasoning or
the prompt the review was run from; both withholdings are the stage itself.

| Verdict           | What it means                                  | What happens to the finding                   |
| ----------------- | ----------------------------------------------- | --------------------------------------------- |
| `confirmed`       | The code supports the claim                    | Reported as written, at its original bit      |
| `refuted`         | The code contradicts it, or a rule requires it | Dropped, and counted in the roll-up           |
| `unsubstantiated` | Nothing reachable settles it either way        | Reported, marked unverified, `(non-blocking)` |

`unsubstantiated` exists so unreachable evidence is not a silent deletion channel. The
default stance is that a finding is a false positive, but a verifier that could not reach
the evidence has established nothing — so the finding survives and loses only its blocking
bit, which the evidence bar above would not grant it anyway.

Two things the verifier may not do: refute a finding because other code does the same thing
(only a **written rule** mandating the pattern refutes one, per § Scope), and report findings
of its own. One finding in, one verdict out.

**A lane run on its own is unverified, and that is expected.** The stage belongs to the
orchestrator.

## Re-review convergence

**A second review of the same branch reports `(blocking)` findings only.** New advisory
findings are suppressed. Something genuinely serious that the first pass missed is blocking
by definition and passes the filter anyway.

Per branch, not per session: a branch reviewed, revised, and reviewed again is on its second
pass whoever ran them.

## Finding volume

**There is no numeric cap**, and one was considered and rejected (`design-notes.md` § The
blocking bit, and why there is no cap). Volume is controlled
by excluding low-value classes — the evidence bar, the skip paths, convergence — not by
truncating a list that is already worth reading. If output becomes unmanageable, tighten the
evidence bar or extend the skip paths.
