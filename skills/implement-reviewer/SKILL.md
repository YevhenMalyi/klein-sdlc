---
name: implement-reviewer
description: >-
  Adds a review lane to this repo: a subagent in .claude/agents/ cut from the plugin's
  basic-reviewer, its catalogue under the review catalogues directory, and its entry in
  the manifest's `review.lanes`, so `full-review` spawns it. Use when the user says "add a
  review lane", "add a reviewer for <area>", "implement a reviewer", "set up a
  security/structure/design/correctness lane", "create a <thing>-reviewer agent", or
  wants a new kind of check to run as part of full-review. Not for picking up a ticket —
  that is implement-ticket.
---

# Implement a reviewer

Takes a lane from "we should review for X" to a subagent `full-review` spawns, in one
pass: the agent file, its catalogue, the manifest entry, and the catalogue README row. It
does not run the lane and does not commit.

The project manifest — `docs.*` and `review.lanes` below name values in it:

!`cat .claude/sdlc.json`

## Hard rules

- **Every lane is cut from [`basic-reviewer`](${CLAUDE_PLUGIN_ROOT}/agents/basic-reviewer.md).**
  Read it first. A copy changes four things and nothing else — the one question it owns
  and what it leaves to the other lanes, which corpus it reads, what it hunts, and its
  severity table. The contract preload (`skills: klein-sdlc:review-contract`), the tools,
  the catalogue step and the lint step stay as they are. Never edit the plugin's copy.
- **A lane reports against a document, never from general knowledge.** The rule or practice
  file it cites must exist in `docs.rules` or `docs.practices` before the lane does. If it
  does not, stop: say which file is missing, point at the plugin's `templates/rules/` and
  `templates/practices/`, and offer to write that first. A lane with nothing to cite is
  the false-positive generator the contract exists to prevent.
- **One question per lane, and no two lanes owning the same one.** Read every agent the
  manifest already declares before proposing a new one; the new lane's "what is not yours"
  list names them, and theirs may need a line pointing at it.
- **The agent name and the manifest's `agent` field match exactly**, and the file is
  `.claude/agents/<name>.md`. `full-review` spawns what the manifest says; a mismatch is a
  lane that silently never runs.
- **The catalogue never records the current state of the code as a standing fact.** A
  deliberate arrangement is a pointer to the doc that mandates it. "The handler is already
  mounted" is wrong on some later day nobody notices.
- **Illustrative ticket ids are `<prefix>-XX`**, never real ones.

## 1. Read what exists

- [`REVIEW.md`](${CLAUDE_PLUGIN_ROOT}/REVIEW.md) — what the lane will report against.
- [`basic-reviewer`](${CLAUDE_PLUGIN_ROOT}/agents/basic-reviewer.md) — the boilerplate.
- Every agent `review.lanes` already names, in `.claude/agents/`, and the README at
  `docs.reviewCatalogues`.
- The catalogue skeletons: [`templates/review/lane.md`](${CLAUDE_PLUGIN_ROOT}/templates/review/lane.md),
  and [`templates/review/security.md`](${CLAUDE_PLUGIN_ROOT}/templates/review/security.md)
  for a lane that fires on its catalogue's own trigger list.
- The rule or practice files the lane would cite, under `docs.rules` and `docs.practices`.

## 2. Settle the lane in one round

Ask the whole frontier at once, each question with a recommendation drawn from what you
read, so the user can accept the lot in a word or correct one line:

| Decide                  | Recommend from                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **The one question**    | What the user asked for, phrased as one question the lane answers ("can the wrong tenant reach something?")        |
| **Name**                | `<area>-reviewer`, kebab-case                                                                                       |
| **Corpus**              | Which rule or practice files it cites — they must exist (hard rule)                                                 |
| **Trigger**             | `"always"` for a lane that applies to any diff; a path list for an area; `"catalogue"` for a narrow surface list    |
| **Severity table**      | Three or four tiers with a "Blocks by default" column, honouring `REVIEW.md` § What blocks: a gap tier never blocks |
| **No catalogue?**       | Stop and report nothing (default), or run a code-only tier and say so (`optionalCatalogue: true`)                   |
| **Position**            | Where in `review.lanes`: lanes reporting things that are broken go ahead of conformance lanes                       |
| **What is not yours**   | One line per existing lane, naming what that lane owns instead                                                      |

Do not ask what you can read. Wait for the answer before writing.

## 3. Write the agent

`.claude/agents/<name>.md`, from `basic-reviewer`:

- Frontmatter: `name`, a `description` that says what it owns, what it leaves to others,
  and the phrases that should route to it; `tools: Read, Grep, Glob, Bash`;
  `model: inherit`; `skills: klein-sdlc:review-contract`.
- The opening paragraph: what it owns, in one sentence, then the stay-in-lane list.
- The contract paragraph, unchanged.
- § 1 catalogue, unchanged except the "No catalogue?" line, per the decision above.
- § 2: the corpus it loads — rules, practices, or one named doc.
- § 3 lint, unchanged.
- § 4: what it hunts, in its own terms. Drop the ordinary-bugs paragraph unless the lane
  owns wrongness.
- § 5: its severity table with the "Blocks by default" column.
- Drop § Narrowing this lane.

Keep it short. The agent file is the half that would be the same in any repo with this
lane; everything about this codebase goes in the catalogue.

## 4. Write the catalogue

`<docs.reviewCatalogues>/<catalogue>.md` from the matching skeleton, with the sections that
lane kind needs (the skeleton's table says which). Fill it from the codebase, not from
memory: run candidate greps and keep the ones that hit the shapes the rule files describe;
list the forms the greps hit that a rule explicitly allows, each with the rule line; list
the arrangements that read as wrong, each as a pointer to the doc that mandates it. An
entry states a failure, not a smell. A lane on a `"catalogue"` trigger gets its
`§ Trigger paths` table of specific files and narrow globs, never whole trees.

## 5. Register it

- Add the entry to `review.lanes` at the agreed position:
  `{ "agent": "<name>", "catalogue": "<file>.md", "trigger": ... }`, plus
  `"optionalCatalogue": true` where decided. Keep the file valid JSON; the plugin's
  `schema/sdlc.schema.json` is the shape.
- Add the row to the catalogue README at `docs.reviewCatalogues`.
- If `.claude/rules/core.md` or another host doc enumerates the lanes, add it there too.
- If an existing lane's "what is not yours" list should now name this lane, add the line.

## 6. Stop and report

Say what was written, where, and how to try it: run the lane on its own against a diff
(`Agent` with `subagent_type: <name>`) and expect either findings in its vocabulary or
"nothing of mine changed". Don't run `full-review`, don't commit, don't branch —
`commit-and-pr` is the next step once the user is happy with the files.
