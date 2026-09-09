import { NextResponse } from "next/server";
import { extractPackFromChat, hasBlindModelLane } from "@/lib/games/blind/extract";
import { checkExtractRateLimit, clientIp } from "@/lib/games/blind/rate-limit";
import {
  formatChatForExtract,
  MAX_EXPORT_BYTES,
  MAX_EXTRACT_CHARS,
  parseWhatsAppExport,
} from "@/lib/games/blind/whatsapp-parse";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * One-shot WhatsApp → Blind pack. Does not store chat or pack.
 * Body: multipart `file` (.txt) or JSON `{ text: string }`.
 */
export async function POST(req: Request) {
  if (!hasBlindModelLane()) {
    return NextResponse.json(
      {
        error:
          "No model lane configured. Set OPENCODE_ZEN_API_KEY and/or NVIDIA_NIM_API_KEY.",
      },
      { status: 503 },
    );
  }

  const ip = clientIp(req.headers);
  if (!checkExtractRateLimit(ip).ok) {
    return NextResponse.json(
      { error: "Rate limit — try again later." },
      { status: 429 },
    );
  }

  let rawText: string;
  const contentType = req.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Expected file field" }, { status: 400 });
      }
      if (file.size > MAX_EXPORT_BYTES) {
        return NextResponse.json(
          { error: `Export too large (max ${MAX_EXPORT_BYTES} bytes). Export without media.` },
          { status: 400 },
        );
      }
      const name = file.name.toLowerCase();
      if (name.endsWith(".zip")) {
        return NextResponse.json(
          { error: "Zip/media exports not supported — use Export chat without media (.txt)." },
          { status: 400 },
        );
      }
      rawText = await file.text();
    } else {
      const body = (await req.json()) as { text?: unknown };
      if (typeof body.text !== "string" || !body.text.trim()) {
        return NextResponse.json({ error: "Expected { text: string }" }, { status: 400 });
      }
      if (new TextEncoder().encode(body.text).length > MAX_EXPORT_BYTES) {
        return NextResponse.json({ error: "Text too large" }, { status: 400 });
      }
      rawText = body.text;
    }
  } catch {
    return NextResponse.json({ error: "Could not read request body" }, { status: 400 });
  }

  const messages = parseWhatsAppExport(rawText);
  if (messages.length < 5) {
    return NextResponse.json(
      {
        error:
          "Not enough chat messages after parsing. Use a WhatsApp .txt export (without media).",
      },
      { status: 400 },
    );
  }

  const chatText = formatChatForExtract(messages, MAX_EXTRACT_CHARS);

  try {
    const pack = await extractPackFromChat(chatText);
    // Request body / chatText are locals only — never written to DB/R2.
    return NextResponse.json(pack);
  } catch (err) {
    console.error("[blind:extract]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Extract failed — try again or use the default pack." },
      { status: 502 },
    );
  }
}
