#!/bin/bash
# Builds the fixture host for a small ticket: the full-review scenario's repo, clean and
# committed on master, with a bare origin so phase 0's pull works offline. FX-12 (the
# mocked ticket) is a one-line change to src/pages/home/HomePage.tsx: profile s.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE="$HERE/../../../evals/scenario-full-review/fixture"
[ -d "$BASE" ] || { echo "base fixture not found at $BASE" >&2; exit 1; }
cp -R "$BASE/." .
# A risk path the ticket does not touch, so the floor is configured but must not fire.
node -e '
const fs = require("fs");
const p = ".claude/sdlc.json";
const m = JSON.parse(fs.readFileSync(p, "utf8"));
m.delivery = { riskPaths: ["src/domain/"] };
fs.writeFileSync(p, JSON.stringify(m, null, 2) + "\n");
'
git init -q -b master
git config user.email eval@example.invalid
git config user.name "Eval Fixture"
git add -A
git commit -q -m "Fixture base"
# Inside .git, so it is never part of the working tree.
git init -q --bare .git/fixture-origin.git
git remote add origin "$PWD/.git/fixture-origin.git"
git push -q origin master
git status --short
