import { describe, expect, it } from "vitest";
import { healthFromReach, meshStatus } from "./status";

describe("healthFromReach", () => {
  it("unreachable → down (regardless of any RTT)", () => {
    expect(healthFromReach(false, null)).toBe("down");
    expect(healthFromReach(false, 30)).toBe("down");
  });

  it("reachable → healthy (incl. no RTT sample, and distant-but-fine)", () => {
    expect(healthFromReach(true, 50)).toBe("healthy");
    expect(healthFromReach(true, null)).toBe("healthy");
    expect(healthFromReach(true, 2199)).toBe("healthy"); // cold-handshake spike, still fine
  });

  it("reachable but near the timeout → degraded (genuinely struggling)", () => {
    expect(healthFromReach(true, 2201)).toBe("degraded");
  });
});

describe("meshStatus (modeled fallback)", () => {
  it("returns a non-empty modeled snapshot tagged real:false", () => {
    const s = meshStatus();
    expect(s.length).toBeGreaterThan(0);
    expect(s.every((x) => x.real === false)).toBe(true);
  });
});
