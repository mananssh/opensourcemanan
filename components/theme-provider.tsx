"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Site-wide theme provider. Light/dark is a mandatory, global primitive
 * (ADR 0005) — this lives once in the root layout so every feature inherits it.
 */
export function ThemeProvider(
  props: ComponentProps<typeof NextThemesProvider>,
) {
  return <NextThemesProvider {...props} />;
}
