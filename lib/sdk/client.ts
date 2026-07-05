import type { Origin, ProbeResult, Region, RegionStatus } from "@/lib/mesh";

/** A probe result annotated with the real measured wire RTT to the Proxima edge. */
export interface ProbeReport extends ProbeResult {
  /** Real round-trip time of the HTTP call to the edge (measured, not modeled). */
  measuredEdgeMs: number;
}

async function timedJson<T>(input: string, init?: RequestInit): Promise<[T, number]> {
  const start = performance.now();
  const res = await fetch(input, init);
  if (!res.ok) throw new Error(`${input} → ${res.status}`);
  const data = (await res.json()) as T;
  return [data, Math.round(performance.now() - start)];
}

/** Home a single session onto the nearest region. Origin omitted → server geo-IP. */
export async function probeOnce(origin?: Origin, pinnedRegionId?: string): Promise<ProbeReport> {
  const [data, edge] = await timedJson<ProbeResult>("/api/probe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origin, pinnedRegionId }),
  });
  return { ...data, measuredEdgeMs: edge };
}

/** Probe many origins at once (leaderboard sweep). */
export async function probeBatch(origins: Origin[], pinnedRegionId?: string): Promise<ProbeResult[]> {
  const [data] = await timedJson<{ results: ProbeResult[] }>("/api/probe/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origins, pinnedRegionId }),
  });
  return data.results;
}

export async function fetchRegions(): Promise<Region[]> {
  const [data] = await timedJson<{ regions: Region[] }>("/api/regions");
  return data.regions;
}

export async function fetchMeshStatus(): Promise<RegionStatus[]> {
  const [data] = await timedJson<{ statuses: RegionStatus[] }>("/api/mesh");
  return data.statuses;
}
