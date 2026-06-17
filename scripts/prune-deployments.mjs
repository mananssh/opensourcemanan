#!/usr/bin/env node
/**
 * Prune Vercel deployments: keep the most recent production deployments
 * (PRUNE_KEEP_PRODUCTION, default 3) + the most recent preview deployments
 * (PRUNE_KEEP, default 5), delete the rest. Recency = createdAt desc, so the
 * latest are kept and the oldest are pruned. See ADR 0013.
 *
 * Env: VERCEL_TOKEN (required), VERCEL_PROJECT_ID (required),
 *      VERCEL_TEAM_ID (optional, for team-scoped projects),
 *      PRUNE_KEEP (optional, default 5 — previews),
 *      PRUNE_KEEP_PRODUCTION (optional, default 3 — production),
 *      DRY_RUN ("1" to only print).
 */
const TOKEN = process.env.VERCEL_TOKEN;
const PROJECT = process.env.VERCEL_PROJECT_ID;
const TEAM = process.env.VERCEL_TEAM_ID;
const KEEP = Number(process.env.PRUNE_KEEP ?? 5);
const KEEP_PRODUCTION = Number(process.env.PRUNE_KEEP_PRODUCTION ?? 3);
const DRY = process.env.DRY_RUN === "1";

if (!TOKEN || !PROJECT) {
  console.error("VERCEL_TOKEN and VERCEL_PROJECT_ID are required.");
  process.exit(1);
}

const BASE = "https://api.vercel.com";
const params = (extra = {}) =>
  new URLSearchParams({
    projectId: PROJECT,
    ...(TEAM ? { teamId: TEAM } : {}),
    ...extra,
  }).toString();

async function api(path, init) {
  const res = await fetch(BASE + path, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    throw new Error(`${path} -> ${res.status} ${await res.text()}`);
  }
  return res.json();
}

// Paginate through all deployments.
const all = [];
let until;
for (;;) {
  const data = await api(
    `/v6/deployments?${params({ limit: "100", ...(until ? { until: String(until) } : {}) })}`,
  );
  all.push(...data.deployments);
  if (!data.pagination?.next) break;
  until = data.pagination.next;
}

const byNewest = (a, b) => b.createdAt - a.createdAt;
const production = all.filter((d) => d.target === "production").sort(byNewest);
const previews = all.filter((d) => d.target !== "production").sort(byNewest);

const toDelete = [
  ...production.slice(KEEP_PRODUCTION),
  ...previews.slice(KEEP),
];

console.log(
  `total=${all.length}  ` +
    `production=${production.length} (keep latest ${Math.min(KEEP_PRODUCTION, production.length)})  ` +
    `previews=${previews.length} (keep latest ${Math.min(KEEP, previews.length)})  ` +
    `deleting=${toDelete.length}` +
    (DRY ? "  [DRY RUN]" : ""),
);

for (const d of toDelete) {
  const when = new Date(d.createdAt).toISOString();
  if (DRY) {
    console.log(`would delete ${d.uid}  ${d.url}  ${when}`);
    continue;
  }
  await api(`/v13/deployments/${d.uid}?${params()}`, { method: "DELETE" });
  console.log(`deleted ${d.uid}  ${d.url}  ${when}`);
}
console.log("done");
