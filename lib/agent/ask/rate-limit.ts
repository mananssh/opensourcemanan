import "server-only";
import { askRuns } from "@/db/schema";
import { createRateLimiter, asRunTable, hashIp, hashInput, clientIp } from "@/lib/agent/rate-limit";

/**
 * Ask Sully is a multi-turn chat, called far more often than one fit
 * assessment — generous but still bounded caps, and a much smaller per-turn
 * char cap (a chat question, not a pasted job description).
 */
const ASK_DAILY_CAP = Number(process.env.AGENT_ASK_DAILY_CAP ?? 2000);
const ASK_IP_HOURLY_CAP = Number(process.env.AGENT_ASK_IP_HOURLY_CAP ?? 60);
export const MAX_ASK_INPUT_CHARS = Number(process.env.AGENT_ASK_MAX_INPUT_CHARS ?? 600);

export const { checkAndReserve, finishRun } = createRateLimiter({
  table: asRunTable(askRuns),
  dailyCap: ASK_DAILY_CAP,
  ipHourlyCap: ASK_IP_HOURLY_CAP,
});

// Re-exported so `/api/ask` never needs to import the fit-agent's rate-limit module
// directly — same salt/hash implementation, shared so IP hashing is consistent.
export { hashIp, hashInput, clientIp };
