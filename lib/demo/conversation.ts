/**
 * A short scripted exchange the reference voice agent plays back. The demo has no real
 * audio model — each push-to-talk turn advances through this deterministic transcript,
 * tagging every agent reply with the region + RTT that "served" it.
 */
export interface Turn {
  user: string;
  agent: string;
}

export const CONVERSATION: Turn[] = [
  {
    user: "What's the weather in Nairobi tonight?",
    agent: "Clear skies and about 18°C after sunset — a light-jacket kind of evening.",
  },
  {
    user: "Set a reminder for 7 AM.",
    agent: "Done. I'll nudge you at 7:00 tomorrow morning.",
  },
  {
    user: "Draft a one-line standup update for me.",
    agent: "\"Shipped the nearest-region router; today I'm load-testing failover.\"",
  },
  {
    user: "Translate \"good luck\" into Swahili.",
    agent: "\"Bahati njema.\" Want me to say it out loud?",
  },
];

/** Turn at a given index, cycling so the demo never runs dry. */
export function turnAt(index: number): Turn {
  return CONVERSATION[index % CONVERSATION.length];
}

/**
 * The voice agent's scripted fallback reply, used when no `ANTHROPIC_API_KEY` is set (or a
 * live call fails). Cycles the canned agent lines by how many user turns have been sent, so
 * the demo still reads as a coherent exchange. The UI tags these replies "demo script".
 */
export function scriptedReply(userTurns: number): string {
  const i = (Math.max(1, userTurns) - 1) % CONVERSATION.length;
  return CONVERSATION[i].agent;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Normalise an untrusted chat body before it reaches the model: keep only well-formed
 * user/assistant turns with non-empty string content, cap each message's length, and cap
 * the number of turns. An untrusted caller can't crash the route or waste a call with
 * garbage shapes or a giant payload.
 */
export function sanitizeChatMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];
  const out: ChatMessage[] = [];
  for (const m of input) {
    if (
      m &&
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" &&
      m.content.trim()
    ) {
      out.push({ role: m.role, content: m.content.slice(0, 4000) });
    }
  }
  return out.slice(-12);
}
