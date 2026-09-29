# Design notes

Why the plugin is shaped the way it is, and what was rejected. Nothing here is an
instruction; the skills, agents and `REVIEW.md` carry those. This file exists so that the
choices most likely to be "fixed" by a later maintainer come with their reasons attached.

## Almost nothing is always loaded

Context is expensive, so the method keeps the always-on part small and puts the detail
behind a table.

| Layer             | Lives in                                       | Loaded                             |
| :---------------- | :--------------------------------------------- | :--------------------------------- |
| Instructions      | the host's `CLAUDE.md`                         | Always                             |
| Invariants        | the host's `.claude/rules/core.md`             | Always                             |
| Review contract   | `REVIEW.md`                                    | By every reviewer, on review       |
| Tracking contract | `TRACKING.md`                                  | By the tracker-facing skills       |
| Rule detail       | the host's `.claude/docs/rules/`, `practices/` | On demand, per changed path        |
| Lane catalogues   | the host's `.claude/docs/review/`              | By the lane that owns each         |
| Skills            | `skills/*/SKILL.md`                            | Description always, body on invoke |
| Subagents         | `agents/*.md`                                  | On delegate                        |

The always-loaded core file is a routing table plus the invariants that fail _silently_,
and that last phrase is the criterion for earning a place in it: the thing compiles, lints
and typechecks while being wrong. A core file that restates the rule files costs twice. It
is paid for on every session whether or not the work touches the area, and the same rule
then has to be edited in two places.

Rules and practices are two corpora rather than one because they answer different
questions on different clocks. Rules say whether code fits this repository's architecture
and change when the owner changes their mind. Practices say whether code uses a library
the way the library intends, at the versions pinned, and go stale on the library's next
major release. Where they overlap, rules win.

## What lint holds, review does not repeat

A convention a machine can check is worth more in the editor than in a review report:
where a check runs decides whether it gets fixed far more than how accurate it is. So
anything mechanically checkable belongs in the host's lint configuration, the practices
README lists what is already enforced there, and the lanes are told to spend no attention
on it.

That makes a claim of lint coverage load-bearing, because reviewers stand down on the
strength of it. A rule documented as enforced and not actually enforced is checked by
nobody. Verify a claim against the configuration, by running the rule on a file that
violates it, not against the sentence that makes the claim. A rule that is silently inert
passes lint perfectly.

What stays with review is what needs judgment or the whole project in view: whether a unit
does one thing, which layer a file belongs to, whether something earned promotion on its
second consumer.

## The seam between the plugin and the host

The plugin holds the method: how a spec is interviewed, how a ticket is picked up, how a
finding is reported and verified. The host repository holds everything that is true only
of that repository: its rules and practices, one catalogue per review lane, and a manifest
naming its tracker, forge, gates and scopes. Skills inject the manifest at load time and
name a value by its path rather than quoting it, because injection cannot be skipped and a
quoted value goes stale in every file that quotes it.

The review lanes are split the same way. An agent file is the half that would be the same
in any repo: what the lane owns, what it leaves to other lanes, its procedure and its
severity vocabulary. The host's catalogue is the half that is not: the invariants, the
auth-surface paths, the greps, the sanctioned forms, and the arrangements that read as
wrong and are deliberate. A catalogue never records the current state of the code as a
standing fact. Every such line is right on the day it is written and wrong on some later
day nobody notices, and a lane that trusts it then reviews the code against a description
of the code. A deliberate arrangement is a pointer to the doc that mandates it, checked
each run.

## The blocking bit, and why there is no cap

Each lane keeps its own severity vocabulary, because a structural `drift` and a design
`drift` are not the same claim. What none of those scales answered was the reader's actual
question: does this stop the change? So every finding carries one bit ahead of its
severity, borrowed from Conventional Comments: `(blocking)`, `(non-blocking)` or
`(if-minor)`.

The criterion for a tier blocking by default is how often that class of finding is wrong,
not how much it matters when it is right. A blocking check that is frequently wrong
poisons trust in every finding beside it. Tiers checkable against a document clear the
bar. Design `defect` blocks too, against the criterion's obvious reading, because the
design rulebook defines a defect operationally rather than as taste and the evidence bar
holds its false-positive rate down. If design findings start arriving wrong, tighten the
bar, not the tier.

A numeric cap on findings per review was considered and rejected. The evidence for caps
comes from review bots posting inline at organisational scale, where the recipient triages
a queue they did not ask for. Here the author runs the review before pushing, intending to
act on it, and a cap would withhold true findings behind a count. Volume is controlled by
excluding low-value classes instead: the evidence bar, the skip paths, and re-review
convergence.

## Scope is the changed file, not the changed hunk

"Touched code follows the rule" was being read as touched lines, which made every legacy
backlog permanent: a file edited fifty times stayed half-converted forever because no
single edit owned the rest of it. So touched means the file. A pre-existing violation in a
file already in the diff is a finding, and an established pattern widens the fix rather
than excusing the instance. Precedent can inform severity or phrasing; it never converts
a defect into a non-finding. Files not in the diff stay out, with no exception for a large
file touched for a one-line fix. Some diffs get bigger than the change that prompted them,
and that cost is accepted.

## One correctness lane, two tiers

Correctness was first split: the repo's own invariants to a lane, ordinary bugs to a
general-purpose reviewer run separately. The split cost more than it bought. The second
command was the one that got skipped, and the boundary had to be adjudicated per finding,
which spends a reviewer's judgment in the wrong place. One lane now owns correctness end
to end. A `breach` cites the rule whose contract the code breaks; a `bug` cites the line and
the input that breaks it. Both block on the same bar: name the concrete failure, or it is a
`latent`. The tiers stay distinct because they are found differently, one by reading a
document and one by reading code, and collapsing them would lose the instruction to open
the rule before reporting against it. That instruction is what stops the lane reporting a
deliberate counter-intuitive choice as a defect, which is the worst failure available to
it.

## Verification is blind, single-pass, and biased against the finding

The orchestrator resolves the diff once, runs the gates once, and passes the paths down,
so parallel lanes review the same thing and do not race each other through the build
cache. Each lane keeps a fallback for standalone use.

Between finding and report sits `finding-verifier`: one fresh-context spawn per finding,
returning `confirmed`, `refuted` or `unsubstantiated`. Its constraints are the design, not
style, and each is the difference between a stage that helps and one that makes things
worse:

- **The verifier gets the claim and never the reasoning or the review prompt.** A fresh
  reader given only the artefact beat every alternative tested. The artefact plus the
  generating prompt did worse, same-session self-review worse again, and a second
  self-review pass worst of all, at over 40% more false positives than the best condition.
- **One pass, not a dialogue.** Multi-turn verification raised recall slightly while
  producing over 60% more false positives and collapsing precision by a third.
- **Disagreement carries evidence.** A naive reviewer-plus-critic loop scored worse than a
  single reviewer, because the critic capitulates to a confident rebuttal. Two of the three
  verdicts require a citation.
- **Unreachable evidence keeps the finding.** The default stance is that a finding is a
  false positive, but `unsubstantiated` exists so that "I could not check" is not a silent
  deletion channel. Such a finding survives and loses only its blocking bit.
- **Only a written rule refutes a finding, never other code doing the same thing.** Most of
  an unfiltered reviewer's noise is true-but-unwanted, and the obvious fix, dropping a
  finding the codebase contradicts, would quietly repeal the file-scope rule above.

The stage is on probation. Multi-agent scaffolds routinely lose to sampling one agent more
times at equal cost, and that matched-budget comparison has not been run here. Whichever
way it goes, record it in this file rather than quietly keeping or dropping the stage.

## Security fires on a path list, not an area

A built-in security command cannot occupy a lane: it is not a subagent the orchestrator
can spawn, it re-derives its own target, and it reports against none of this contract. So
security is a lane of its own with `hole` / `weakening` / `exposure gap`, and a `hole` earns
its blocking bit by walking the path in: which caller, which asset, under what conditions.

Its trigger is a short list of specific files and narrow globs in the host's catalogue,
not a whole tree. Narrowness is what keeps a specialist lane worth reading: volume stays
low, so its findings keep their credibility. The list lives in one place, the catalogue,
and the orchestrator points at it rather than keeping a copy. One overlap with the
correctness lane is deliberate: an authorization check enforced in a router and not in the
service is on both catalogues, found from the reachability side and the invariant side.
A double report is the signal working, not a duplicate to dedupe.

## Gaps go to a ledger, counted by grep

Every lane can raise a gap, code that is reasonable and no rule covers, and every lane is
forbidden from acting on one, because changing the rules is the owner's call. Without a
ledger the loop ended there: no lane holds a write tool, so the same gap raised twice
months apart was two forgotten sentences. The orchestrator appends to `rule-gaps.md` as its
last step, after the report is delivered, so a failed write cannot swallow a finished
review.

The `Occurrences` field is a command plus a dated count, never a bare number. A frozen
count rots silently; storing the grep makes refreshing cheap and rot visible. Graduation
runs on two axes, how often the pattern occurs in the code and how often a check would be
wrong, and never on how many times the comment was made. "Said twice in review, therefore
a rule" is folklore. Graduated and rejected entries stay in the file, because "we looked at
this and said no" is the only thing that stops a gap being re-raised forever.

## The skill chain

`write-spec` → `refine-spec` → `spec-to-stories` → `whats-next` → `implement-ticket` →
`full-review` → `commit-and-pr`, and the order carries weight: refinement changes
behaviour, and behaviour changed after planning invalidates the plan. `report-bug` is the
other way onto the board, filing first and diagnosing second on request, so a bug found
mid-task costs a minute to record rather than ten.

`whats-next` never reads the codebase, which keeps it cheap enough to run casually, and
never writes to the board, because marking a ticket started is `implement-ticket`'s job
once the user has actually chosen. `implement-ticket` stops short of branching or
committing: the method branches at commit time, so the two stay separate skills rather
than one that does everything.

The spec template is a file, and `write-spec` reads it rather than carrying a copy of its
structure. The first version mirrored the section list into the skill, which made it a
second source of truth, and it drifted. The second fetched a template document live from
the tracker, which fixed the drift and made the plugin unusable to anyone without that
document: an adopter got the skills and a manifest key pointing at nothing. The template
now ships as `templates/spec-template.md`, with a host free to name its own at
`docs.specTemplate`. There is still one source per host, which is what the live fetch was
protecting.

## The tracking contract ships with the plugin

The tracking conventions and the reasoning in this file both used to live as documents in
the tracker of the project the plugin was extracted from, reached through manifest keys.
That was wrong twice over. The conventions are not a host's to vary: the skills implement
them, so a host that wrote different ones would have skills that ignored its document. And
a document in one workspace's tracker is readable only by that workspace, so every other
adopter was told to read something they could not open.

So the conventions are `TRACKING.md`, beside `REVIEW.md` and for the same reason: a
contract several skills read belongs in one file they all point at. It names nothing of
the host's by value. Everything project-specific stays in the manifest.

The rule behind both moves: **whatever the plugin needs in order to work ships in the
plugin.** A host's tracker holds the host's work, never the method.

## The board scripts bypass the tracker's MCP

`whats-next` and `linear-stats` query the tracker's API directly through plain scripts.
The MCP cannot express "not completed and not canceled" in one call and returns no
relations or attachments, which is most of what `whats-next` reasons over; one script call
replaces a round trip per issue. They also keep working without a live MCP session.

## Manual QA judges against the spec's own standard

`manual-qa-engineer` judges the built interface against the same UX floor `refine-spec`
holds a spec to, rather than a second standard of its own. A state-coverage gap found at
spec time and the same gap found in the running app are one finding caught at two
different costs.

`unverified` is a severity level, not an absence of one. Some failure states cannot be
forced from a browser, and the agent is required to name them rather than let an
unreachable state read as a pass. It reports only: fixing is the implementer's, and filing
is `report-bug`, which needs a human confirmation a subagent cannot give.

## Ticket ids in skill files are placeholders

Every illustrative id in a skill or agent is `<prefix>-XX`, never a real one. The
tracker's forge integration links and transitions any id-shaped text it finds in a PR
title or body regardless of context, so a real id quoted as an example can reopen a
shipped ticket when the file's contents end up in a PR description.

The interview loop in the spec skills, a design tree worked in rounds with a
recommendation attached to each question, and the vertical-slicing and quiz-before-publish
steps, are adapted from MIT-licensed work credited in `NOTICE.md`.
