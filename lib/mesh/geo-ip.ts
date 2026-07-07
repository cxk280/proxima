import type { Origin } from "./types";
import { DEFAULT_ORIGIN } from "./origins";

/**
 * Derive the visitor's approximate origin from the request's edge-geolocation headers.
 * Most hosts (Vercel, Cloudflare, Railway behind a geo proxy) attach lat/lon headers;
 * we read the common ones and fall back to a coarse default (e.g. on localhost, where
 * there are no geo headers). This is the *real* origin in production.
 */
export function originFromHeaders(h: Headers): Origin {
  const lat = h.get("x-vercel-ip-latitude") ?? h.get("x-geo-latitude") ?? h.get("cf-iplatitude");
  const lon = h.get("x-vercel-ip-longitude") ?? h.get("x-geo-longitude") ?? h.get("cf-iplongitude");
  const city = h.get("x-vercel-ip-city") ?? h.get("x-geo-city");

  if (lat && lon) {
    const latN = Number.parseFloat(lat);
    const lonN = Number.parseFloat(lon);
    if (Number.isFinite(latN) && Number.isFinite(lonN)) {
      return {
        label: city ? decodeURIComponent(city) : "your location",
        lat: latN,
        lon: lonN,
        approximate: true,
        source: "ip",
      };
    }
  }
  return DEFAULT_ORIGIN;
}

/** True for loopback / RFC-1918 private / link-local / ULA addresses — anything that
 *  can't be geolocated (and geolocating it would leak the server's own location). */
export function isPrivateIp(ip: string): boolean {
  const a = ip.trim().toLowerCase();
  if (!a || a === "unknown") return true;
  if (a === "::1" || a.startsWith("127.") || a.startsWith("0.")) return true; // loopback
  if (a.startsWith("10.") || a.startsWith("192.168.") || a.startsWith("169.254.")) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(a)) return true; // 172.16.0.0/12
  if (a.startsWith("fc") || a.startsWith("fd") || a.startsWith("fe80:")) return true; // IPv6 ULA/link-local
  return false;
}

/**
 * The visitor's real client IP as seen behind our reverse proxy. Caddy forwards it via
 * `X-Forwarded-For` (a `client, proxy1, …` chain) or `X-Real-IP`. We take the first
 * *public* address in the chain and skip private/loopback hops; returns null on
 * localhost/dev where there is no public client IP.
 */
export function clientIpFromHeaders(h: Headers): string | null {
  const chain = (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const ip of chain) {
    if (!isPrivateIp(ip)) return ip;
  }
  return null;
}

/** In-process IP → origin cache so repeat visitors don't re-hit the geo provider. */
const IP_CACHE = new Map<string, { origin: Origin; exp: number }>();
const IP_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const IP_LOOKUP_TIMEOUT_MS = 2500;

/**
 * Resolve a public IP to an approximate origin via a keyless HTTPS geo-IP service
 * (ipwho.is). Server-side only — the visitor's browser never talks to the provider.
 * Returns null (caller falls back to {@link DEFAULT_ORIGIN}) on a private IP, a timeout,
 * a provider error, or a malformed response. Results are cached per IP.
 */
export async function originFromIp(ip: string, now: number = Date.now()): Promise<Origin | null> {
  if (isPrivateIp(ip)) return null;

  const hit = IP_CACHE.get(ip);
  if (hit && hit.exp > now) return hit.origin;

  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), IP_LOOKUP_TIMEOUT_MS);
    let data: {
      success?: boolean;
      latitude?: number;
      longitude?: number;
      city?: string;
      region?: string;
      country?: string;
    };
    try {
      const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
        signal: ctl.signal,
        headers: { accept: "application/json" },
      });
      if (!res.ok) return null;
      data = await res.json();
    } finally {
      clearTimeout(timer);
    }

    if (data.success === false) return null;
    const lat = Number(data.latitude);
    const lon = Number(data.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    const origin: Origin = {
      label: data.city || data.region || data.country || "your IP region",
      lat,
      lon,
      approximate: true,
      source: "ip",
    };
    IP_CACHE.set(ip, { origin, exp: now + IP_CACHE_TTL_MS });
    return origin;
  } catch {
    return null; // timeout / network / parse — caller falls back to DEFAULT_ORIGIN
  }
}
