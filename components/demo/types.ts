export type MicState = "idle" | "listening" | "thinking" | "speaking" | "denied";

export interface TranscriptEntry {
  id: number;
  role: "user" | "agent" | "system";
  text: string;
  /** Region + RTT that served an agent reply. */
  region?: string;
  rttMs?: number;
  /** Accent colour reflecting the RTT band at the time of the reply. */
  accent?: string;
  /** For an agent reply: true when it came from the real Claude model, false when it's
   *  the scripted demo fallback (no API key). Drives the "Claude" vs "demo script" tag. */
  real?: boolean;
}
