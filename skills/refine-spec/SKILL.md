---
name: refine-spec
description: >-
  Reviews a published `Spec:` document against UX practice — established heuristics plus
  this product's house rules — and works through the findings with the user, patching the
  ones they accept back into the spec. The pass that moves a spec from what the client
  asked for to what actually serves the user. Use when the user says "refine
  this spec", "review the spec for UX", "check this against best practices", "does this
  actually work for the user", or before breaking a spec into stories. Against an
  as-built spec the same review runs, but the findings describe the shipped product, so
  they leave as bugs rather than as patches to the document.
---

# Refining a spec

`write-spec` captures what the client wants. This skill asks whether what they want is
what serves the person using it — and it runs **before** `spec-to-stories`, because a
finding accepted after the work is planned invalidates the plan.

**You do not decide.** The client asked for something for a reason, and the reason is
often invisible in the document. Your job is to name the tension and hand it back:
here's what you asked for, here's the friction it creates and for whom, here's the
alternative and what it costs. Which one ships is the user's call, and it should stay
traceable to a moment where they made it — never to a diff that quietly appeared.

## 1. Load the material

The project manifest — `docs.uxHouseRules` below names a value in it:

!`cat .claude/sdlc.json`

Read **all** of [`references/ux-heuristics.md`](./references/ux-heuristics.md) before
reading the spec. Part 1 is the floor — a violation there is a defect. Then read the
host's house rules, the file `docs.uxHouseRules` names — opinions this product holds,
which the user may overrule. With no house rules configured, run Part 1 only and say so.

Then fetch the spec: by URL, title, or id if the user gave one, otherwise
`mcp__linear__list_documents` with `query: "Spec: "`. Confirm which one; never guess
between two.

**Check the status line and `## Stories` first.** A spec already marked `Refined` is one
you're re-reviewing — fine, but say so, and expect thinner findings. A spec marked
`As-built` describes functionality that already ships: the review is the same, what you do
with the findings is not — read `As-built specs` at the bottom of this file before
step 5. If `## Stories` already lists issues, stop and say so before doing anything else:
refinement is supposed to precede planning, and accepting a behavioural finding now means
those stories are stale. Report which ones are affected and let the user
decide whether to proceed and re-plan, or leave the spec alone.

## 2. Work out who this is for

Read the spec's **UI** section to see which app it touches, and match that to the
audiences the house rules define — they usually point in opposite directions, a public
visitor wanting density and shareable URLs where an internal team wants reversibility and
preserved state.

A spec spanning two audiences gets each side judged by its own rules. Applying one
audience's rules to the other's app produces confident advice that is simply wrong — that
failure is worse than saying nothing.

## 3. Find the gaps

Two sweeps, in this order.

**The mechanical sweep first**, because it's the highest-yield and needs no judgement: take
every list, view, and form the spec describes and check it against the state table in
§1.2. Empty, first run, loading, partial, error, permission denied, overflow. Most specs
specify the happy path and stop, and each missing state is a real hole with a cheap fix.

**Then the judgement sweep**: the ten questions in §1.1, then the house rules for the
relevant audience. This is where tensions with the client's stated wish surface.

Findings must be specific and cited. Not "the empty state needs work" — _"a filtered list
with no matches isn't specified (§1.2 empty); the user arrives from a link and sees
nothing, with no way back."_

Discard anything you can't tie to a rule and a consequence. A long list of weak findings
buries the three that matter, and it trains the user to skim.

## 4. Put them to the user

Same round-based format as `write-spec` — rank by consequence, not by section order:

```
❓ **F1** — **<what's wrong, in a phrase>**: <the gap, who it affects, what happens to
them. Cite the rule. Where this contradicts something the spec asks for, say so plainly
and give the reason the spec might be right.>

➡️ <your recommended resolution>
```

Findings that turn out to be independent all go in one round. Only genuinely dependent
ones wait — resolving a flow question can dissolve three findings downstream of it.

**Facts are still your job.** If a finding depends on how something already behaves in the
apps, read the code rather than asking. Read-only: this skill explores, it never edits
source.

Take **accept / reject / rework** on each, and take rejections without argument. A rejected
house rule is the system working; note the reason in the spec so the same finding doesn't
get raised again next quarter.

## 5. Patch the spec

`mcp__linear__save_document` with `patch` — targeted edits, never a full rewrite of a
document the user may have edited by hand.

Accepted findings land in the sections that already exist:

- Corrected or newly-specified behaviour, including states → **Behaviour**
- A finding that changes what's built → **Data model**, **API surface**, **UI**, or
  **Permissions**
- Rejected, but a real trade-off worth recording → **Non-goals**, with the reason
- Accepted but undecided → **Open questions**

**Flip the status line** in the same patch, from `Draft` to `Refined <today's date>`.
That line is what tells `spec-to-stories` the spec is plannable, so it moves only once the
user has actually worked through the findings — never at the start of the pass, and never
if they stopped partway. If the session ends with findings unresolved, leave it `Draft` and
say so.

**Do not add a "UX" section.** UX isn't a part of the spec; it's a property of the
Behaviour section. A new heading would also break the template, which is the one thing
`write-spec` treats as the contract.

Report the document URL, what changed, and what was consciously rejected. Then say the
spec is ready for `spec-to-stories`.

## As-built specs

A spec whose status line reads `As-built` describes functionality that already ships.
Steps 1–4 are unchanged — the heuristics don't care whether the thing exists yet. Step 5
inverts.

**Do not patch the findings into the spec.** The document describes what the product does;
editing it to describe what the product _should_ do turns an accurate record into a
plausible lie, and hides the very gap you just found. The spec is not what's wrong here.
The product is.

**An accepted finding becomes an issue instead**, via [`report-bug`](../report-bug/SKILL.md).
That skill decides bug versus improvement and sets the priority — you supply the finding, the
rule it violates, and who it affects. Accept/reject in step 4 is the confirmation: a finding
the user accepts is one they want filed, so file it in the same pass rather than handing back
a list for them to re-approve.

Two things still land in the document, both as `save_document` patches:

- **A rejected finding worth recording** → **Non-goals**, with the reason, exactly as in the
  default path. "We know, and we're not doing it" is worth writing down once.
- **The review date** → the status line, which gains a sentence and keeps its status:
  `> **Status:** As-built — describes shipped functionality as of <date>. Reviewed <today>.`

**The status never becomes `Refined`.** There is nothing to plan from and nothing to gate;
the spec was accurate before the review and is accurate after it.

Report the filed issues by identifier alongside the document URL. Don't point at
`spec-to-stories` — the work is done, and the issues you just filed are the backlog.

## Out of scope

No code, no running app, and — on the default path — no issues. (Against an as-built spec
issues are the whole output; see above.) **This pass reads the document, not the built
interface** — it can tell you a state is unspecified, never that the rendered component is
wrong. Checking the real UI is a different job needing the app running, and starting it is
the user's call.
