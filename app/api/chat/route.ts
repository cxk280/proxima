import { sanitizeChatMessages, scriptedReply } from "@/lib/demo/conversation";

export const dynamic = "force-dynamic";

// A fast model — this is a real-time *voice* agent, so latency matters (Haiku tier).
const MODEL = "claude-haiku-4-5";
const SYSTEM =
  "You are Proxima's live voice assistant — a demo of sub-40ms edge AI running on a global GPU mesh. " +
  "Reply in one or two short, natural spoken sentences. Be warm, direct, and concise; no markdown, no lists.";

// Cheap global cost guard: this endpoint is unauthenticated and (with a key) spends model
// tokens, so cap the paid path per server process. Over the cap we serve the scripted reply
// instead — the demo keeps working, the bill can't run away.
const RATE_LIMIT = 120;
const WINDOW_MS = 60_000;
let windowStart = 0;
let windowCount = 0;
function overRateLimit(): boolean {
  const now = Date.now();
  if (now - windowStart > WINDOW_MS) {
    windowStart = now;
    windowCount = 0;
  }
  windowCount += 1;
  return windowCount > RATE_LIMIT;
}

/**
 * The voice agent's brain. Given the conversation so far, returns the assistant's reply.
 * With `ANTHROPIC_API_KEY` set (and within the rate cap) it calls Claude (real); otherwise
 * — or on any failure — it returns the scripted demo line marked `real:false`, so the client
 * labels it honestly. The key is never returned or logged.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { messages?: unknown };
  const messages = sanitizeChatMessages(body.messages);
  const fallback = () => Response.json({ text: scriptedReply(messages.filter((m) => m.role === "user").length), real: false });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || messages.length === 0 || overRateLimit()) return fallback();

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 200, system: SYSTEM, messages }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return fallback();

    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = (data.content ?? [])
      .filter((b) => b.type === "text" && b.text)
      .map((b) => b.text)
      .join(" ")
      .trim();

    return text ? Response.json({ text, real: true }) : fallback();
  } catch {
    return fallback();
  }
}
