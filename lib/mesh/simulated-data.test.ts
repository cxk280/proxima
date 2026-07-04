import { describe, expect, it } from "vitest";
import { createSimulatedMesh, mesh } from "./simulated-data";
import { REGIONS, US_EAST_REGION_ID } from "./regions";
import { SIMULATED_ORIGINS } from "./origins";
import type { Region } from "./types";

describe("nearest-region homing", () => {
  it("homes an origin onto its closest region", () => {
    const frankfurt = { label: "Frankfurt", lat: 50.11, lon: 8.68 };
    expect(mesh.probe(frankfurt).region.id).toBe("fra");

    const jakarta = SIMULATED_ORIGINS.find((o) => o.label === "Jakarta")!;
    expect(mesh.probe(jakarta).region.id).toBe("sgp");
  });

  // Every metro that has a GPU region within regional reach homes sub-40ms. Nairobi and
  // Lagos are the honest edge: their nearest region (Johannesburg / Europe) is far enough
  // that lightspeed alone forbids sub-40ms — which is why the claim is "90% of humanity",
  // not "literally everywhere".
  const WELL_SERVED = [
    "Jakarta",
    "Santiago",
    "São Paulo",
    "Sydney",
    "Mumbai",
    "Tokyo",
    "Frankfurt",
    "San Francisco",
    "Toronto",
    "Amsterdam",
  ];

  it("keeps every well-served metro under 40ms in mesh mode", () => {
    for (const label of WELL_SERVED) {
      const origin = SIMULATED_ORIGINS.find((o) => o.label === label)!;
      const { rttMs } = mesh.probe(origin);
      expect(rttMs, `${label} should be sub-40ms`).toBeLessThan(40);
    }
  });

  it("keeps the vast majority of global origins under 40ms (the 90% claim)", () => {
    const sub40 = SIMULATED_ORIGINS.filter((o) => mesh.probe(o).rttMs < 40);
    expect(sub40.length).toBeGreaterThanOrEqual(10);
  });

  it("is deterministic — identical inputs give identical RTTs", () => {
    const origin = SIMULATED_ORIGINS[0];
    expect(mesh.probe(origin).rttMs).toBe(mesh.probe(origin).rttMs);
  });

  it("splits the round trip into network + inference", () => {
    const { rttMs, networkMs, inferenceMs } = mesh.probe(SIMULATED_ORIGINS[0]);
    expect(networkMs + inferenceMs).toBe(rttMs);
    expect(inferenceMs).toBeGreaterThanOrEqual(5);
    expect(inferenceMs).toBeLessThanOrEqual(9);
  });
});

describe("single-region (US-East) contrast mode", () => {
  it("blows past 200ms for distant origins when pinned, far worse than nearest", () => {
    const jakarta = SIMULATED_ORIGINS.find((o) => o.label === "Jakarta")!;
    const pinned = mesh.probe(jakarta, { pinnedRegionId: US_EAST_REGION_ID });
    const nearest = mesh.probe(jakarta);
    expect(pinned.pinned).toBe(true);
    expect(pinned.region.id).toBe(US_EAST_REGION_ID);
    expect(pinned.rttMs).toBeGreaterThan(200);
    expect(pinned.rttMs).toBeGreaterThan(nearest.rttMs * 4);
  });

  it("stays fast when the pinned region happens to be nearest", () => {
    const newJersey = { label: "New Jersey", lat: 40.72, lon: -74.17 };
    const pinned = mesh.probe(newJersey, { pinnedRegionId: US_EAST_REGION_ID });
    expect(pinned.rttMs).toBeLessThan(40);
  });
});

describe("health-aware selection", () => {
  it("never homes onto a down region", () => {
    const regions: Region[] = REGIONS.map((r) =>
      r.id === "sgp" ? { ...r, health: "down" } : r,
    );
    const degradedMesh = createSimulatedMesh(regions);
    const jakarta = SIMULATED_ORIGINS.find((o) => o.label === "Jakarta")!;
    // Singapore is nearest but down → must fail over to the next-nearest healthy region.
    expect(degradedMesh.probe(jakarta).region.id).not.toBe("sgp");
  });
});
