---
max_turns: 80
timeout_seconds: 1500
allowed_tools: [Read, Glob, Grep, Bash, Agent, Skill, Write, Edit]
tags: [scenario]
---

Run a full review of the uncommitted changes in this repository — `git diff HEAD` — against
its written rules. This is the first review of these changes. Report the findings.
