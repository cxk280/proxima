import { Fragment } from "react";
import {
  framingLongitude,
  graticulePaths,
  project,
  REGIONS,
  type GeoPoint,
  type Health,
  type Origin,
  type ProjectedPoint,
  type Projection,
  type Region,
} from "@/lib/mesh";

const HEALTH_COLOR: Record<Health, string> = {
  healthy: "#22d3ee",
  degraded: "#fbbf24",
  down: "#f04060",
};

/** A single origin→region link drawn on the globe (used by multi-route views). */
export interface GlobeRoute {
  origin: GeoPoint;
  region: GeoPoint;
  accent?: string;
}

/** Lift an arc off the sphere: push its midpoint away from the globe centre. */
function buildArc(a: ProjectedPoint, b: ProjectedPoint, cx: number, cy: number, lift: number) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = mx - cx;
  const dy = my - cy;
  const len = Math.hypot(dx, dy) || 1;
  const apex = { x: mx + (dx / len) * lift, y: my + (dy / len) * lift };
  const d = `M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${apex.x.toFixed(1)} ${apex.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  return { d, apex };
}

export interface GlobeProps {
  /** Region dots to plot. Defaults to the full mesh. */
  regions?: Region[];
  /** The origin a session is probing from (draws the "You" dot). */
  origin?: Origin | null;
  /** The region that answered (arc target + pulse). */
  region?: Region | null;
  /** RTT to float at the arc's apex, in ms. */
  rttMs?: number | null;
  /** Whether `rttMs` is a real measurement (default) or a modeled estimate — an EST
   *  badge is muted and tagged so it never reads as a live number. */
  real?: boolean;
  /** Colour of the active arc/region (defaults to the region's health colour). */
  accent?: string;
  /** Extra origin→region links to draw (no badge) — used by the leaderboard globe. */
  routes?: GlobeRoute[];
  /** viewBox size in px. */
  size?: number;
  className?: string;
}

/**
 * The animated wireframe globe — the hero of every latency-centric view. Pure and
 * deterministic: it projects lat/lon onto an orthographic sphere and draws the
 * graticule, region dots, and the origin→region arc from props alone (SSR-safe). The
 * arc-draw, pulse, and glow are CSS animations.
 */
export function Globe({
  regions = REGIONS,
  origin = null,
  region = null,
  rttMs = null,
  real = true,
  accent,
  routes,
  size = 520,
  className,
}: GlobeProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.46;

  const lon0 =
    origin && region ? framingLongitude(origin, region) : (region?.lon ?? origin?.lon ?? 10);
  const proj: Projection = { cx, cy, radius, lon0, lat0: 12 };

  const graticule = graticulePaths(proj);
  const arcAccent = accent ?? (region ? HEALTH_COLOR[region.health] : "#22d3ee");

  const originPt = origin ? project(origin, proj) : null;
  const regionPt = region ? project(region, proj) : null;
  const hasArc = originPt?.visible && regionPt?.visible;

  const single = hasArc && originPt && regionPt ? buildArc(originPt, regionPt, cx, cy, radius * 0.22) : null;
  const arcPath = single?.d ?? "";
  const apex = single?.apex ?? { x: cx, y: cy };

  // Multi-route arcs (leaderboard companion globe), projected once here.
  const routeArcs = (routes ?? []).flatMap((r, i) => {
    const o = project(r.origin, proj);
    const g = project(r.region, proj);
    if (!o.visible || !g.visible) return [];
    return [{ i, d: buildArc(o, g, cx, cy, radius * 0.2).d, end: g, accent: r.accent ?? "#35e0a1" }];
  });

  // The apex badge carries provenance: a measured RTT reads in the arc colour, a modeled
  // one is muted and tagged "est" so it can't be mistaken for a live number.
  const badge = rttMs != null ? (real ? `${rttMs} ms` : `${rttMs} ms · est`) : null;
  const badgeW = badge ? badge.length * 8.4 + 22 : 0;
  const badgeColor = real ? arcAccent : "#93a1ba";

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label={
        region && rttMs != null
          ? `Globe showing a ${rttMs}ms route to ${region.city}`
          : "Globe of Proxima's GPU mesh regions"
      }
    >
      <defs>
        <radialGradient id="globe-fill" cx="42%" cy="38%" r="72%">
          <stop offset="0%" stopColor="#18264a" />
          <stop offset="55%" stopColor="#0d1730" />
          <stop offset="100%" stopColor="#0a1022" />
        </radialGradient>
        <filter id="globe-soft-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* Outer glow + sphere */}
      <circle
        className="globe-glow"
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={arcAccent}
        strokeWidth={10}
        opacity={0.5}
        filter="url(#globe-soft-glow)"
      />
      <circle cx={cx} cy={cy} r={radius} fill="url(#globe-fill)" stroke="#22d3ee" strokeOpacity={0.32} strokeWidth={1.5} />

      {/* Graticule */}
      <g stroke="#22d3ee" strokeOpacity={0.16} strokeWidth={1} fill="none">
        {graticule.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      {/* Region dots */}
      <g>
        {regions.map((r) => {
          const p = project(r, proj);
          if (!p.visible) return null;
          const isActive = region?.id === r.id;
          const color = HEALTH_COLOR[r.health];
          return (
            <circle
              key={r.id}
              cx={p.x}
              cy={p.y}
              r={isActive ? 4.5 : 2.6}
              fill={color}
              opacity={isActive ? 1 : 0.7}
            >
              <title>{`${r.city} · ${r.health}`}</title>
            </circle>
          );
        })}
      </g>

      {/* Multi-route arcs (leaderboard) */}
      {routeArcs.length > 0 && (
        <g>
          {routeArcs.map((r) => (
            <Fragment key={r.i}>
              <path
                className="globe-arc"
                d={r.d}
                fill="none"
                stroke={r.accent}
                strokeWidth={1.75}
                strokeLinecap="round"
                opacity={0.85}
                style={{ filter: `drop-shadow(0 0 5px ${r.accent})` }}
              />
              <circle
                cx={r.end.x}
                cy={r.end.y}
                r={3.5}
                fill={r.accent}
                style={{ filter: `drop-shadow(0 0 6px ${r.accent})` }}
              />
            </Fragment>
          ))}
        </g>
      )}

      {/* Origin → region arc */}
      {hasArc && originPt && regionPt && (
        <Fragment>
          {/* pulse ring on the answering region */}
          <circle
            className="globe-pulse"
            cx={regionPt.x}
            cy={regionPt.y}
            r={9}
            fill="none"
            stroke={arcAccent}
            strokeWidth={1.5}
          />
          <path
            className="globe-arc"
            d={arcPath}
            fill="none"
            stroke={arcAccent}
            strokeWidth={2.5}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${arcAccent})` }}
          />
          {/* origin dot */}
          <circle cx={originPt.x} cy={originPt.y} r={5} fill="#0b1224" stroke="#22d3ee" strokeWidth={2} />
          {/* region dot */}
          <circle
            cx={regionPt.x}
            cy={regionPt.y}
            r={5}
            fill={arcAccent}
            style={{ filter: `drop-shadow(0 0 8px ${arcAccent})` }}
          />

          {/* RTT badge at the apex */}
          {badge && (
            <g className="globe-badge" transform={`translate(${apex.x - badgeW / 2}, ${apex.y - 34})`}>
              <rect width={badgeW} height={26} rx={13} fill="#0e1830" stroke={badgeColor} strokeOpacity={0.6} />
              <text
                x={badgeW / 2}
                y={17}
                textAnchor="middle"
                fill={badgeColor}
                fontSize={13}
                fontFamily="var(--font-jetbrains, monospace)"
                fontWeight={500}
              >
                {badge}
              </text>
            </g>
          )}
        </Fragment>
      )}
    </svg>
  );
}
