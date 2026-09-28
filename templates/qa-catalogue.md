# QA catalogue

What `manual-qa-engineer` needs to know about **this repo** before it opens a browser. The
agent file in the `klein-sdlc` plugin carries the procedure — the four sweeps, the evidence
bar, the report format — and that part is the same in any repo. This file is the part that
is not. Copy it to the path `docs.qa` names in `.claude/sdlc.json` and fill every section;
the agent stops if it cannot find it.

## Apps and ports

| App     | Port | Audience                                   |
| :------ | :--- | :----------------------------------------- |
| `<app>` | `<n>`| One line: who uses it and what they expect |

## Signing in

How to reach each role locally without the real identity provider: the route and its
parameters, or the seeded credentials. Which roles exist and what each can reach. What the
session is — cookie, token — how long it lasts, and what going stale looks like from the
browser. Whether signing out is safe.

## Blocked, not defects

Failure modes that mean the environment is misconfigured rather than the product broken,
each with the fix. A sign-in route that redirects to the real provider or 404s. A seeded
account that is missing. A session expiring inside its stated lifetime. The agent reports
these as blocked and stops; it never works around them.

## Seeded data

The accounts and rows QA may use, how they are marked so they cannot collide with real
data, and the command that restores them.

## Environment hygiene

Anything beyond the plugin's defaults, which are: prefix everything created with `[QA]`,
delete it once the finding is recorded, never bulk-delete, never touch a row you did not
create.

## What this file does not hold

The current state of the code as a standing fact — the same rule as the review
catalogues. A line like "the error handler is already mounted" is right on the day it is
written and wrong on some later day nobody notices.
