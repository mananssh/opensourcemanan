#!/usr/bin/env node
/**
 * Upload the owner's private agent prompts to GCS (the production prompt source).
 *
 *   npm run prompts:upload
 *
 * Reads the gitignored `agent.prompts.json` and writes it to the private bucket
 * object named by AGENT_PROMPTS_KEY (default `misc/agent-prompts.json`). The app
 * loads it at runtime via lib/agent/prompts.ts (GCS → AGENT_PROMPTS_B64 →
 * fallbacks), so editing a prompt + re-running this needs NO redeploy.
 *
 * The object is PRIVATE — read server-side via the service account, never a
 * public URL. Requires GCP_SERVICE_ACCOUNT + GCS_BUCKET (loaded via --env-file).
 * The prompt text never enters the repo or the logs (only its byte size prints).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Storage } from "@google-cloud/storage";

const SRC = resolve(process.cwd(), "agent.prompts.json");
const BUCKET = process.env.GCS_BUCKET ?? "opensourcemanan";
const KEY = process.env.AGENT_PROMPTS_KEY ?? "misc/agent-prompts.json";

if (!existsSync(SRC)) {
  console.error(`✗ ${SRC} not found. Create agent.prompts.json (see lib/agent/prompts.ts for the keys).`);
  process.exit(1);
}

const raw = readFileSync(SRC, "utf8");
let parsed;
try {
  parsed = JSON.parse(raw);
} catch (e) {
  console.error(`✗ agent.prompts.json is not valid JSON: ${e.message}`);
  process.exit(1);
}
// Re-serialize (minified) so we upload canonical JSON, not whatever whitespace the file had.
const body = JSON.stringify(parsed);

const saRaw = process.env.GCP_SERVICE_ACCOUNT;
if (!saRaw) {
  console.error("✗ GCP_SERVICE_ACCOUNT is not set. Add it to .env (raw JSON or base64) — see .env.example.");
  process.exit(1);
}
const sa = (() => {
  const t = saRaw.trim();
  if (t.startsWith("{")) return JSON.parse(t);
  return JSON.parse(Buffer.from(saRaw, "base64").toString("utf8"));
})();

const storage = new Storage({
  projectId: sa.project_id,
  credentials: { client_email: sa.client_email, private_key: sa.private_key },
});

await storage.bucket(BUCKET).file(KEY).save(body, { contentType: "application/json", resumable: false });

const keys = Object.keys(parsed).length;
console.log(`✓ Uploaded ${keys} prompt(s) (${body.length} bytes) → gs://${BUCKET}/${KEY} (private).`);
console.log("  No redeploy needed — a warm instance picks it up within the prompt cache TTL (~5 min).");
