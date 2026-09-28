#!/usr/bin/env node

// Prints the open board for a project, joined against GitHub pull requests, as
// the single input the /whats-next skill reasons over. Closed tickets are
// filtered out server-side — closed tickets dominate a mature board, and
// fetching all of them was the bulk of the skill's cost.
//
// Linear goes through the GraphQL API rather than the Linear MCP: the MCP's
// `state` argument takes one value and cannot express "not completed and not
// canceled". Requires LINEAR_API_KEY. GitHub goes through `gh`, already
// authenticated; if it is missing the ticket half still prints.
import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

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

const PRIORITY_NAMES = ["none", "urgent", "high", "medium", "low"];
const CLOSED_TYPES = new Set(["completed", "canceled"]);

const projectQuery = `
  query FindProject($name: String!) {
    projects(filter: { name: { eq: $name } }) {
      nodes { id name }
    }
  }
`;

// `children` and the relation targets are fetched with their own state so the
// skill can tell a sliced story from an unsliced one, and an open blocker from
// a closed one, without a second round trip per ticket.
const openIssuesQuery = `
  query OpenIssues($projectId: ID!, $after: String) {
    issues(
      filter: {
        project: { id: { eq: $projectId } }
        state: { type: { nin: ["completed", "canceled"] } }
      }
      first: 100
      after: $after
    ) {
      nodes {
        identifier
        title
        url
        priority
        updatedAt
        state { name type }
        assignee { displayName }
        labels { nodes { name } }
        parent { identifier title state { type } }
        children { nodes { identifier state { type } } }
        attachments { nodes { url } }
        relations { nodes { type relatedIssue { identifier title state { type } } } }
        inverseRelations { nodes { type issue { identifier title state { type } } } }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const countsQuery = `
  query ProjectCounts($projectId: ID!, $after: String) {
    issues(filter: { project: { id: { eq: $projectId } } }, first: 250, after: $after) {
      nodes { state { type } }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

async function callLinear(query, variables) {
  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: apiKey },
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

async function paginate(query, projectId) {
  const nodes = [];
  let after;
  for (;;) {
    const { issues } = await callLinear(query, { projectId, after });
    nodes.push(...issues.nodes);
    if (!issues.pageInfo.hasNextPage) break;
    after = issues.pageInfo.endCursor;
  }
  return nodes;
}

async function gh(args) {
  const { stdout } = await run("gh", args, { maxBuffer: 32 * 1024 * 1024 });
  return JSON.parse(stdout);
}

async function fetchPullRequests() {
  const openFields =
    "number,title,url,state,isDraft,mergeable,headRefName,updatedAt,statusCheckRollup,reviewDecision";
  const [open, all] = await Promise.all([
    gh(["pr", "list", "--state", "open", "--limit", "100", "--json", openFields]),
    gh([
      "pr",
      "list",
      "--state",
      "all",
      "--limit",
      "300",
      "--json",
      "number,title,state,mergedAt,headRefName,url",
    ]),
  ]);
  const byNumber = new Map();
  for (const pr of all) byNumber.set(pr.number, pr);
  for (const pr of open) byNumber.set(pr.number, { ...byNumber.get(pr.number), ...pr });
  return byNumber;
}

// An open PR is reported whatever its shape; the reason decides how loudly.
function attentionReason(pr) {
  if (pr.isDraft) return "draft";
  const checks = pr.statusCheckRollup ?? [];
  const verdict = (c) => c.conclusion || c.state || c.status || "";
  const failed = checks.filter((c) =>
    ["FAILURE", "ERROR", "TIMED_OUT", "CANCELLED"].includes(verdict(c)),
  );
  if (failed.length > 0) return `CI failing (${failed.map((c) => c.name || c.context).join(", ")})`;
  if (pr.mergeable === "CONFLICTING") return "conflicts with the base branch";
  if (pr.reviewDecision === "CHANGES_REQUESTED") return "changes requested";
  const pending = checks.filter((c) =>
    ["PENDING", "IN_PROGRESS", "QUEUED", "EXPECTED"].includes(verdict(c)),
  );
  if (pending.length > 0) return "CI still running";
  return "green — ready to merge";
}

function ticketIdsIn(text) {
  return new Set((text ?? "").toUpperCase().match(/\b[A-Z]+-\d+\b/g) ?? []);
}

function linkPullRequests(issues, prsByNumber) {
  const linked = new Map(issues.map((issue) => [issue.identifier, []]));

  for (const issue of issues) {
    for (const attachment of issue.attachments.nodes) {
      const match = /github\.com\/[^/]+\/[^/]+\/pull\/(\d+)/.exec(attachment.url);
      const pr = match && prsByNumber.get(Number(match[1]));
      if (pr) linked.get(issue.identifier).push(pr);
    }
  }

  // Linear only attaches a PR when the integration fires. Branch name and title
  // carry the id too, and catch the ones it missed.
  for (const pr of prsByNumber.values()) {
    const ids = new Set([
      ...ticketIdsIn(pr.title),
      ...ticketIdsIn(pr.headRefName?.replace(/\//g, " ")),
    ]);
    for (const id of ids) {
      const bucket = linked.get(id);
      if (bucket && !bucket.some((p) => p.number === pr.number)) bucket.push(pr);
    }
  }

  return linked;
}

const prState = (pr) => (pr.state === "MERGED" || pr.mergedAt ? "MERGED" : pr.state);

function describe(issue, linkedPrs) {
  const labels = issue.labels.nodes.map((l) => l.name);
  const children = issue.children.nodes;
  const openChildren = children.filter((c) => !CLOSED_TYPES.has(c.state.type));

  const rel = (nodes, key) =>
    nodes
      .filter((n) => n.type === "blocks")
      .map((n) => n[key])
      .map((i) => `${i.identifier}${CLOSED_TYPES.has(i.state.type) ? "(closed)" : "(OPEN)"}`);

  return {
    id: issue.identifier,
    title: issue.title,
    url: issue.url,
    status: issue.state.name,
    statusType: issue.state.type,
    priority: PRIORITY_NAMES[issue.priority] ?? "none",
    labels,
    assignee: issue.assignee?.displayName ?? "-",
    parent: issue.parent ? `${issue.parent.identifier} (${issue.parent.state.type})` : "-",
    childCount: children.length,
    openChildCount: openChildren.length,
    openChildren: openChildren.map((c) => c.identifier),
    blocks: rel(issue.relations.nodes, "relatedIssue"),
    blockedBy: rel(issue.inverseRelations.nodes, "issue"),
    relatedTo: issue.relations.nodes
      .concat(issue.inverseRelations.nodes)
      .filter((n) => n.type !== "blocks")
      .map((n) => n.relatedIssue ?? n.issue)
      .map((i) => `${i.identifier}${CLOSED_TYPES.has(i.state.type) ? "(closed)" : "(OPEN)"}`),
    prs: linkedPrs,
    updatedAt: issue.updatedAt.slice(0, 10),
  };
}

const project = (await callLinear(projectQuery, { name: projectName })).projects.nodes[0];
if (!project) {
  console.error(`No Linear project found matching name "${projectName}".`);
  process.exit(1);
}

const [openIssues, allStates] = await Promise.all([
  paginate(openIssuesQuery, project.id),
  paginate(countsQuery, project.id),
]);

let prsByNumber = new Map();
let ghError = null;
try {
  prsByNumber = await fetchPullRequests();
} catch (error) {
  ghError = error.stderr?.trim() || error.message;
}

const linked = linkPullRequests(openIssues, prsByNumber);
const tickets = openIssues
  .map((issue) => describe(issue, linked.get(issue.identifier)))
  .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

const counts = new Map();
for (const { state } of allStates) counts.set(state.type, (counts.get(state.type) ?? 0) + 1);
const closedCount = [...CLOSED_TYPES].reduce((sum, t) => sum + (counts.get(t) ?? 0), 0);

const out = [];
out.push(`${project.name} — ${tickets.length} open of ${allStates.length} (${closedCount} closed)`);
out.push("");

// --- Pull requests -----------------------------------------------------------

out.push("## Pull requests");
if (ghError) {
  out.push(`  gh unavailable — PR half skipped: ${ghError}`);
} else {
  const openTicketIds = new Set(tickets.map((t) => t.id));
  const ticketOf = new Map();
  for (const t of tickets) for (const pr of t.prs) ticketOf.set(pr.number, t.id);

  const openPrs = [...prsByNumber.values()].filter((pr) => prState(pr) === "OPEN");
  out.push("", "### Open — needs attention");
  if (openPrs.length === 0) out.push("  (none)");
  for (const pr of openPrs.sort((a, b) => b.number - a.number)) {
    const ticket = ticketOf.get(pr.number) ?? "no linked open ticket";
    out.push(`  #${pr.number}  ${ticket}  ${attentionReason(pr)}  ${pr.title}`);
    out.push(`        ${pr.url}`);
  }

  // Code landed, board did not follow.
  out.push("", "### Merged, but ticket is not Done — board drift");
  const drift = tickets.flatMap((t) =>
    t.prs
      .filter((pr) => prState(pr) === "MERGED")
      .map((pr) => `  ${t.id} (${t.status})  #${pr.number}  ${pr.title}`),
  );
  out.push(...(drift.length > 0 ? drift : ["  (none)"]));

  // A PR closed without merging is a deliberate abandonment: the ticket sitting
  // back in Todo is consistent with it, not an anomaly. Listed here only so the
  // skill can see it was considered — it is never reported to the user.
  out.push("", "### Closed unmerged — SILENT, do not report");
  const silent = tickets.flatMap((t) =>
    t.prs
      .filter((pr) => prState(pr) === "CLOSED")
      .map((pr) => {
        const superseded = t.prs.some((other) => prState(other) === "MERGED");
        return `  ${t.id}  #${pr.number}${superseded ? "  (superseded by a merged PR)" : ""}`;
      }),
  );
  out.push(...(silent.length > 0 ? silent : ["  (none)"]));
  void openTicketIds;
}

// --- Tickets -----------------------------------------------------------------

out.push("", "## Open tickets", "");
for (const t of tickets) {
  out.push(`${t.id}  [${t.status}/${t.statusType}]  P:${t.priority}  ${t.title}`);
  out.push(
    `      labels=${t.labels.join(",") || "-"}  assignee=${t.assignee}  parent=${t.parent}  updated=${t.updatedAt}`,
  );
  out.push(
    `      children=${t.childCount} (${t.openChildCount} open${t.openChildCount > 0 ? `: ${t.openChildren.join(",")}` : ""})`,
  );
  out.push(
    `      blockedBy=${t.blockedBy.join(",") || "-"}  blocks=${t.blocks.join(",") || "-"}  related=${t.relatedTo.join(",") || "-"}`,
  );
  const prs = t.prs.map((pr) => `#${pr.number}:${prState(pr)}`).join(" ") || "-";
  out.push(`      prs=${prs}`);
  out.push(`      ${t.url}`);
  out.push("");
}

console.log(out.join("\n"));
