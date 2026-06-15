import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getChangelog, type ChangeType } from "@/lib/changelog";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Everything that has shipped, newest first.",
};

// Tailwind classes per change type. Keep in sync with ChangeType in lib/changelog.ts.
const TYPE_STYLES: Record<ChangeType, string> = {
  feat: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400",
  fix: "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400",
  perf: "bg-violet-500/10 text-violet-600 ring-violet-500/20 dark:text-violet-400",
  refactor: "bg-blue-500/10 text-blue-600 ring-blue-500/20 dark:text-blue-400",
  docs: "bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-400",
  test: "bg-teal-500/10 text-teal-600 ring-teal-500/20 dark:text-teal-400",
  chore: "bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-400",
  ci: "bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-400",
};

const TYPE_LABELS: Record<ChangeType, string> = {
  feat: "Feature",
  fix: "Fix",
  perf: "Performance",
  refactor: "Refactor",
  docs: "Docs",
  test: "Test",
  chore: "Chore",
  ci: "CI",
};

function formatDate(iso: string): string {
  // iso is "YYYY-MM-DD" — render as "June 15, 2026" without timezone drift.
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function ChangelogPage() {
  const days = getChangelog();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-20 sm:py-28">
      <header className="mb-16">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Changelog
        </h1>
        <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
          Everything that has shipped, newest first.
        </p>
      </header>

      {days.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">Nothing shipped yet.</p>
      ) : (
        <div className="space-y-16">
          {days.map((day) => (
            <section
              key={day.date}
              className="lg:grid lg:grid-cols-[8rem_1fr] lg:gap-10"
            >
              <h2 className="mb-6 text-sm font-medium text-zinc-500 lg:sticky lg:top-8 lg:mb-0 lg:self-start dark:text-zinc-400">
                {formatDate(day.date)}
              </h2>

              <ol className="space-y-10 border-l border-zinc-200 pl-6 lg:border-l-0 lg:pl-0 dark:border-zinc-800">
                {day.entries.map((entry, i) => (
                  <li key={`${entry.hash}-${i}`}>
                    <div className="mb-2 flex items-center gap-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TYPE_STYLES[entry.type] ?? TYPE_STYLES.chore}`}
                      >
                        {TYPE_LABELS[entry.type] ?? entry.type}
                      </span>
                      <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
                        {entry.hash}
                      </span>
                    </div>

                    <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                      {entry.summary}
                    </h3>

                    {entry.body && (
                      <div className="mt-2 space-y-3 text-zinc-600 [&_a]:font-medium [&_a]:text-zinc-900 [&_a]:underline [&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm dark:text-zinc-400 dark:[&_a]:text-zinc-100 dark:[&_code]:bg-zinc-800">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {entry.body}
                        </ReactMarkdown>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
