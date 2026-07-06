import type { Health, Region } from "./types";
import { REGIONS } from "./regions";

/** Operational snapshot for one provisioned region (Mesh Status view). */
export interface RegionStatus {
  region: Region;
  gpu: string;
  /** Null when the region is down. */
  capacityPct: number | null;
  lbNodes: number;
  currentRttMs: number | null;
  /** Recent RTT samples, normalised 0–1, for the sparkline. */
  sparkline: number[];
  /** Last failover note, if any. */
  failover: string | null;
  /** True when health + RTT are measured live (real responder probe); false when this is
   *  the modeled snapshot. Capacity / LB nodes / sparkline are always modeled. */
  real: boolean;
}

const SPARK: Record<Health, number[]> = {
  healthy: [0.22, 0.26, 0.2, 0.28, 0.24, 0.3, 0.22, 0.26, 0.24, 0.2, 0.26, 0.23],
  degraded: [0.3, 0.34, 0.4, 0.46, 0.52, 0.58, 0.62, 0.68, 0.72, 0.76, 0.8, 0.82],
  down: [0.5, 0.6, 0.7, 0.82, 0.92, 1, 0.55, 0.15, 0, 0, 0, 0],
};

function mk(
  id: string,
  health: Health,
  capacityPct: number | null,
  lbNodes: number,
  currentRttMs: number | null,
  failover: string | null = null,
): RegionStatus {
  const base = REGIONS.find((r) => r.id === id)!;
  return {
    region: { ...base, health },
    gpu: "Fractional A16",
    capacityPct,
    lbNodes,
    currentRttMs,
    sparkline: SPARK[health],
    failover,
    real: false, // meshStatus() is the modeled snapshot; meshHealth() sets real:true
  };
}

/** Sparkline shapes by health — shared with the live health prober. */
export const HEALTH_SPARK = SPARK;

/**
 * Map a responder reachability probe to a health state. Reachable → healthy; unreachable
 * → down. "degraded" is reserved for a responder that answers but is *near the probe
 * timeout* (genuinely struggling) — the threshold sits close to the 2500ms timeout so a
 * merely-distant-but-fine region's cold-handshake RTT can't spuriously trip it.
 */
const DEGRADED_MS = 2200;
export function healthFromReach(up: boolean, ms: number | null): Health {
  if (!up) return "down";
  return ms != null && ms > DEGRADED_MS ? "degraded" : "healthy";
}

/**
 * A deterministic snapshot of the provisioned mesh — mostly healthy, with one degraded
 * and one down region so the view exercises every state. (Static demo data; a real
 * control plane would stream this.)
 */
export function meshStatus(): RegionStatus[] {
  return [
    mk("fra", "healthy", 58, 2, 7),
    mk("sgp", "healthy", 71, 3, 9),
    mk("nrt", "healthy", 44, 2, 5),
    mk("sjc", "healthy", 63, 3, 11),
    mk("syd", "healthy", 52, 2, 6),
    mk("bom", "healthy", 39, 2, 9),
    mk("gru", "degraded", 88, 2, 29, "Overflow sessions shifting to Santiago."),
    mk("jnb", "down", null, 0, null, "Sessions failed over to Frankfurt."),
  ];
}

export const HEALTH_HEX: Record<Health, string> = {
  healthy: "#22d3ee",
  degraded: "#fbbf24",
  down: "#f04060",
};
