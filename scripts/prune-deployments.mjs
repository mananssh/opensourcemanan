#!/usr/bin/env node
/**
 * Prune Vercel deployments: keep ALL production deployments + the most recent
 * preview deployments (PRUNE_KEEP, default 5), delete the rest of the previews.
 * Production is never touched. See ADR 0013.
 *
 * Env: VERCEL_TOKEN (required), VERCEL_PROJECT_ID (required),
 *      VERCEL_TEAM_ID (optional, for team-scoped projects),
 *      PRUNE_KEEP (optional, default 5), DRY_RUN ("1" to only print).
 */
const TOKEN = process.env.VERCEL_TOKEN;
const PROJECT = process.env.VERCEL_PROJECT_ID;
const TEAM = process.env.VERCEL_TEAM_ID;
const KEEP = Number(process.env.PRUNE_KEEP ?? 5);
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

const production = all.filter((d) => d.target === "production");
const previews = all
  .filter((d) => d.target !== "production")
  .sort((a, b) => b.createdAt - a.createdAt);

const keep = previews.slice(0, KEEP);
const toDelete = previews.slice(KEEP);

console.log(
  `total=${all.length}  production=${production.length} (kept)  ` +
    `previews=${previews.length}  keepingLatest=${keep.length}  deleting=${toDelete.length}` +
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
