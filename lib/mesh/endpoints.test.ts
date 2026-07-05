import { describe, expect, it } from "vitest";
import { parseEndpoints } from "./endpoints";

describe("parseEndpoints", () => {
  it("returns {} for absent / empty / malformed config", () => {
    expect(parseEndpoints(undefined)).toEqual({});
    expect(parseEndpoints("{}")).toEqual({});
    expect(parseEndpoints("not json at all")).toEqual({});
  });

  it("does not throw on valid JSON that isn't a plain object (EC-1 regression)", () => {
    // Object.entries(null) throws — the route must survive a null/primitive/array env.
    expect(parseEndpoints("null")).toEqual({});
    expect(parseEndpoints("5")).toEqual({});
    expect(parseEndpoints("false")).toEqual({});
    expect(parseEndpoints('["https://x.test"]')).toEqual({});
  });

  it("keeps only https string values (mixed-content + type guard)", () => {
    const raw = JSON.stringify({
      ewr: "https://a.test",
      lhr: "http://insecure.test", // mixed content → dropped
      bad: 123, // non-string → dropped
      nul: null, // dropped
    });
    expect(parseEndpoints(raw)).toEqual({ ewr: "https://a.test" });
  });
});
