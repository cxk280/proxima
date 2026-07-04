import type { GeoPoint } from "./types";

const EARTH_RADIUS_KM = 6371;
const DEG = Math.PI / 180;

/** Great-circle distance between two points, in kilometres (haversine). */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = (b.lat - a.lat) * DEG;
  const dLon = (b.lon - a.lon) * DEG;
  const lat1 = a.lat * DEG;
  const lat2 = b.lat * DEG;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface Projection {
  /** Screen-space centre x. */
  cx: number;
  /** Screen-space centre y. */
  cy: number;
  /** Sphere radius in px. */
  radius: number;
  /** Longitude facing the viewer (the globe's rotation). */
  lon0: number;
  /** Latitude facing the viewer (a slight tilt reads best). */
  lat0: number;
}

export interface ProjectedPoint {
  x: number;
  y: number;
  /** True when the point is on the front (visible) hemisphere. */
  visible: boolean;
}

/**
 * Orthographic projection of a lat/lon point onto the 2-D globe. This is what keeps
 * region dots, arcs, and graticule all consistent on the same sphere.
 */
export function project(p: GeoPoint, proj: Projection): ProjectedPoint {
  const { cx, cy, radius, lon0, lat0 } = proj;
  const lat = p.lat * DEG;
  const lon = p.lon * DEG;
  const l0 = lon0 * DEG;
  const phi0 = lat0 * DEG;
  const dLon = lon - l0;

  const cosc =
    Math.sin(phi0) * Math.sin(lat) + Math.cos(phi0) * Math.cos(lat) * Math.cos(dLon);
  const x = Math.cos(lat) * Math.sin(dLon);
  const y =
    Math.cos(phi0) * Math.sin(lat) - Math.sin(phi0) * Math.cos(lat) * Math.cos(dLon);

  return {
    x: cx + radius * x,
    y: cy - radius * y,
    visible: cosc >= -0.02,
  };
}

/** Longitude that best frames two points on the front hemisphere. */
export function framingLongitude(a: GeoPoint, b: GeoPoint): number {
  // Average the two longitudes on the circle to avoid the antimeridian seam.
  const toXY = (lon: number) => [Math.cos(lon * DEG), Math.sin(lon * DEG)] as const;
  const [ax, ay] = toXY(a.lon);
  const [bx, by] = toXY(b.lon);
  return Math.atan2((ay + by) / 2, (ax + bx) / 2) / DEG;
}

/**
 * Build SVG path strings for the graticule (meridians + parallels) under a projection.
 * Only front-hemisphere segments are emitted, so the wireframe reads as a real sphere.
 */
export function graticulePaths(proj: Projection): string[] {
  const paths: string[] = [];
  const step = 6; // sampling density in degrees

  // Meridians every 30° of longitude.
  for (let lon = -180; lon < 180; lon += 30) {
    paths.push(sampleLine(proj, (t) => ({ lat: t, lon }), -90, 90, step));
  }
  // Parallels every 30° of latitude.
  for (let lat = -60; lat <= 60; lat += 30) {
    paths.push(sampleLine(proj, (t) => ({ lat, lon: t }), -180, 180, step));
  }
  return paths.filter(Boolean);
}

function sampleLine(
  proj: Projection,
  at: (t: number) => GeoPoint,
  from: number,
  to: number,
  step: number,
): string {
  let d = "";
  let penDown = false;
  for (let t = from; t <= to; t += step) {
    const pt = project(at(t), proj);
    if (pt.visible) {
      d += `${penDown ? "L" : "M"}${pt.x.toFixed(1)} ${pt.y.toFixed(1)} `;
      penDown = true;
    } else {
      penDown = false;
    }
  }
  return d.trim();
}
