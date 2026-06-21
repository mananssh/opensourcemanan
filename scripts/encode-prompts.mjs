#!/usr/bin/env node
/**
 * Encode the owner's private agent prompts into AGENT_PROMPTS_B64.
 *
 *   node scripts/encode-prompts.mjs
 *
 * Reads the gitignored `agent.prompts.json` (a map of node → prompt template with
 * {{placeholders}}), base64-encodes the minified JSON, and writes/updates the
 * AGENT_PROMPTS_B64 line in `.env`. For production, copy that value into the
 * Vercel project env. The prompt text never enters the repo — `lib/agent/prompts.ts`
 * ships only generic fallbacks. The value is not printed (it's your private IP).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const SRC = resolve(root, "agent.prompts.json");
const ENV = resolve(root, ".env");
const KEY = "AGENT_PROMPTS_B64";

if (!existsSync(SRC)) {
  console.error(`✗ ${SRC} not found. Create agent.prompts.json (see lib/agent/prompts.ts for the keys).`);
  process.exit(1);
}

let parsed;
try {
  parsed = JSON.parse(readFileSync(SRC, "utf8"));
} catch (e) {
  console.error(`✗ agent.prompts.json is not valid JSON: ${e.message}`);
  process.exit(1);
}

const b64 = Buffer.from(JSON.stringify(parsed), "utf8").toString("base64");
const line = `${KEY}="${b64}"`;

let env = existsSync(ENV) ? readFileSync(ENV, "utf8") : "";
const re = new RegExp(`^${KEY}=.*$`, "m");
if (re.test(env)) {
  env = env.replace(re, line);
} else {
  env += `${env.endsWith("\n") || env === "" ? "" : "\n"}${line}\n`;
}
writeFileSync(ENV, env);

const keys = Object.keys(parsed).length;
console.log(`✓ Encoded ${keys} prompt(s) → ${KEY} written to .env (${b64.length} chars).`);
console.log("  For production: copy that line's value into the Vercel project env.");
