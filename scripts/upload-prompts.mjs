#!/usr/bin/env node
/**
 * Upload the owner's private agent prompts to R2 (the production prompt source).
 *
 *   npm run prompts:upload
 *
 * Reads the gitignored `agent.prompts.json` and writes it to the private bucket
 * object named by AGENT_PROMPTS_KEY (default `misc/agent-prompts.json`). The app
 * loads it at runtime via lib/agent/prompts.ts (R2 → AGENT_PROMPTS_B64 →
 * fallbacks), so editing a prompt + re-running this needs NO redeploy.
 *
 * The object is PRIVATE — read server-side via the bucket credentials, never a
 * public URL. Requires R2_ACCOUNT_ID + R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY
 * (+ optional R2_BUCKET), loaded via --env-file. The prompt text never enters the
 * repo or the logs (only its byte size prints).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const SRC = resolve(process.cwd(), "agent.prompts.json");
const BUCKET = process.env.R2_BUCKET ?? "osmprivate"; // prompts are PRIVATE → private bucket
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

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
if (!accountId || !accessKeyId || !secretAccessKey) {
  console.error(
    "✗ R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY in .env — see .env.example.",
  );
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
});

await s3.send(
  new PutObjectCommand({ Bucket: BUCKET, Key: KEY, Body: body, ContentType: "application/json" }),
);

const keys = Object.keys(parsed).length;
console.log(`✓ Uploaded ${keys} prompt(s) (${body.length} bytes) → r2://${BUCKET}/${KEY} (private).`);
console.log("  No redeploy needed — a warm instance picks it up within the prompt cache TTL (~5 min).");
