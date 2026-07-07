import { afterEach, describe, expect, it, vi } from "vitest";
import { clientIpFromHeaders, isPrivateIp, originFromHeaders, originFromIp } from "./geo-ip";

const H = (init: Record<string, string>) => new Headers(init);

afterEach(() => vi.unstubAllGlobals());

describe("isPrivateIp", () => {
  it("flags loopback, RFC-1918, link-local, and IPv6 ULA", () => {
    for (const ip of ["127.0.0.1", "::1", "10.1.2.3", "192.168.0.5", "172.16.0.1", "172.31.9.9", "169.254.1.1", "fd00::1", "fe80::1", ""]) {
      expect(isPrivateIp(ip)).toBe(true);
    }
  });
  it("passes public addresses", () => {
    for (const ip of ["8.8.8.8", "1.1.1.1", "172.15.0.1", "172.32.0.1", "2606:4700::1"]) {
      expect(isPrivateIp(ip)).toBe(false);
    }
  });
});

describe("clientIpFromHeaders", () => {
  it("takes the first public hop from X-Forwarded-For", () => {
    expect(clientIpFromHeaders(H({ "x-forwarded-for": "8.8.8.8, 10.0.0.1" }))).toBe("8.8.8.8");
  });
  it("skips leading private hops", () => {
    expect(clientIpFromHeaders(H({ "x-forwarded-for": "10.0.0.1, 203.0.113.7" }))).toBe("203.0.113.7");
  });
  it("falls back to X-Real-IP", () => {
    expect(clientIpFromHeaders(H({ "x-real-ip": "203.0.113.9" }))).toBe("203.0.113.9");
  });
  it("returns null on localhost/private-only (dev)", () => {
    expect(clientIpFromHeaders(H({ "x-forwarded-for": "127.0.0.1" }))).toBeNull();
    expect(clientIpFromHeaders(H({}))).toBeNull();
  });
});

describe("originFromIp", () => {
  it("returns null for a private IP without hitting the network", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await originFromIp("10.0.0.1")).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("maps a successful lookup to an ip-sourced origin", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ success: true, latitude: 32.5, longitude: -92.1, city: "Monroe" }))));
    const o = await originFromIp("203.0.113.10");
    expect(o).toMatchObject({ lat: 32.5, lon: -92.1, label: "Monroe", approximate: true, source: "ip" });
  });

  it("returns null on a provider failure response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ success: false }))));
    expect(await originFromIp("203.0.113.11")).toBeNull();
  });

  it("returns null when the lookup throws (timeout/network)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("aborted"); }));
    expect(await originFromIp("203.0.113.12")).toBeNull();
  });

  it("caches by IP — a second call does not re-fetch", async () => {
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify({ success: true, latitude: 1, longitude: 2, city: "X" })));
    vi.stubGlobal("fetch", fetchSpy);
    await originFromIp("203.0.113.13");
    await originFromIp("203.0.113.13");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

describe("originFromHeaders", () => {
  it("tags edge-header origins as ip-sourced", () => {
    const o = originFromHeaders(H({ "x-vercel-ip-latitude": "40.7", "x-vercel-ip-longitude": "-74", "x-vercel-ip-city": "New%20York" }));
    expect(o).toMatchObject({ lat: 40.7, lon: -74, label: "New York", source: "ip" });
  });
  it("falls back to the honest default when no headers are present", () => {
    expect(originFromHeaders(H({})).source).toBe("default");
  });
});
