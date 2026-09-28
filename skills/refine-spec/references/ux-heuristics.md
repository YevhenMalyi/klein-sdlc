# UX reference

Two layers, and the difference between them matters.

**Part 1 is the floor.** Established, product-agnostic, and not up for debate — a spec that
violates one of these has a defect, not a difference of opinion. It is below.

**Part 2 is house rules.** They take sides on questions that genuinely have two answers,
for the product this repo builds, so they live in the host: the file `docs.uxHouseRules`
names in `.claude/sdlc.json`. `templates/ux-house-rules.md` in this plugin is the shape.
They are meant to be argued with. When a house rule is overruled in a spec, that's a
normal outcome — note it in the spec and move on. When it's overruled twice for the same
reason, the rule is wrong: change it there.

Cite the rule when you raise a finding. "This is thin" is not a finding; "no empty state
for a list with no items (§1.2)" is.

---

## Part 1 — The floor

### 1.1 The ten heuristics, as questions to ask a spec

- **Visibility of status.** After every action the spec describes, does the user learn what
  happened? Including when it's still happening, and when it failed.
- **Match to the real world.** Does the spec use the words a reader or editor would use, or
  the words the database uses? `publishedAt` is a column; "goes live" is the concept.
- **User control and exit.** Can they get out of every flow the spec starts? Can they undo?
- **Consistency.** Does this behave like the rest of the product already behaves, or does
  it invent a second way to do a thing that exists?
- **Error prevention.** Is the mistake made impossible, or merely caught afterwards?
- **Recognition over recall.** Does the spec require remembering something from a previous
  screen?
- **Flexibility.** Is there a fast path for the person who does this fifty times a day, and
  a discoverable one for the person doing it once?
- **Minimalism.** Is anything here competing for attention with the thing that matters?
- **Error recovery.** Do the error messages say what went wrong, in what, and what to do —
  or do they say "something went wrong"?
- **Help.** If the feature needs explaining, is the explanation where it's needed?

### 1.2 State coverage

This is the most mechanical, most productive check. **Every list, view, and form in the
spec needs all of its states specified**, not just the happy one:

| State             | The question                                                                                           |
| :---------------- | :----------------------------------------------------------------------------------------------------- |
| Empty             | Nothing here yet — and does it say _why_, and what to do about it?                                     |
| First run         | Empty because the user is new, which is a different message from empty because they deleted everything |
| Loading           | What's on screen while waiting — and does it shift when data lands?                                    |
| Partial           | Some of it loaded, some failed                                                                         |
| Error             | Failed, recoverably — what does the user do now?                                                       |
| Permission denied | Not allowed, which is a state, not a crash                                                             |
| Overflow          | Far more data than the design assumed. 500 items. A 200-character title                                |

A spec that specifies only the happy path isn't half done; it's the easy half done.

### 1.3 Accessibility floor

Not findings to negotiate — requirements. Every interactive thing reachable and operable by
keyboard, with a visible focus state. Every input labelled. Text contrast that passes. Alt
text on meaningful images, empty alt on decorative ones. **No meaning carried by colour
alone** — a red dot needs a word next to it. Status changes announced, not just rendered.

---

## Part 2 — House rules

In the host: the file `docs.uxHouseRules` names in `.claude/sdlc.json`. Read it after this
one, and skip sweep 4 with a note if the manifest has no such entry.
