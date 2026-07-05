import "server-only";
import { mesh } from "./simulated-data";
import { haversineKm } from "./geo";
import { REGIONS } from "./regions";
import type { Origin, ProbeOptions, ProbeResult } from "./types";

/**
 * Server-side probe — the **modeled** baseline (physics estimate: great-circle distance →
 * fibre propagation). Real, per-viewer latency is now measured in the *browser* (see
 * `lib/sdk/measure.ts` + `/api/endpoints`), because a datacenter-vantage RTT is not the
 * viewer's and leaks misleading numbers into multi-origin views (e.g. every leaderboard
 * city would show *this server's* distance to the region, not the city's). So the server
 * no longer measures region endpoints itself; these values are the EST fallback the UI
 * tags as estimated. `PROXIMA_REGION_ENDPOINTS` still drives `/api/endpoints`, which is
 * where the browser learns what to measure.
 */
export async function serverProbe(origin: Origin, opts: ProbeOptions = {}): Promise<ProbeResult> {
  return mesh.probe(origin, opts);
}

export async function serverProbeBatch(origins: Origin[], opts: ProbeOptions = {}): Promise<ProbeResult[]> {
  return origins.map((o) => mesh.probe(o, opts));
}

/** Nearest healthy region distance, exported for callers that want the geodesic leg. */
export function nearestRegionKm(origin: Origin): number {
  return Math.min(...REGIONS.map((r) => haversineKm(origin, r)));
}
