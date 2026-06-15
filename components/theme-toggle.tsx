"use client";

import { useTheme } from "next-themes";

/**
 * Light/dark toggle — the global theming primitive (ADR 0005). Rendered once in
 * the header. Both icons are rendered and CSS (`.dark`) picks the visible one,
 * so there's no hydration mismatch and no flash — next-themes sets the class
 * before paint. The current theme is only read at click time.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Toggle light or dark theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rule text-ink/70 transition-colors hover:border-accent hover:text-accent"
    >
      <span className="text-[0.95rem] leading-none dark:hidden">☀</span>
      <span className="hidden text-[0.95rem] leading-none dark:inline">☾</span>
    </button>
  );
}
