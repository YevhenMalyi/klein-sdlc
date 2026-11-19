#!/bin/bash
# Builds the fixture host in the run directory: a tiny repo with rules, catalogues and a
# manifest, one clean commit, then two planted defects left uncommitted.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp -R "$HERE/fixture/." .
git init -q
git config user.email eval@example.invalid
git config user.name "Eval Fixture"
git add -A
git commit -q -m "Fixture base"
# Planted defect 1: the category filter becomes a no-op against a field that is never negative.
sed -i.bak 's/category.publishedPostCount > 0/category.publishedPostCount >= 0/' src/pages/home/load-home.server.ts
# Planted defect 2: a wall-clock read formatted in the render body of a server-rendered page.
sed -i.bak 's|export const HomePage = ({ data }: HomePageProps) => {|export const HomePage = ({ data }: HomePageProps) => {\n  const renderedAt = new Date().toLocaleTimeString();|' src/pages/home/HomePage.tsx
sed -i.bak 's|<h1>Front page</h1>|<h1>Front page</h1>\n      <small>Rendered at {renderedAt}</small>|' src/pages/home/HomePage.tsx
rm -f src/pages/home/*.bak
# Planted defect 3, in a new file left untracked: `git diff` never shows it, so only a review
# that picks up untracked files finds it. Two independent fetches awaited one after the other.
mkdir -p src/pages/about
cat > src/pages/about/load-about.server.ts <<'TS'
declare function getAboutCopy(): Promise<{ body: string }>;
declare function listTeamMembers(): Promise<{ name: string }[]>;

export async function loadAbout() {
  const copy = await getAboutCopy();
  const team = await listTeamMembers();

  return { copy, team };
}
TS
git status --short
