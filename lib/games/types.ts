/**
 * Code-first game registry types. Each playable title is a module entry —
 * not a CMS row. See agent-kit/conventions.md (systems, not static pages)
 * and the /games vertical plan.
 */

export type GameAccess = "public" | "authed" | "owner";

export type GameStatus = "live" | "soon";

export type GameDefinition = {
  /** URL segment under /games/[slug]. */
  slug: string;
  title: string;
  /** One-line catalog blurb. */
  blurb: string;
  status: GameStatus;
  /** Declared access for the play surface (catalog itself is public). */
  access: GameAccess;
};
