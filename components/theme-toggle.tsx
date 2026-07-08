"use client";

import { useTheme } from "next-themes";

/**
 * Light/dark toggle — the global theming primitive (ADR 0005). Rendered once in
 * the header. Both icons are rendered and CSS (`.dark`) picks the visible one,
 * so there's no hydration mismatch and no flash — next-themes sets the class
 * before paint. The current theme is only read at click time.
 *
 * Inline SVGs (not glyphs): the sun/moon Unicode characters carry uneven font
 * metrics and never sat centered in the button; a symmetric viewBox centers
 * perfectly under flex.
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
      {/* Sun — shown in light mode */}
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[1.05rem] w-[1.05rem] dark:hidden"
      >
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.1 5.1l1.55 1.55M17.35 17.35l1.55 1.55M18.9 5.1l-1.55 1.55M6.65 17.35L5.1 18.9" />
      </svg>
      {/* Moon — shown in dark mode */}
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="currentColor"
        className="hidden h-[1.05rem] w-[1.05rem] dark:block"
      >
        <path d="M20.5 13.2A8 8 0 1 1 10.8 3.5a6.2 6.2 0 0 0 9.7 9.7z" />
      </svg>
    </button>
  );
}
