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
}
