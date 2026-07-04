/**
 * Core mesh types. These describe the *shape* of the data the UI consumes; the
 * simulated provider and any future real probe backend both speak this vocabulary,
 * so the UI never needs to know which is behind it.
 */

/** A region's operational health. cyan/amber/red in the UI. */
export type Health = "healthy" | "degraded" | "down";

/** A point on the globe. */
export interface GeoPoint {
  lat: number;
  lon: number;
}

/** A GPU region in the mesh. */
export interface Region extends GeoPoint {
  /** Short region code, e.g. "fra". */
  id: string;
  /** Human label, e.g. "Frankfurt". */
  city: string;
  health: Health;
}

/** Where the visitor (or a simulated origin) is probing from. */
export interface Origin extends GeoPoint {
  label: string;
  /** True when derived from a coarse IP-region guess rather than precise geolocation. */
  approximate?: boolean;
}

/** The result of homing a session from an origin onto a region. */
export interface ProbeResult {
  origin: Origin;
  region: Region;
  /** Total round-trip time in ms (network + inference). */
  rttMs: number;
  /** Network portion of the round trip. */
  networkMs: number;
  /** In-region inference portion. */
  inferenceMs: number;
  /** True when the session was pinned to a single region rather than nearest-homed. */
  pinned: boolean;
}

export interface ProbeOptions {
  /** Force the session onto a specific region (the "US-East only" contrast mode). */
  pinnedRegionId?: string;
}

/**
 * The contract every mesh data source implements. Swap the simulated provider for a
 * real one (probe backend + connect() SDK) without touching the UI.
 */
export interface MeshProvider {
  regions(): Region[];
  probe(origin: Origin, opts?: ProbeOptions): ProbeResult;
}
