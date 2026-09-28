#!/usr/bin/env node

// Prints Linear issue counts by status for a project, straight from the
// GraphQL API — bypasses the Linear MCP (which needs a live OAuth session)
// so /linear-stats can run as a plain script. Requires LINEAR_API_KEY.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const manifest = JSON.parse(readFileSync(resolve(process.cwd(), ".claude/sdlc.json"), "utf8"));
const projectName = process.argv.slice(2).join(" ").trim() || manifest.tracker.project;

const apiKey = process.env.LINEAR_API_KEY;
if (!apiKey) {
  console.error(
    "LINEAR_API_KEY is not set. Create a personal API key at " +
      "https://linear.app/settings/api and export it, e.g. in ~/.zshrc:\n" +
      '  export LINEAR_API_KEY="lin_api_..."',
  );
  process.exit(1);
}

const projectQuery = `
  query FindProject($name: String!) {
    projects(filter: { name: { eq: $name } }) {
      nodes {
        id
        name
      }
    }
  }
`;

const issuesQuery = `
  query ProjectIssues($projectId: ID!, $after: String) {
    issues(filter: { project: { id: { eq: $projectId } } }, first: 100, after: $after) {
      nodes {
        state {
          name
          type
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

async function callLinear(query, variables) {
  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.json();
  if (!response.ok || body.errors?.length) {
    console.error(`Linear API request failed: ${response.status} ${response.statusText}`);
    console.error(JSON.stringify(body, null, 2));
    process.exit(1);
  }
  return body.data;
}

const { projects } = await callLinear(projectQuery, { name: projectName });
const project = projects.nodes[0];
if (!project) {
  console.error(`No Linear project found matching name "${projectName}".`);
  process.exit(1);
}

const issues = [];
let after;
for (;;) {
  const { issues: page } = await callLinear(issuesQuery, { projectId: project.id, after });
  issues.push(...page.nodes);
  if (!page.pageInfo.hasNextPage) break;
  after = page.pageInfo.endCursor;
}

const counts = new Map();
for (const issue of issues) {
  const status = issue.state.name;
  counts.set(status, (counts.get(status) ?? 0) + 1);
}

// Order by Linear's own workflow stage, not alphabetically.
const typeOrder = ["backlog", "unstarted", "started", "completed", "canceled", "triage"];
const statusOrder = [...counts.keys()].sort((a, b) => {
  const typeOf = (name) => issues.find((i) => i.state.name === name).state.type;
  return typeOrder.indexOf(typeOf(a)) - typeOrder.indexOf(typeOf(b));
});

console.log(`${project.name} — ${issues.length} tickets\n`);
for (const status of statusOrder) {
  console.log(`${String(counts.get(status)).padStart(3)}  ${status}`);
}
