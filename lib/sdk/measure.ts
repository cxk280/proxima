import { haversineKm, type ClientHoming, type Origin, type Region } from "@/lib/mesh";

/**
 * Client-side, per-viewer latency measurement. Unlike the server probe (which measures
 * the *datacenter's* path to a region), this runs in the visitor's browser and measures
 * *their* real round-trip to the region responders — the honest "sub-40ms from where you
 * are" number. Everything here degrades to `null`/`{}` so the caller can fall back to the
 * modeled estimate when no live responder answers.
 */

const SAMPLES = 3; // steady-state samples after one warm-up
const CANDIDATES = 3; // geo-nearest regions to actually measure (avoid cold-handshake contention)
const TIMEOUT_MS = 2500;

// Each probe mints a unique (cache-busted) URL → a Resource Timing entry. Over a long
// session those fill the buffer (~250 default), after which the browser stops recording and
// we silently fall back to jank-prone wall-clock timing. Clear the buffer whenever it fills
// so the network-segment read keeps working. Browser-only; the recent entry is always read
// synchronously right after its fetch, so clearing on "full" never drops one we still need.
if (typeof window !== "undefined") {
  window.performance.addEventListener?.("resourcetimingbufferfull", () => window.performance.clearResourceTimings());
}

function withTimeout(signal?: AbortSignal): AbortSignal {
  const t = AbortSignal.timeout(TIMEOUT_MS);
  return signal ? AbortSignal.any([signal, t]) : t;
}

/**
 * One timed request to a responder. Prefers the network segment from Resource Timing
 * (`responseEnd − requestStart`), which is immune to main-thread jank from the animating
 * globe; falls back to wall-clock when cross-origin timing is unavailable (the responder
 * must send `Timing-Allow-Origin` for the segment to be non-zero). Returns ms, or null on
 * any failure. A unique cache-buster keeps every sample a real round-trip and gives the
 * Resource Timing entry a unique name to read back.
 */
async function timedProbe(url: string, signal?: AbortSignal): Promise<number | null> {
  const busted = `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const start = performance.now();
  try {
    // no custom headers → no CORS preflight; cache option (not header) avoids the same.
    const res = await fetch(busted, { method: "GET", cache: "no-store", mode: "cors", signal: withTimeout(signal) });
    if (!res.ok) return null;
    await res.text(); // drain the body so responseEnd is meaningful
    const wall = performance.now() - start;

    const entry = performance.getEntriesByName(busted).pop() as PerformanceResourceTiming | undefined;
    if (entry && entry.requestStart > 0 && entry.responseEnd > entry.requestStart) {
      return entry.responseEnd - entry.requestStart;
    }
    return wall;
  } catch {
    return null;
  }
}

/**
 * Warm the TCP+TLS connection, then take the best (min) of N steady-state samples — the
 * latency floor. The cold handshake inflates RTT ~4x, so the warm-up sample is discarded.
 * Samples are sequential to reuse the warmed connection. Returns null if it never
 * answered. Guards against mixed content (only https responders are measurable).
 */
export async function measureRegionRtt(url: string, signal?: AbortSignal): Promise<number | null> {
  if (!url.startsWith("https://")) return null;
  await timedProbe(url, signal); // warm-up, discarded
  let best: number | null = null;
  for (let i = 0; i < SAMPLES; i++) {
    if (signal?.aborted) break;
    const ms = await timedProbe(url, signal);
    if (ms != null) best = best == null ? ms : Math.min(best, ms);
  }
  return best == null ? null : Math.round(best);
}

/**
 * Home the viewer by *measuring*: from the geo-nearest regions that have a live responder,
 * measure the real RTT to each and return the fastest as the homed region. The geo-prune
 * keeps it to a few candidates so simultaneous cold handshakes don't contend and skew the
 * ranking. Returns null when no responder answered — the caller then falls back to the
 * modeled estimate (EST).
 */
export async function homeNearest(
  origin: Origin,
  endpoints: Record<string, string>,
  regions: Region[],
  signal?: AbortSignal,
): Promise<ClientHoming | null> {
  const candidates = regions
    .filter((r) => endpoints[r.id])
    .sort((a, b) => haversineKm(origin, a) - haversineKm(origin, b))
    .slice(0, CANDIDATES);
  if (candidates.length === 0) return null;

  const measured = await Promise.allSettled(candidates.map((r) => measureRegionRtt(endpoints[r.id], signal)));

  let best: ClientHoming | null = null;
  measured.forEach((m, i) => {
    if (m.status === "fulfilled" && m.value != null && (!best || m.value < best.network.ms)) {
      best = { region: candidates[i], network: { ms: m.value, real: true } };
    }
  });
  return best;
}

/** Fetch the region → responder URL map (already https-filtered by the backend). */
export async function fetchEndpoints(): Promise<Record<string, string>> {
  try {
    const res = await fetch("/api/endpoints", { cache: "no-store" });
    if (!res.ok) return {};
    const data = (await res.json()) as { endpoints?: Record<string, string> };
    return data.endpoints ?? {};
  } catch {
    return {};
  }
}
