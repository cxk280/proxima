import { describe, expect, it } from "vitest";
import { rttBand, rttColor } from "./rtt";

describe("rttBand", () => {
  it("bands sub-40ms as good (cyan)", () => {
    expect(rttBand(0)).toBe("good");
    expect(rttBand(24)).toBe("good");
    expect(rttBand(39)).toBe("good");
    expect(rttColor(24)).toBe("#22d3ee");
  });

  it("bands 40–199ms as warn (amber)", () => {
    expect(rttBand(40)).toBe("warn");
    expect(rttBand(150)).toBe("warn");
    expect(rttColor(150)).toBe("#fbbf24");
  });

  it("bands 200ms+ as bad (red)", () => {
    expect(rttBand(200)).toBe("bad");
    expect(rttBand(247)).toBe("bad");
    expect(rttColor(247)).toBe("#f04060");
  });
});
