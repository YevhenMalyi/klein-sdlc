The shape of every `Spec: <thing>` document. `write-spec` reads this file and publishes
everything below the rule; a person writing a spec by hand copies the same part.

A host that needs different sections copies this file into its own repo, edits it, and
names the copy at `docs.specTemplate` in `.claude/sdlc.json`. Keep the status line and the
**Stories** heading — the downstream skills read both.

Delete any section that does not apply — an empty heading is worse than no heading.

The status line takes one of three values, and it is what the downstream skills read:

- `Draft — not yet refined.` — where a new spec starts. Leave it here until `refine-spec`
  has been through it. Not plannable.
- `Refined <date>` — reviewed, with the findings worked through. Only this status is
  plannable by `spec-to-stories`.
- `As-built — describes shipped functionality as of <date>.` — written after the fact, for
  functionality that already ships. It never becomes `Refined` and is never broken into
  stories; reviewing one files bugs against the product instead of patching the document.
  Delete the **Stories** section from an as-built spec.

---

> **Status:** Draft — not yet refined.

## Problem

What's wrong or missing today, and for whom. One or two paragraphs, no solution yet.

## Goals

- What this must achieve, as outcomes rather than features.

## Non-goals

- What this deliberately does not cover, so scope creep has something to bounce off.

## Behaviour

The actual specification. How it works from the outside: what the user sees and does, what
the system does in response, and what happens in the edge cases. This is the section worth
the most time.

## Data model

New or changed entities — the validation schema, the table, the migration. Note anything
that makes the migration non-trivial (backfills, nullability changes, unique constraints on
existing data).

## API surface

New or changed procedures or endpoints, and which package or module owns them.

## UI

Which app, which routes, which pages. Sketches or screenshots if they exist.

## Permissions

Which roles can do what, in the vocabulary of the host's permissions doc.

## Open questions

Things genuinely undecided. Resolve them into the sections above as they close, rather than
leaving the answer down here.

## Stories

Link the stories that implement this, and keep the list current — this is how you tell at a
glance whether the spec has shipped.
