import { haversineKm } from "./geo";
import { REGIONS } from "./regions";
import { DEFAULT_ORIGIN } from "./origins";
import type { MeshProvider, Origin, ProbeOptions, ProbeResult, Region } from "./types";

/**
 * Deterministic latency model. Round-trip network time tracks great-circle distance
 * (~fibre propagation), so the *nearest* of ~two-dozen regions always lands well under
 * 40ms — while pinning a distant origin to one region visibly blows past 200ms.
 *
 * Deterministic on purpose: identical inputs always produce identical RTTs, so the UI
 * doesn't jitter and the tests don't flake.
 */
const NETWORK_BASE_MS = 6;

/**
 * Round-trip fibre propagation (~100 km per ms round trip — light in glass) plus a
 * long-haul routing "stretch" that only bites on trans-oceanic paths, plus fixed
 * switching overhead. This keeps nearest-region homing near the physical floor (well
 * under 40ms for the ~90% of humanity with a region nearby) while making single-region
 * pinning of a distant origin blow past 200ms — exactly as it does in the real world.
 */
function networkMsForKm(km: number): number {
  const propagation = km / 100;
  const stretch = 1 + (Math.max(0, km - 8000) / 8000) * 0.45;
  return Math.round(propagation * stretch + NETWORK_BASE_MS);
}

/** In-region inference cost (fractional A16), 5–9ms, stable per region. */
function inferenceMsForRegion(region: Region): number {
  let hash = 0;
  for (const ch of region.id) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return 5 + (hash % 5);
}

function nearestHealthy(origin: Origin, regions: Region[]): Region {
  const usable = regions.filter((r) => r.health !== "down");
  const pool = usable.length > 0 ? usable : regions;
  return pool.reduce((best, r) =>
    haversineKm(origin, r) < haversineKm(origin, best) ? r : best,
  );
}

export function createSimulatedMesh(regions: Region[] = REGIONS): MeshProvider {
  return {
    regions: () => regions,

    probe(origin: Origin, opts: ProbeOptions = {}): ProbeResult {
      const pinned = Boolean(opts.pinnedRegionId);
      const region = pinned
        ? (regions.find((r) => r.id === opts.pinnedRegionId) ?? nearestHealthy(origin, regions))
        : nearestHealthy(origin, regions);

      const km = haversineKm(origin, region);
      const networkMs = networkMsForKm(km);
      const inferenceMs = inferenceMsForRegion(region);

      return {
        origin,
        region,
        networkMs,
        inferenceMs,
        rttMs: networkMs + inferenceMs,
        pinned,
      };
    },
  };
}

/** The default provider the app uses today. Replace with a real backend later. */
export const mesh: MeshProvider = createSimulatedMesh();

/**
 * Ask our own server for a real IP-based origin (the server does the geo-IP lookup, so
 * the browser never talks to a third party). Falls back to the honest default if the
 * request fails or returns nonsense.
 */
async function ipOrigin(): Promise<Origin> {
  try {
    const res = await fetch("/api/geo", { cache: "no-store" });
    if (res.ok) {
      const o = (await res.json()) as Origin;
      if (Number.isFinite(o?.lat) && Number.isFinite(o?.lon)) return o;
    }
  } catch {
    /* fall through to the default */
  }
  return DEFAULT_ORIGIN;
}

/**
 * Detect the visitor's origin, client-side. Prefers precise browser geolocation; when
 * that's denied/unavailable, falls back to a real IP-based lookup (via `/api/geo`) so the
 * viewer still sees roughly their own location — only dropping to the hardcoded default
 * if the IP lookup also fails.
 */
export async function detectOrigin(): Promise<Origin> {
  if (typeof navigator === "undefined") return DEFAULT_ORIGIN; // SSR guard
  if (!navigator.geolocation) return ipOrigin();
  return new Promise<Origin>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          label: "your location",
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          source: "precise",
        }),
      () => resolve(ipOrigin()),
      { timeout: 4000, maximumAge: 600000 },
    );
  });
}
