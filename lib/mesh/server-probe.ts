import "server-only";
import { mesh } from "./simulated-data";
import { haversineKm } from "./geo";
import { REGIONS } from "./regions";
import type { Origin, ProbeOptions, ProbeResult } from "./types";

/**
 * Server-side probe. This is the seam where real Vultr GPU regions plug in.
 *
 * When `PROXIMA_REGION_ENDPOINTS` is set (a JSON map of regionId → probe URL), the
 * backend measures *real* round-trip time to the nearest region's endpoint. Until those
 * regions are deployed it falls back to the reference latency model (great-circle
 * distance → fibre propagation), so the numbers are honest estimates, not fabricated.
 */
function regionEndpoints(): Record<string, string> {
  try {
    return JSON.parse(process.env.PROXIMA_REGION_ENDPOINTS ?? "{}");
  } catch {
    return {};
  }
}

async function measureRttMs(url: string): Promise<number | null> {
  const start = performance.now();
  try {
    const res = await fetch(url, { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(2000) });
    if (!res.ok) return null;
    return Math.round(performance.now() - start);
  } catch {
    return null;
  }
}

export async function serverProbe(origin: Origin, opts: ProbeOptions = {}): Promise<ProbeResult> {
  const modeled = mesh.probe(origin, opts);

  // Real-region path: if the chosen region has a configured endpoint, measure it.
  const endpoints = regionEndpoints();
  const url = endpoints[modeled.region.id];
  if (url) {
    const measured = await measureRttMs(url);
    if (measured != null) {
      return { ...modeled, networkMs: measured, rttMs: measured + modeled.inferenceMs };
    }
  }
  return modeled;
}

export async function serverProbeBatch(
  origins: Origin[],
  opts: ProbeOptions = {},
): Promise<ProbeResult[]> {
  return Promise.all(origins.map((o) => serverProbe(o, opts)));
}

/** Nearest healthy region distance, exported for callers that want the geodesic leg. */
export function nearestRegionKm(origin: Origin): number {
  return Math.min(...REGIONS.map((r) => haversineKm(origin, r)));
}
