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
 * Fallback origin used when geolocation is denied or unavailable (a coarse IP guess).
 * Deliberately not co-located with any region so the hero still draws a visible
 * origin→region route rather than a degenerate zero-length arc.
 */
export const DEFAULT_ORIGIN: Origin = {
  label: "your IP region",
  lat: 39.74,
  lon: -104.99,
  approximate: true,
};
