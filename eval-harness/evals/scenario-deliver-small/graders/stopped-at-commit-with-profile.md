---
type: llm
focus: last_message
---

PASS if the final message is the report shown before committing and it does all of:
- names the run's profile as `s` (small), with a reason;
- says the acceptance criteria are met in `src/pages/home/HomePage.tsx` (each category chip
  shows its name and published post count);
- gives the gate results and the review verdict;
- asks for the go-ahead before committing or opening a PR.
FAIL if any of these is missing, if it reports committing or opening a PR, or if the run
stopped earlier (for example because a Linear tool was missing).
