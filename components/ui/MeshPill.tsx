"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface HealthSummary {
  regions: number;
  degraded: number;
  down: number;
}

/**
 * Live mesh-status pill in the top bar. Polls `/api/health` (real responder reachability)
 * and summarises the provisioned mesh's health, linking to the Mesh Status view.
 */
export function MeshPill() {
  const [h, setH] = useState<HealthSummary | null>(null);

  useEffect(() => {
    let live = true;
    const load = () =>
      fetch("/api/health", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => live && setH(d))
        .catch(() => {});
    load();
    const t = setInterval(load, 10000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, []);

  const color = h && h.down ? "#f04060" : h && h.degraded ? "#fbbf24" : "#22d3ee";
  const status = !h ? "" : h.down ? `${h.down} down` : h.degraded ? `${h.degraded} degraded` : "all healthy";

  return (
    <Link
      href="/mesh"
      className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3.5 py-[7px] transition-colors hover:border-line-strong"
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
      />
      <span className="font-mono text-xs text-ink">
        {h ? `${h.regions} regions · ${status}` : "mesh status"}
      </span>
    </Link>
  );
}
