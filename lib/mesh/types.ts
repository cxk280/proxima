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
  /** How the origin was resolved — drives honest UI labelling: `precise` = browser
   *  geolocation, `ip` = real IP-based lookup, `default` = the hardcoded fallback. */
  source?: "precise" | "ip" | "default";
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
 * A latency value carrying its own provenance. `real` is measured live (the viewer's
 * browser probing a real region responder, or a real server measurement); otherwise it
 * is the physics model's estimate. Carrying provenance on the value — rather than as a
 * sibling boolean — is what makes "an EST number never renders as REAL" a type-level
 * guarantee: a render helper takes a `Latency`, so it must resolve which style to use.
 */
export interface Latency {
  ms: number;
  real: boolean;
}

/**
 * The result of the browser homing the viewer onto a region by *measuring* — the region
 * whose responder answered fastest, plus that real network round-trip. `null` network
 * `real` never occurs here (that path falls back to the modeled estimate instead).
 */
export interface ClientHoming {
  region: Region;
  network: Latency;
}

/**
 * The contract every mesh data source implements. Swap the simulated provider for a
 * real one (probe backend + connect() SDK) without touching the UI.
 */
export interface MeshProvider {
  regions(): Region[];
  probe(origin: Origin, opts?: ProbeOptions): ProbeResult;
}
