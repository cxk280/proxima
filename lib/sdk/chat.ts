export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatReply {
  text: string;
  /** True when the reply came from the real Claude model; false = scripted demo fallback. */
  real: boolean;
  /** Real measured round-trip of the /api/chat call, in ms. */
  ms: number;
}

/**
 * Send the conversation to the voice agent's brain (`/api/chat`) and get the assistant's
 * reply, timing the real round-trip. Degrades to an empty scripted-style reply on failure
 * so the caller can fall back to its own scripted line.
 */
export async function chat(messages: ChatTurn[]): Promise<ChatReply> {
  const start = performance.now();
  try {
    // Bounded: a hung /api/chat must not strand the mic on "thinking" — on timeout the
    // fetch aborts, the catch returns real:false, and the caller uses the scripted reply.
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages }),
      signal: AbortSignal.timeout(20000),
    });
    const data = (await res.json()) as { text?: string; real?: boolean };
    return { text: data.text ?? "", real: Boolean(data.real), ms: Math.round(performance.now() - start) };
  } catch {
    return { text: "", real: false, ms: Math.round(performance.now() - start) };
  }
}
