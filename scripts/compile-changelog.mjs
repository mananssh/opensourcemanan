#!/usr/bin/env node
// Compiles .changeset/*.md into CHANGELOG.md, then removes the consumed files.
// Format per entry:  HH:MM · <short-hash> · <type>: <summary>
//                      <description>
// Entries are grouped under a `## YYYY-MM-DD` date heading, newest on top.
// Datetime + commit hash are sourced here (not in the changeset files).
//
// Usage: npm run changelog
//
// No external dependencies — minimal frontmatter parsing on purpose.

import { readdirSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const changesetDir = join(root, ".changeset");
const changelogPath = join(root, "CHANGELOG.md");

const TYPES = new Set(["feat", "fix", "refactor", "docs", "test", "chore", "perf", "ci"]);

/** Parse a tiny `--- key: value --- body` frontmatter document. */
function parseChangeset(raw, file) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) throw new Error(`${file}: missing frontmatter block`);
  const [, fm, body] = match;
  const fields = {};
  for (const line of fm.split("\n")) {
    const m = line.match(/^([A-Za-z]+):\s*(.*)$/);
    if (m) fields[m[1]] = m[2].trim();
  }
  if (!fields.type) throw new Error(`${file}: missing 'type'`);
  if (!TYPES.has(fields.type)) throw new Error(`${file}: invalid type '${fields.type}'`);
  if (!fields.summary) throw new Error(`${file}: missing 'summary'`);
  return { type: fields.type, summary: fields.summary, body: body.trim() };
}

function shortHash() {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: root }).toString().trim();
  } catch {
    return "unstaged";
  }
}

const files = existsSync(changesetDir)
  ? readdirSync(changesetDir).filter((f) => f.endsWith(".md") && f !== "README.md")
  : [];

if (files.length === 0) {
  console.log("No changesets to compile.");
  process.exit(0);
}

const now = new Date();
const date = now.toISOString().slice(0, 10); // YYYY-MM-DD
const time = now.toTimeString().slice(0, 5); // HH:MM
const hash = shortHash();

const lines = [];
for (const file of files.sort()) {
  const { type, summary, body } = parseChangeset(readFileSync(join(changesetDir, file), "utf8"), file);
  lines.push(`- **${time} · \`${hash}\` · ${type}:** ${summary}`);
  if (body) {
    for (const para of body.split("\n")) lines.push(`  ${para}`);
  }
}

const newEntries = lines.join("\n");
const dateHeading = `## ${date}`;

const header = "# Changelog\n\n";
let existing = existsSync(changelogPath) ? readFileSync(changelogPath, "utf8") : header;
if (!existing.startsWith("# Changelog")) existing = header + existing;
const body = existing.slice(header.length).replace(/^\n+/, "");

let next;
if (body.startsWith(`${dateHeading}\n`)) {
  // Merge into today's existing section — new entries on top, one heading.
  const afterHeading = body.slice(dateHeading.length).replace(/^\n+/, "");
  next = `${header}${dateHeading}\n\n${newEntries}\n${afterHeading}`;
} else {
  // No section for this date yet — prepend a new one.
  next = `${header}${dateHeading}\n\n${newEntries}\n${body ? "\n" + body : ""}`;
}
writeFileSync(changelogPath, next.endsWith("\n") ? next : next + "\n");

for (const file of files) rmSync(join(changesetDir, file));

console.log(`Compiled ${files.length} changeset(s) into CHANGELOG.md (${date} ${time} · ${hash}).`);
