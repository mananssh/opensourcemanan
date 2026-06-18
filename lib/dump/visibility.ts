import type { Gate } from "@/lib/content/visibility";

/**
 * Map a thought's 2-mode visibility onto the shared content gate:
 *   - public  → `authed`  (any signed-in user; anonymous sees nothing)
 *   - private → `owner`
 * So Thought Dump reuses lib/content/visibility (canSee) with no new auth logic.
 */
export function thoughtGate(visibility: "public" | "private"): Gate {
  return {
    visibility: visibility === "public" ? "authed" : "owner",
    allowedEmails: [],
  };
}
