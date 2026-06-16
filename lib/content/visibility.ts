import type { Session } from "next-auth";

/**
 * Visibility model shared by all content (ADR-blog). A "gate" is a visibility
 * level + an optional email allowlist. Effective access to a post requires
 * passing BOTH the post's gate and its category's gate (most-restrictive wins),
 * which `canSee`/`canSeePost` enforce by AND-ing the checks — this also handles
 * allowlists correctly (the viewer must be on each relevant list).
 */
export type Visibility = "public" | "authed" | "allowlist" | "owner";

export interface Gate {
  visibility: Visibility;
  allowedEmails: string[];
}

/** Can the viewer pass a single gate? */
export function canSee(session: Session | null, gate: Gate): boolean {
  const email = session?.user?.email?.toLowerCase() ?? null;
  const isOwner = session?.user?.isOwner ?? false;
  switch (gate.visibility) {
    case "public":
      return true;
    case "authed":
      return Boolean(email);
    case "allowlist":
      return (
        isOwner ||
        (!!email &&
          gate.allowedEmails.some((e) => e.toLowerCase() === email))
      );
    case "owner":
      return isOwner;
  }
}

/** Pass the post gate AND (if present) the category gate. */
export function canSeePost(
  session: Session | null,
  post: Gate,
  category: Gate | null,
): boolean {
  return canSee(session, post) && (category ? canSee(session, category) : true);
}

/** Effectively public = both post and category are public (for sitemap/RSS). */
export function isEffectivelyPublic(
  post: Gate,
  category: Gate | null,
): boolean {
  return post.visibility === "public" && (!category || category.visibility === "public");
}

const ORDER: Record<Visibility, number> = {
  public: 0,
  authed: 1,
  allowlist: 2,
  owner: 3,
};

/** The stricter of two visibility levels (most-restrictive wins). */
export function effectiveVisibility(a: Visibility, b: Visibility): Visibility {
  return ORDER[a] >= ORDER[b] ? a : b;
}
