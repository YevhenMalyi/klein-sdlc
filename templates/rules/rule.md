# Rule: <area>

Copy to `.claude/docs/rules/<area>.md`. What this file governs, in one paragraph, and
which paths route here from `core.md`'s table.

## Rules

Numbered, so a finding can cite `docs/rules/<area>.md § Rules 3`. Each rule states what
must hold, then its sanctioned exceptions in the same place — a lane that reads the rule
reads the exception with it.

1. **<rule>.** <what must hold, and why in one clause>. Exception: <when it does not apply>.
2. **<rule>.** …

## <Any further sections the area needs>

Reference shapes, worked examples, the reasoning behind a counter-intuitive choice. A lane
opens this file before reporting against it, so a deliberate deviation from the framework's
convention is stated here as a rule, not left for the reviewer to guess at.

## Review checklist

Greppable, one line per failure shape, phrased as what the code does. A lane runs its
catalogue's greps, then works this list in full for every file routed here.

- [ ] <what the code does when it breaks rule 1>
- [ ] <what the code does when it breaks rule 2>
