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
