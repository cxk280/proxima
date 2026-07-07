import type { Origin } from "./types";

/**
 * Simulated origins for the demo/leaderboard "pick a city" experience. Deliberately
 * spread across underserved geographies — the places that eat 200ms+ on single-region
 * GPU hosting — so the sub-40ms claim lands.
 */
export const SIMULATED_ORIGINS: Origin[] = [
  { label: "Nairobi", lat: -1.29, lon: 36.82 },
  { label: "Jakarta", lat: -6.21, lon: 106.85 },
  { label: "Santiago", lat: -33.45, lon: -70.66 },
  { label: "São Paulo", lat: -23.55, lon: -46.63 },
  { label: "Sydney", lat: -33.87, lon: 151.21 },
  { label: "Mumbai", lat: 19.08, lon: 72.88 },
  { label: "Lagos", lat: 6.52, lon: 3.38 },
  { label: "Tokyo", lat: 35.68, lon: 139.69 },
  { label: "Frankfurt", lat: 50.11, lon: 8.68 },
  { label: "San Francisco", lat: 37.77, lon: -122.42 },
  { label: "Toronto", lat: 43.65, lon: -79.38 },
  { label: "Amsterdam", lat: 52.37, lon: 4.9 },
];

/**
 * Origins for the "Sub-40ms Anywhere" leaderboard — a dozen cities spread across six
 * continents, each far enough from its serving region to make the point but within
 * regional reach, so every one honestly lands under 40ms on the nearest-region mesh.
 */
export const LEADERBOARD_ORIGINS: Origin[] = [
  { label: "Jakarta", lat: -6.21, lon: 106.85 },
  { label: "Manila", lat: 14.6, lon: 120.98 },
  { label: "Hanoi", lat: 21.03, lon: 105.85 },
  { label: "Karachi", lat: 24.86, lon: 67.0 },
  { label: "Dubai", lat: 25.2, lon: 55.27 },
  { label: "Cairo", lat: 30.04, lon: 31.24 },
  { label: "Istanbul", lat: 41.01, lon: 28.98 },
  { label: "Lisbon", lat: 38.72, lon: -9.14 },
  { label: "Bogotá", lat: 4.71, lon: -74.07 },
  { label: "Buenos Aires", lat: -34.6, lon: -58.38 },
  { label: "Cape Town", lat: -33.92, lon: 18.42 },
  { label: "Auckland", lat: -36.85, lon: 174.76 },
];

/**
 * Last-resort fallback used only when BOTH precise geolocation and the IP-based lookup
 * fail (e.g. on localhost, where there is no public client IP). `source: "default"` keeps
 * the UI honest — it is labelled as an approximate default, never claimed as the viewer's
 * real IP region. Deliberately not co-located with any region so the hero still draws a
 * visible origin→region route rather than a degenerate zero-length arc.
 */
export const DEFAULT_ORIGIN: Origin = {
  label: "an approximate location",
  lat: 39.74,
  lon: -104.99,
  approximate: true,
  source: "default",
};
