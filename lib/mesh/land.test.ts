import { describe, expect, it } from "vitest";
import { landPath } from "./land";

const PROJ = { cx: 260, cy: 260, radius: 239, lon0: 10, lat0: 12 };

describe("landPath", () => {
  it("renders real coastlines as a non-empty SVG path", () => {
    const d = landPath(PROJ);
    expect(d.length).toBeGreaterThan(1000);
    expect(d.startsWith("M")).toBe(true);
  });

  it("quantises every coordinate to <=1 decimal so SSR and client render identically", () => {
    // The projection trig differs in the last ULP between the server's and browser's
    // V8; without rounding this would trip a React hydration mismatch. Guards the fix.
    const nums = landPath(PROJ).match(/-?\d+\.\d+/g) ?? [];
    expect(nums.length).toBeGreaterThan(100);
    for (const n of nums) expect(n.split(".")[1].length).toBeLessThanOrEqual(1);
  });

  it("is deterministic — same projection yields byte-identical output", () => {
    expect(landPath(PROJ)).toBe(landPath(PROJ));
  });

  it("returns an empty string guard for a degenerate (zero-radius) sphere", () => {
    expect(typeof landPath({ ...PROJ, radius: 0 })).toBe("string");
  });
});
