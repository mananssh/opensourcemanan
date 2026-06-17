import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Changelog store / data-access layer.
 *
 * Source of truth is the repo-root `CHANGELOG.md`, produced by
 * `scripts/compile-changelog.mjs` from `.changeset/*.md`. This module parses
 * that compiled artifact into structured entries so the `/changelog` page (and
 * any future API/RSS feed) renders from one place.
 *
 * IMPORTANT: the parsing here must stay in sync with the line format emitted by
 * `scripts/compile-changelog.mjs`. If you change the generator's output, update
 * `ENTRY_RE` below to match.
 */

// Commit/changeset vocabulary — see agent-kit/commit-and-pr.md#types. `ci` is
// retained only to render historical entries from before `ops` replaced it.
export type ChangeType =
  | "feat"
  | "fix"
  | "refactor"
  | "perf"
  | "style"
  | "test"
  | "docs"
  | "build"
  | "ops"
  | "chore"
  | "ci";

export interface ChangelogEntry {
  time: string; // "HH:MM"
  hash: string; // short git hash
  type: ChangeType;
  summary: string;
  body: string; // markdown, possibly multi-paragraph
}

export interface ChangelogDay {
  date: string; // "YYYY-MM-DD"
  entries: ChangelogEntry[];
}

const CHANGELOG_PATH = join(process.cwd(), "CHANGELOG.md");

// Matches: - **19:53 · `6b71af4` · feat:** Summary text
const ENTRY_RE =
  /^- \*\*(\d{2}:\d{2}) · `([^`]+)` · (\w+):\*\* (.*)$/;
// Matches: ## 2026-06-15
const DATE_RE = /^## (\d{4}-\d{2}-\d{2})\s*$/;

/** Parse the compiled CHANGELOG.md markdown into structured days/entries. */
export function parseChangelog(markdown: string): ChangelogDay[] {
  const lines = markdown.split("\n");
  const days: ChangelogDay[] = [];
  const dayByDate = new Map<string, ChangelogDay>();
  let day: ChangelogDay | null = null;
  let entry: ChangelogEntry | null = null;
  const bodyBuffer: string[] = [];

  const flushBody = () => {
    if (entry) entry.body = bodyBuffer.join("\n").trim();
    bodyBuffer.length = 0;
  };

  for (const line of lines) {
    const dateMatch = line.match(DATE_RE);
    if (dateMatch) {
      flushBody();
      entry = null;
      const date = dateMatch[1];
      // Coalesce repeated date headings into a single day (defensive against
      // older CHANGELOG.md files that have duplicate same-date sections).
      let existing = dayByDate.get(date);
      if (!existing) {
        existing = { date, entries: [] };
        dayByDate.set(date, existing);
        days.push(existing);
      }
      day = existing;
      continue;
    }

    const entryMatch = line.match(ENTRY_RE);
    if (entryMatch && day) {
      flushBody();
      entry = {
        time: entryMatch[1],
        hash: entryMatch[2],
        type: entryMatch[3] as ChangeType,
        summary: entryMatch[4].trim(),
        body: "",
      };
      day.entries.push(entry);
      continue;
    }

    // Body lines are indented two spaces under their entry.
    if (entry && line.startsWith("  ")) {
      bodyBuffer.push(line.slice(2));
    } else if (entry && line.trim() === "") {
      bodyBuffer.push("");
    }
  }
  flushBody();

  return days;
}

/** Read and parse the repo's CHANGELOG.md. Returns [] if it doesn't exist yet. */
export function getChangelog(): ChangelogDay[] {
  if (!existsSync(CHANGELOG_PATH)) return [];
  return parseChangelog(readFileSync(CHANGELOG_PATH, "utf8"));
}
