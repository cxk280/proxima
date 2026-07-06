import "server-only";
import { REGIONS } from "./regions";
import { HEALTH_SPARK, healthFromReach, meshStatus, type RegionStatus } from "./status";
import { parseEndpoints } from "./endpoints";

/**
 * Real mesh health, derived from live responder reachability. Each *provisioned* region
 * (one with a configured endpoint in `PROXIMA_REGION_ENDPOINTS`) is HEAD-probed from the
 * app host: reachable → healthy, reachable-but-very-slow → degraded, unreachable → down.
 * `currentRttMs` is the real monitoring round-trip. Capacity / LB nodes / sparkline stay
 * modeled (there is no real GPU telemetry) and the UI tags them as estimates. When no
 * endpoints are configured it falls back to the fully-modeled snapshot (`meshStatus()`).
 *
 * Cached briefly so the top-bar pill polling `/api/health` doesn't re-probe the fleet on
 * every request.
 */

// Stable pseudo-values for the modeled fields, so capacity/nodes don't jitter each poll.
function seed(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

async function reach(url: string): Promise<{ up: boolean; ms: number | null }> {
  const start = performance.now();
  try {
    const res = await fetch(url, { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(2500) });
    return { up: res.ok, ms: Math.round(performance.now() - start) };
  } catch {
    return { up: false, ms: null };
  }
}

let cache: { at: number; data: RegionStatus[] } | null = null;
const TTL_MS = 5000;

export async function meshHealth(): Promise<RegionStatus[]> {
  const endpoints = parseEndpoints(process.env.PROXIMA_REGION_ENDPOINTS);
  const ids = Object.keys(endpoints);
  if (ids.length === 0) return meshStatus(); // modeled EST fallback

  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;

  const data = (
    await Promise.all(
      ids.map(async (id): Promise<RegionStatus | null> => {
        const base = REGIONS.find((r) => r.id === id);
        if (!base) return null;
        const { up, ms } = await reach(endpoints[id]);
        const health = healthFromReach(up, ms);
        const s = seed(id);
        return {
          region: { ...base, health },
          gpu: "Fractional A16",
          capacityPct: up ? 38 + (s % 48) : null, // modeled (est)
          lbNodes: up ? 2 + (s % 2) : 0, // modeled (est)
          currentRttMs: ms, // real monitoring RTT
          sparkline: HEALTH_SPARK[health], // modeled shape
          failover: health === "down" ? "Sessions failed over to the next-nearest region." : null,
          real: true,
        };
      }),
    )
  ).filter((x): x is RegionStatus => x !== null);

  cache = { at: Date.now(), data };
  return data;
}
