import { geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
// Natural Earth 1:110m land, shipped as TopoJSON (~53 KB). Decoded once at module
// load into a single GeoJSON FeatureCollection we can re-project every frame.
import landTopology from "world-atlas/land-110m.json";
import type { Projection } from "./geo";

const LAND = feature(
  landTopology as unknown as Topology,
  (landTopology as unknown as Topology).objects.land,
);

/**
 * SVG path string for the real-world coastlines under a projection. We build a d3
 * orthographic that is pixel-identical to the hand-rolled {@link project} (same
 * centre, radius, and rotation), so the filled landmasses line up exactly with the
 * region dots, arcs, and graticule on the same sphere. `clipAngle(90)` hides the far
 * hemisphere, so continents clip cleanly at the horizon as the globe is dragged.
 */
export function landPath(proj: Projection): string {
  const { cx, cy, radius, lon0, lat0 } = proj;
  const projection = geoOrthographic()
    .translate([cx, cy])
    .scale(radius)
    .rotate([-lon0, -lat0])
    .clipAngle(90);
  return geoPath(projection)(LAND) ?? "";
}
