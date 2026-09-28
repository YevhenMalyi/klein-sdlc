# UX house rules

Part 2 of the UX standard that `refine-spec` and `manual-qa-engineer` judge against. Part 1,
the floor, ships with the `klein-sdlc` plugin and is product-agnostic. This file takes sides
on questions that genuinely have two answers, for **this** product. Copy it to the path
`docs.uxHouseRules` names in `.claude/sdlc.json`.

**These rules are meant to be argued with.** When a house rule is overruled in a spec,
that's a normal outcome — note it in the spec and move on. When it's overruled twice for
the same reason, the rule is wrong: change it here.

Cite the rule when raising a finding, by section: "filters reset on back-navigation
(§2.2)". Keep the `§2.n` numbering so the plugin's severity table (`floor` is Part 1,
`house` is Part 2) stays true.

Name each audience by who they are and which app they use, because the rules for one
usually point the opposite way from the rules for another: a public visitor with no
account wants density, shareable URLs and speed; a small team doing repetitive typed work
wants reversibility, preserved state and keyboard paths. A spec or an app is judged by its
own audience's rules, never the other's.

## 2.1 <Audience A> (`<app>`)

One line on who they are and what they are doing. Then the rules, each a bold phrase and
a sentence on what it means in practice. For example, for a public-facing app:

- **URLs are the share surface.** Every visible state is linkable: filters, pages, tags.
  State that exists only in memory can't be shared, can't be bookmarked, and dies on
  refresh.

## 2.2 <Audience B> (`<app>`)

For example, for an internal or editorial app:

- **Never lose typed work.** Leaving a dirty form warns. A failed save keeps every field
  exactly as typed. This outranks almost everything else in the list.
- **Keyboard for the actions that matter.** Name them: save, search, escape-to-close.

## 2.3 Both

- **Every write specifies three outcomes**: what success looks like, what failure looks
  like, and what happens if the user navigates away mid-flight.
- **Permission-denied says what's missing**, not "forbidden".
- **A spinner is what you use when you don't know how long.** If it's bounded, show
  progress.
