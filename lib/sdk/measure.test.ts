import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Origin, Region } from "@/lib/mesh";
import { fetchEndpoints, homeNearest, measureRegionRtt } from "./measure";

// Regions laid out west→east so distance from the origin is strictly A<B<C<D<E.
const region = (id: string, lon: number): Region => ({ id, city: id.toUpperCase(), lat: 0, lon, health: "healthy" });
const REGIONS: Region[] = [region("a", 1), region("b", 10), region("c", 20), region("d", 80), region("e", 120)];
const ORIGIN: Origin = { label: "you", lat: 0, lon: 0 };
const url = (id: string) => `https://${id}.test`;
const ENDPOINTS = Object.fromEntries(REGIONS.map((r) => [r.id, url(r.id)]));

// A fetch stub with a controllable per-region delay; ids in `fails` reject.
function stubFetch(latencyById: Record<string, number>, fails: string[] = []) {
  const seen: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string) => {
      const id = input.split(".test")[0].replace("https://", "");
      seen.push(id);
      if (fails.includes(id)) throw new Error("unreachable");
      await new Promise((r) => setTimeout(r, latencyById[id] ?? 5));
      return { ok: true, text: async () => "" } as Response;
    }),
  );
  return seen;
}

beforeEach(() => {
  // Force the wall-clock path (no cross-origin Resource Timing in the test runtime).
  vi.spyOn(performance, "getEntriesByName").mockReturnValue([]);
});
afterEach(() => vi.unstubAllGlobals());

describe("measureRegionRtt", () => {
  it("refuses non-https endpoints (mixed-content guard) without any fetch", async () => {
    const seen = stubFetch({});
    expect(await measureRegionRtt("http://insecure.test")).toBeNull();
    expect(seen).toHaveLength(0);
  });

  it("returns a positive measured value for a reachable https responder", async () => {
    stubFetch({ a: 30 });
    const ms = await measureRegionRtt(url("a"));
    expect(ms).not.toBeNull();
    expect(ms!).toBeGreaterThan(0);
  });

  it("returns null when the responder never answers", async () => {
    stubFetch({}, ["a"]);
    expect(await measureRegionRtt(url("a"))).toBeNull();
  });
});

describe("homeNearest", () => {
  it("homes to the lowest measured RTT among the geo-nearest candidates, tagged real", async () => {
    // b is fastest of the 3 nearest (a,b,c). d/e are faster still but too far → pruned.
    const seen = stubFetch({ a: 60, b: 15, c: 90, d: 1, e: 1 });
    const result = await homeNearest(ORIGIN, ENDPOINTS, REGIONS);
    expect(result?.region.id).toBe("b");
    expect(result?.network.real).toBe(true);
    expect(result?.network.ms).toBeGreaterThan(0);
    // pruning: only the 3 nearest were ever measured
    expect(new Set(seen)).toEqual(new Set(["a", "b", "c"]));
    expect(seen).not.toContain("d");
    expect(seen).not.toContain("e");
  });

  it("ranks over successful responders only when one fails", async () => {
    stubFetch({ a: 50, c: 80 }, ["b"]); // nearest b fails → next best is a
    const result = await homeNearest(ORIGIN, ENDPOINTS, REGIONS);
    expect(result?.region.id).toBe("a");
  });

  it("returns null (→ caller uses EST) when no region has an endpoint", async () => {
    const seen = stubFetch({});
    expect(await homeNearest(ORIGIN, {}, REGIONS)).toBeNull();
    expect(seen).toHaveLength(0);
  });

  it("returns null when every candidate responder fails", async () => {
    stubFetch({}, ["a", "b", "c"]);
    expect(await homeNearest(ORIGIN, ENDPOINTS, REGIONS)).toBeNull();
  });
});

describe("fetchEndpoints", () => {
  it("returns the endpoint map on success", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ endpoints: ENDPOINTS }) }) as Response));
    expect(await fetchEndpoints()).toEqual(ENDPOINTS);
  });

  it("degrades to an empty map on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, json: async () => ({}) }) as Response));
    expect(await fetchEndpoints()).toEqual({});
  });
});
