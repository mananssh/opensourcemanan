import type { ReactNode } from "react";

/**
 * Passthrough shell so ARCD chrome and Blind chrome can live in sibling
 * route-group / segment layouts without nesting headers.
 */
export default function GamesRootLayout({ children }: { children: ReactNode }) {
  return children;
}
