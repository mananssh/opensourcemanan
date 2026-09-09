/**
 * Parse WhatsApp "Export chat" plain-text dumps (without media).
 * Locale date formats vary; we only need sender + body for extraction.
 */

export type WhatsAppMessage = {
  sender: string;
  text: string;
};

const SYSTEM_SNIPPETS = [
  "messages and calls are end-to-end encrypted",
  "created group",
  "added you",
  "left",
  "changed the subject",
  "changed this group's icon",
  "changed the group description",
  "you're now an admin",
  "security code changed",
  "missed voice call",
  "missed video call",
  "this message was deleted",
  "you deleted this message",
  "<media omitted>",
  "image omitted",
  "video omitted",
  "audio omitted",
  "sticker omitted",
  "gif omitted",
  "document omitted",
  "contact card omitted",
];

/** Bracket style: [10/09/2026, 12:14:03 AM] Alice: hello */
const BRACKET_LINE =
  /^\[([^\]]+)\]\s*([^:]+?):\s*(.*)$/;

/** Dash style: 10/09/26, 12:14 - Alice: hello */
const DASH_LINE =
  /^(\d{1,4}[/\-.]\d{1,2}[/\-.]\d{1,4},?\s+\d{1,2}:\d{2}(?:\s*[apAP][mM])?)\s*[-–]\s*([^:]+?):\s*(.*)$/;

function isSystemLine(text: string, sender: string): boolean {
  const lower = text.toLowerCase();
  if (SYSTEM_SNIPPETS.some((s) => lower.includes(s))) return true;
  // WhatsApp system lines often have no real "chat" sender pattern
  if (sender.toLowerCase() === "system") return true;
  return false;
}

export function parseWhatsAppExport(raw: string): WhatsAppMessage[] {
  const lines = raw.replace(/^\uFEFF/, "").split(/\r?\n/);
  const out: WhatsAppMessage[] = [];
  let current: WhatsAppMessage | null = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    let match = line.match(BRACKET_LINE);
    let sender: string | undefined;
    let text: string | undefined;

    if (match) {
      sender = match[2]!.trim();
      text = match[3] ?? "";
    } else {
      match = line.match(DASH_LINE);
      if (match) {
        sender = match[2]!.trim();
        text = match[3] ?? "";
      }
    }

    if (sender !== undefined && text !== undefined) {
      if (current) out.push(current);
      current = { sender, text };
      continue;
    }

    // Continuation of previous multi-line message
    if (current) {
      current.text = `${current.text}\n${line}`;
    }
  }
  if (current) out.push(current);

  return out.filter((m) => m.text.trim() && !isSystemLine(m.text, m.sender));
}

/** Cap + format for model input. Keeps most recent messages when over budget. */
export function formatChatForExtract(
  messages: WhatsAppMessage[],
  maxChars: number,
): string {
  const lines = messages.map((m) => `${m.sender}: ${m.text.trim()}`);
  let joined = lines.join("\n");
  if (joined.length <= maxChars) return joined;

  // Keep the tail (recent chatter)
  const kept: string[] = [];
  let size = 0;
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]!;
    if (size + line.length + 1 > maxChars) break;
    kept.push(line);
    size += line.length + 1;
  }
  return kept.reverse().join("\n");
}

export const MAX_EXPORT_BYTES = 400 * 1024;
export const MAX_EXTRACT_CHARS = 150_000;
