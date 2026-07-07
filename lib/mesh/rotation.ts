/** Manual globe orientation a viewer sets by dragging: the lon/lat facing them. */
export interface Rotation {
  lon0: number;
  lat0: number;
}

/** Degrees the globe spins per pixel dragged, before scaling by the sphere radius so
 *  the feel is consistent across globe sizes (a full-diameter swipe ≈ 150°). */
export const DRAG_DEG_PER_PX = 75;
/** Keep the tilt away from the poles so the graticule never flips inside-out. */
export const LAT0_LIMIT = 80;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * New rotation after a drag gesture. From the orientation captured when the drag
 * started, spin longitude by the horizontal pixel delta and tilt latitude by the
 * vertical delta (clamped near the poles). `radius` scales the sensitivity so a small
 * globe and a large one feel the same. Pure — the component just feeds it deltas.
 */
export function dragRotation(start: Rotation, dx: number, dy: number, radius: number): Rotation {
  const perPx = DRAG_DEG_PER_PX / (radius || 1);
  return {
    // Drag right spins east; drag down tips the north pole toward the viewer.
    lon0: start.lon0 - dx * perPx,
    lat0: clamp(start.lat0 + dy * perPx, -LAT0_LIMIT, LAT0_LIMIT),
  };
}
