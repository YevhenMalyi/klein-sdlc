---
name: write-spec
description: >-
  Interviews the user about functionality they want — as a business analyst talks to a
  client — and publishes the result as a `Spec: <thing>` document on the build's Linear
  project. Use whenever someone wants to write, draft, or think through a specification:
  "let's spec out comments", "write a spec for post scheduling", "help me define this
  feature", "gather the requirements for X", or when a request describes wanted
  functionality vaguely enough that building from it directly would be guessing. Covers
  the reverse case too — backfilling an as-built spec for what already ships ("document
  what we've built", "backfill specs"), read out of the code rather than interviewed.
---

# Writing a spec

You are the analyst. The user is the client. They know what the product should do; you know
what the codebase can do. The spec is what you produce once those two are reconciled.

The project manifest — `tracker.*` below names values in it:

!`cat .claude/sdlc.json`

**If the functionality already ships, read `As-built specs` at the bottom of this file
before anything else.** It changes both phases, the status line, and the order in which
you publish. Everything else here still holds.

**The output is a Linear document, never a file in this repo and never an issue.** The
workspace conventions say a spec is reference material with no "done" state, so it lives
as a document on the build's project. Read them if you have not:
the conventions document at `tracker.docs.conventions`.

## Before the interview

**The spec's shape is the Linear document template** named by `tracker.docs.specTemplate` — a plain
team-scoped document, which is what the user duplicates when writing one by hand.

**Fetch it. It is the source of truth for the structure, and it is reachable:**
`mcp__linear__list_documents` with `query: <tracker.docs.specTemplate>`, then `get_document` on the id.
Take the status line, the section headings, and their order from what comes back — never
from memory, and never from the table below.

The table is guidance on **how to fill** each section, not a copy of the format. Where it
and the fetched template disagree about structure, the template wins; say so rather than
silently following either.

| Section            | What goes in it                                                                                                                                   |
| :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Problem**        | What's wrong or missing today, and for whom. No solution yet                                                                                      |
| **Goals**          | What this must achieve, as outcomes rather than features                                                                                          |
| **Non-goals**      | What it deliberately doesn't cover, so scope creep has something to bounce off                                                                    |
| **Behaviour**      | How it works from the outside: what the user sees and does, what the system does in response, and the edge cases. Worth the most time             |
| **Data model**     | New or changed entities — validation schema, table, migration. Note anything that makes the migration non-trivial                                 |
| **API surface**    | New or changed procedures or endpoints, and which package or module owns them                                                                     |
| **UI**             | Which app, which routes, which pages                                                                                                              |
| **Permissions**    | Which roles can do what, in the vocabulary of the doc at `docs.permissions`                                                                       |
| **Open questions** | Genuinely undecided. Resolve upward into the sections above as they close, rather than leaving the answer down here                               |
| **Stories**        | Filled by `spec-to-stories`. Leave empty                                                                                                          |

**The status line is the template's, verbatim.** It carries three values, and the template
defines them: `Draft` for a new spec, `Refined <date>` once `refine-spec` has been through
it, and `As-built — describes shipped functionality as of <date>.` for one written after
the fact. A new spec starts at `Draft`; see `As-built specs` below for the other case.

**Delete any section that doesn't apply** — an empty heading is worse than no heading.

**Pick the build project.** `mcp__linear__list_projects` with `team: <tracker.team>`.
One open build → use it, say which. More than one → ask. **Never create a project.**

Then take one pass over the repo for orientation only — enough to use the project's
vocabulary in your questions. Deep exploration belongs to phase 2.

## How to interview

Model the conversation as a **design tree**: every answer branches into the questions
that hang off it. Work the tree in **rounds**.

The **frontier** is every question whose prerequisites are already settled — the ones you
can ask _now_ without guessing at an answer you haven't heard. Ask the whole frontier in
one round. Then stop and wait.

```
❓ **Q1** — **<question title>**: <the question, with the options if it's a choice>

➡️ <your recommended answer>
```

Always give the recommendation. It costs you nothing and it lets the user accept a whole
round in a word.

Four rules make this work rather than turn into an interrogation:

- **A question whose answer depends on another question still open in this round belongs
  to a later round.** Don't stack conditionals into one message.
- **Finding facts is your job, never the user's.** If a question needs something from the
  filesystem, the database, or the API surface, go and look — dispatch an `Explore`
  subagent for anything broad. Never ask the user something you could read. The
  _decisions_ are theirs; the _facts_ are yours.
- **Don't block on your own research.** A running exploration is an unsettled
  prerequisite: only the questions downstream of it wait. Ask the rest of the frontier now.
- **Done means the frontier is empty** — every branch visited, nothing silently assumed.
  Confirm you've reached shared understanding before you write anything.

## Phase 1 — the client conversation

Fills **Problem**, **Goals**, **Non-goals**, and **Behaviour**. The template calls
Behaviour "the section worth the most time"; treat that literally.

Stay at the client's altitude. Territory worth covering:

- **Who** this is for. Which roles — and which distinctions actually change behaviour
  rather than just wording.
- **What they can't do today**, and what they do instead. The workaround usually names the
  real requirement.
- **What success looks like**, as an outcome rather than a feature.
- **The main path**, narrated from the outside: what they see, what they do, what the
  system does back.
- **The edges**: nothing yet, first time, someone else editing concurrently, the thing
  fails, they're not allowed. Each one is a branch of the tree, not a footnote.
- **What is deliberately out of scope** — non-goals are what scope creep bounces off.
- **Constraints that aren't technical**: policy, workflow, timing, volume.

**No schema, route, or component talk in phase 1.** If the user volunteers an
implementation answer, note it for phase 2 and carry on — don't let it end the behavioural
question it came from. Equally, don't accept "obviously" as an answer to an edge case.

## Phase 2 — the build conversation

Fills **Data model**, **API surface**, **UI**, and **Permissions**. These are mostly facts
plus a few decisions, so the shape inverts: **explore the repo and propose; don't ask.**
The user corrects.

- **Data model** — entities, columns, cross-entity references, soft versus hard delete,
  and anything that makes the migration non-trivial. If the host has a skill or rule for
  adding an entity, its questions are the ones to settle here.
- **API surface** — which package or module owns which procedures, and which writes need
  an authenticated actor.
- **UI** — which app, which routes, which pages.
- **Permissions** — which roles can do what, in the vocabulary of the doc at
  `docs.permissions`: read it before proposing.

Present each as a proposal with the reasoning behind it. Anything still genuinely
undecided goes to **Open questions** — and gets resolved back up into the section it
belongs to as it closes, rather than living there permanently.

## Publishing

```
mcp__linear__save_document
  title:   "Spec: <thing>"
  project: <the build project>
  content: <the sections from the fetched template, in its order>
```

Sections that don't apply are deleted, per the template's own instruction. Leave
**Stories** empty with a one-line note that `spec-to-stories` fills it — do not invent
issue links.

**Leave the status line at the top reading `Draft`** — unless this is an as-built spec,
which carries its own. A spec you just wrote has not been refined, however good it feels at
the end of a long interview, and `spec-to-stories` reads that line to decide whether the
spec is plannable. You never set it to `Refined` — that is
`refine-spec`'s to set, and only after the user has worked through its findings.

Report the document URL. If writing this spec was itself scheduled as a `tracker.typeLabels.chore`
issue, say so and point at it: that issue closes now that the document exists. Don't close
it yourself.

Then point at the next step: [`refine-spec`](../refine-spec/SKILL.md) reviews what you
just wrote against UX practice, and it runs **before** the spec is broken into stories.
Don't run it yourself in the same breath — the user has just spent a long conversation
saying what they want, and "here's what's wrong with it" is a different conversation.

## As-built specs

A spec for functionality that already ships. Same template, filled a different way, because
the thing being specified is sitting in the repo where you can read it.

**Say which mode you are in, in your first reply.** The difference is large enough that
guessing wrong wastes a conversation.

### The interview mostly disappears

Phase 2 was always facts plus a few decisions. Here **phase 1 joins it**: Behaviour is no
longer something the client holds, it is something the code does, and reading it out of the
code is your job. So there are no rounds. You draft the whole document, then hand it over.

Two sections resist that, and they are the only ones the user genuinely owns:

- **Problem** and **Goals** — why the thing exists, and for whom. Not in the repo. Infer
  them from what the code optimises for, and **mark the inference**.
- **Non-goals** — what was deliberately left out. Code cannot tell "decided against" from
  "not got to yet". Propose only the ones you can defend, and say which is which.

Mark an inferred section by ending it with this line, so the marker survives the user
editing the prose above it:

```
> _Inferred from the implementation — not stated anywhere. Correct or confirm._
```

The marker comes off when they confirm it, in the same patch that applies their correction.

Everything else — Behaviour, Data model, API surface, UI, Permissions — you state as fact,
because it is. No proposals, no hedging, no "presumably". If you can't tell what the code
does, read more of it.

### Behaviour is still the section worth the most time

The temptation is to transcribe the schema and call it a spec. Resist it. Behaviour is what
the user **sees and does**, and that lives in the pages and route modules, not in the
schema file. Walk the real path: what the list shows, what the form accepts, what happens
on save, what the error says. The edge cases are in the code too — find them rather than
inventing them, and where a state genuinely isn't handled, say that it isn't. A missing
empty state is a finding, not a blank to fill in.

**Where the code is wrong, the spec still describes what it does.** An as-built spec that
quietly documents the intended behaviour is worse than none, because it hides the bug
behind a document that looks authoritative. Note the discrepancy to the user; it becomes a
bug, not a rewrite.

### Publish first, correct in place

The reverse of the default order. The document is long and mostly fact, and reading it in
Linear beats reading it in chat, so publish the draft and take corrections as
`mcp__linear__save_document` patches. The inference markers exist precisely so that
correcting after publishing is safe.

### Drawing the boundary

**Specs are drawn around behaviour, not around modules.** One spec per entity is the
tempting shape, because that's how the code is organised, and it's the wrong one: one
editing flow usually touches three or four entities, so an entity-shaped spec either omits
the actual flow or repeats it four times. It also guts the point — `refine-spec` against a
spec for one lookup table finds nothing, against a spec covering a whole flow it finds real
things.

Group by what someone sits down to do. Propose the grouping and the count before writing
anything; it's the one decision in as-built mode that is the user's.

### Status

```
> **Status:** As-built — describes shipped functionality as of <today's date>.
```

Not `Draft`: nothing here is a draft of future work. Not `Refined`: nothing has been
reviewed. The date matters, because the document starts going stale the moment it
publishes. `spec-to-stories` refuses this line, which is correct — the work is done.

### What happens next

Point at [`refine-spec`](../refine-spec/SKILL.md) as always, but say what it does
differently here: findings against an as-built spec are findings against the **shipped
product**, so they leave as bugs and improvements rather than as patches to the document.
That is the reason to backfill a spec at all.

## Out of scope for this skill

It creates no issues — that's [`spec-to-stories`](../spec-to-stories/SKILL.md). It does
not critique the spec it just wrote — that's `refine-spec`. It writes no code. It creates no project. And it does not start implementing the thing it just
specified, however clear the spec now looks.
