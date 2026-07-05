import { describe, expect, it } from "vitest";
import { mesh } from "./simulated-data";
import { LEADERBOARD_ORIGINS } from "./origins";
import { US_EAST_REGION_ID } from "./regions";

describe("leaderboard origins", () => {
  it("lands every one of the dozen origins under 40ms on the mesh (12/12)", () => {
    for (const o of LEADERBOARD_ORIGINS) {
      expect(mesh.probe(o).rttMs, `${o.label} should be sub-40ms`).toBeLessThan(40);
    }
  });

  it("blows most of them past 40ms when pinned to a single region", () => {
    const overThreshold = LEADERBOARD_ORIGINS.filter(
      (o) => mesh.probe(o, { pinnedRegionId: US_EAST_REGION_ID }).rttMs >= 40,
    );
    expect(overThreshold.length).toBeGreaterThanOrEqual(10);
  });
});
