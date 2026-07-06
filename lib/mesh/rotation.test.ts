import { describe, expect, it } from "vitest";
import { dragRotation, LAT0_LIMIT } from "./rotation";

const START = { lon0: 10, lat0: 12 };

describe("dragRotation", () => {
  it("dragging right spins the globe east (longitude decreases)", () => {
    const r = dragRotation(START, 100, 0, 240);
    expect(r.lon0).toBeLessThan(START.lon0);
    expect(r.lat0).toBe(START.lat0);
  });

  it("dragging down tilts the north pole toward the viewer (latitude increases)", () => {
    const r = dragRotation(START, 0, 100, 240);
    expect(r.lat0).toBeGreaterThan(START.lat0);
    expect(r.lon0).toBe(START.lon0);
  });

  it("clamps latitude to the pole limits no matter how far you drag", () => {
    expect(dragRotation(START, 0, 100_000, 240).lat0).toBe(LAT0_LIMIT);
    expect(dragRotation(START, 0, -100_000, 240).lat0).toBe(-LAT0_LIMIT);
  });

  it("scales sensitivity by radius so small and large globes feel the same", () => {
    const small = dragRotation(START, 50, 0, 120).lon0;
    const large = dragRotation(START, 100, 0, 240).lon0;
    // Same fraction of each globe's diameter → same longitude change.
    expect(small).toBeCloseTo(large, 6);
  });

  it("never divides by zero when the radius is degenerate", () => {
    expect(Number.isFinite(dragRotation(START, 10, 10, 0).lon0)).toBe(true);
    expect(Number.isFinite(dragRotation(START, 10, 10, 0).lat0)).toBe(true);
  });
});
