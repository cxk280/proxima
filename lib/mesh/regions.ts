import type { Region } from "./types";

/**
 * A representative slice of Vultr's global GPU footprint. Coordinates are the region
 * cities' real lat/lon so nearest-region math and the globe projection line up.
 * All healthy by default; the Mesh Status view overrides individual health states.
 */
export const REGIONS: Region[] = [
  { id: "fra", city: "Frankfurt", lat: 50.11, lon: 8.68, health: "healthy" },
  { id: "lhr", city: "London", lat: 51.5, lon: -0.12, health: "healthy" },
  { id: "ams", city: "Amsterdam", lat: 52.37, lon: 4.9, health: "healthy" },
  { id: "par", city: "Paris", lat: 48.86, lon: 2.35, health: "healthy" },
  { id: "sto", city: "Stockholm", lat: 59.33, lon: 18.07, health: "healthy" },
  { id: "ewr", city: "New Jersey", lat: 40.72, lon: -74.17, health: "healthy" },
  { id: "atl", city: "Atlanta", lat: 33.75, lon: -84.39, health: "healthy" },
  { id: "ord", city: "Chicago", lat: 41.88, lon: -87.63, health: "healthy" },
  { id: "sjc", city: "Silicon Valley", lat: 37.33, lon: -121.89, health: "healthy" },
  { id: "sea", city: "Seattle", lat: 47.6, lon: -122.33, health: "healthy" },
  { id: "mia", city: "Miami", lat: 25.76, lon: -80.19, health: "healthy" },
  { id: "yto", city: "Toronto", lat: 43.65, lon: -79.38, health: "healthy" },
  { id: "gru", city: "São Paulo", lat: -23.55, lon: -46.63, health: "healthy" },
  { id: "scl", city: "Santiago", lat: -33.45, lon: -70.66, health: "healthy" },
  { id: "nrt", city: "Tokyo", lat: 35.68, lon: 139.69, health: "healthy" },
  { id: "icn", city: "Seoul", lat: 37.57, lon: 126.98, health: "healthy" },
  { id: "sgp", city: "Singapore", lat: 1.35, lon: 103.82, health: "healthy" },
  { id: "bom", city: "Mumbai", lat: 19.08, lon: 72.88, health: "healthy" },
  { id: "del", city: "Delhi", lat: 28.61, lon: 77.21, health: "healthy" },
  { id: "syd", city: "Sydney", lat: -33.87, lon: 151.21, health: "healthy" },
  { id: "mel", city: "Melbourne", lat: -37.81, lon: 144.96, health: "healthy" },
  { id: "jnb", city: "Johannesburg", lat: -26.2, lon: 28.04, health: "healthy" },
  { id: "tlv", city: "Tel Aviv", lat: 32.08, lon: 34.78, health: "healthy" },
  { id: "blr", city: "Bangalore", lat: 12.97, lon: 77.59, health: "healthy" },
  { id: "osa", city: "Osaka", lat: 34.69, lon: 135.5, health: "healthy" },
  { id: "waw", city: "Warsaw", lat: 52.23, lon: 21.01, health: "healthy" },
  { id: "mad", city: "Madrid", lat: 40.42, lon: -3.7, health: "healthy" },
  { id: "man", city: "Manchester", lat: 53.48, lon: -2.24, health: "healthy" },
  { id: "hnl", city: "Honolulu", lat: 21.31, lon: -157.86, health: "healthy" },
  { id: "mex", city: "Mexico City", lat: 19.43, lon: -99.13, health: "healthy" },
  { id: "dfw", city: "Dallas", lat: 32.78, lon: -96.8, health: "healthy" },
  { id: "lax", city: "Los Angeles", lat: 34.05, lon: -118.24, health: "healthy" },
  { id: "bkk", city: "Bangkok", lat: 13.76, lon: 100.5, health: "healthy" },
];

/** The single region used for the "US-East only" contrast mode. */
export const US_EAST_REGION_ID = "ewr";
