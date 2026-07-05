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
      };
    }
  }
  return DEFAULT_ORIGIN;
}
