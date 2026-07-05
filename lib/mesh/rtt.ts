/**
 * RTT banding — the single source of truth for how a round-trip time maps to the
 * mission-control palette. sub-40ms = cyan (the promise), 40–200ms = amber (a distant
 * single-region hop), 200ms+ = red (what single-region GPU hosting feels like).
 */
export type RttBand = "good" | "warn" | "bad";

export function rttBand(rttMs: number): RttBand {
  if (rttMs < 40) return "good";
  if (rttMs < 200) return "warn";
  return "bad";
}

export const RTT_COLOR: Record<RttBand, string> = {
  good: "#22d3ee",
  warn: "#fbbf24",
  bad: "#f04060",
};

export function rttColor(rttMs: number): string {
  return RTT_COLOR[rttBand(rttMs)];
}
