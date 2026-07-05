"use client";

import { useEffect, useState } from "react";
import { Globe } from "@/components/globe/Globe";
import { HEALTH_HEX, type Health, type RegionStatus } from "@/lib/mesh";
import { fetchMeshStatus } from "@/lib/sdk";

const HEALTH_LABEL: Record<Health, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  down: "Down",
};

export function MeshStatus() {
  const [statuses, setStatuses] = useState<RegionStatus[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Load the mesh status snapshot from the backend, defaulting the selection to the
  // first non-healthy region so the detail panel opens on something live.
  useEffect(() => {
    let live = true;
    fetchMeshStatus()
      .then((s) => {
        if (!live) return;
        setStatuses(s);
        setSelectedId((s.find((x) => x.region.health !== "healthy") ?? s[0])?.region.id ?? null);
      })
      .catch(() => {})
      .finally(() => live && setLoaded(true));
    return () => {
      live = false;
    };
  }, []);

  if (!loaded) {
    return (
      <section className="flex flex-1 items-center justify-center px-6 py-16">
        <p className="font-mono text-sm text-ink-muted">Loading mesh status…</p>
      </section>
    );
  }

  if (statuses.length === 0) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
        <p className="font-mono text-sm text-ink">No provisioned regions.</p>
        <p className="text-[13px] text-ink-muted">Provision a region to begin — see the docs.</p>
      </section>
    );
  }

  const selected = statuses.find((s) => s.region.id === selectedId) ?? statuses[0];
  const isLive = statuses.length > 0 && statuses.every((s) => s.real);

  const degraded = statuses.filter((s) => s.region.health === "degraded").length;
  const down = statuses.filter((s) => s.region.health === "down").length;
  const overall =
    degraded + down === 0
      ? "all healthy"
      : [degraded && `${degraded} degraded`, down && `${down} down`].filter(Boolean).join(" · ");
  const overallColor = down ? "#f04060" : degraded ? "#fbbf24" : "#22d3ee";

  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 px-6 py-9 sm:px-16">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.02em] text-ink">Mesh Status</h1>
          <p className="mt-1.5 text-[15px] text-ink-secondary">
            {isLive
              ? "Live health of every provisioned region — measured by real probes, not a status page."
              : "Health of every provisioned region in the mesh."}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 self-start rounded-full border border-line bg-panel px-3.5 py-2.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: overallColor, boxShadow: `0 0 6px ${overallColor}` }}
          />
          <span className="font-mono text-xs text-ink">
            {statuses.length} regions · {overall}
          </span>
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-7 lg:flex-row lg:items-start">
        {/* Region list */}
        <div className="flex-1 overflow-hidden rounded-2xl border border-line bg-panel">
          <div className="flex items-center gap-4 border-b border-line bg-elevated px-5 py-3.5 text-[11px] font-medium tracking-wide text-ink-muted">
            <span className="w-[170px] shrink-0">REGION</span>
            <span className="w-[120px] shrink-0">HEALTH</span>
            <span className="w-[90px] shrink-0">CAPACITY</span>
            <span className="w-[110px] shrink-0">LOAD BALANCER</span>
            <span className="flex-1">RECENT RTT{isLive ? " · LIVE" : ""}</span>
          </div>
          {statuses.map((s) => (
            <StatusRow
              key={s.region.id}
              status={s}
              selected={s.region.id === selectedId}
              onSelect={() => setSelectedId(s.region.id)}
            />
          ))}
        </div>

        {/* Globe + detail */}
        <div className="flex flex-col items-center gap-5 lg:w-[480px] lg:shrink-0">
          <Globe
            regions={statuses.map((s) => s.region)}
            region={selected.region}
            rttMs={null}
            accent="#22d3ee"
            size={440}
            className="h-auto w-full max-w-[440px] overflow-visible"
          />
          <DetailCard status={selected} />
        </div>
      </div>
    </section>
  );
}

function StatusRow({
  status,
  selected,
  onSelect,
}: {
  status: RegionStatus;
  selected: boolean;
  onSelect: () => void;
}) {
  const color = HEALTH_HEX[status.region.health];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-4 border-b border-line/60 px-5 py-3.5 text-left transition-colors hover:bg-elevated/40 ${
        selected ? "bg-elevated" : ""
      }`}
      style={selected ? { boxShadow: `inset 3px 0 0 ${color}` } : undefined}
    >
      <span className="w-[170px] shrink-0">
        <span className="block text-sm font-semibold text-ink">{status.region.city}</span>
        <span className="block text-[11px] text-ink-muted">{status.gpu}</span>
      </span>
      <span className="flex w-[120px] shrink-0 items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 5px ${color}` }} />
        <span className="text-[13px] font-medium" style={{ color }}>
          {HEALTH_LABEL[status.region.health]}
        </span>
      </span>
      <span className="w-[90px] shrink-0 font-mono text-[13px] text-ink-secondary">
        {status.capacityPct == null ? "—" : `${status.capacityPct}%`}
      </span>
      <span
        className="w-[110px] shrink-0 text-[13px]"
        style={{ color: status.lbNodes === 0 ? "#f04060" : "#93a1ba" }}
      >
        {status.lbNodes} nodes
      </span>
      <span className="flex-1">
        <Sparkline values={status.sparkline} color={color} />
      </span>
    </button>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const W = 210;
  const H = 26;
  const d = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * W;
      const y = H - v * (H - 3) + 1;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H + 2}`} className="h-7 w-full max-w-[220px]" aria-hidden="true">
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  );
}

function DetailCard({ status }: { status: RegionStatus }) {
  const color = HEALTH_HEX[status.region.health];
  return (
    <div className="flex w-full flex-col gap-4 rounded-2xl border border-line bg-panel p-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">{status.region.city}</h2>
          <p className="font-mono text-xs text-ink-muted">
            {status.region.id} · {status.gpu}
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5"
          style={{ borderColor: `${color}80`, backgroundColor: `${color}1a` }}
        >
          <span className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs font-semibold" style={{ color }}>
            {HEALTH_LABEL[status.region.health]}
          </span>
        </span>
      </div>

      <div className="flex gap-2.5">
        <Stat label="capacity · est" value={status.capacityPct == null ? "—" : `${status.capacityPct}%`} color={color} />
        <Stat
          label={status.real ? "current RTT · live" : "current RTT"}
          value={status.currentRttMs == null ? "—" : `${status.currentRttMs} ms`}
          color={color}
        />
        <Stat label="nodes" value={`${status.lbNodes} / 3`} />
      </div>

      {status.failover && (
        <div
          className="flex items-center gap-2.5 rounded-lg border px-3.5 py-3 text-[13px]"
          style={{ borderColor: `${color}59`, backgroundColor: "#150f04" }}
        >
          <span style={{ color }}>⚑</span>
          <span className="text-ink-secondary">Last failover — {status.failover}</span>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex-1 rounded-lg border border-line bg-inset px-3 py-3">
      <div className="font-mono text-base" style={{ color: color ?? "#e7edf7" }}>
        {value}
      </div>
      <div className="mt-1 text-[11px] font-medium text-ink-muted">{label}</div>
    </div>
  );
}
