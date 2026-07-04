import Link from "next/link";
import { mesh } from "@/lib/mesh";

/**
 * Live mesh-status pill in the top bar. Summarises region health from the provider and
 * links to the Mesh Status view.
 */
export function MeshPill() {
  const regions = mesh.regions();
  const degraded = regions.filter((r) => r.health !== "healthy").length;
  const status = degraded === 0 ? "all healthy" : `${degraded} degraded`;
  const ok = degraded === 0;

  return (
    <Link
      href="/mesh"
      className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3.5 py-[7px] transition-colors hover:border-line-strong"
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{
          backgroundColor: ok ? "#22d3ee" : "#fbbf24",
          boxShadow: `0 0 6px ${ok ? "#22d3ee" : "#fbbf24"}`,
        }}
      />
      <span className="font-mono text-xs text-ink">
        {regions.length} regions · {status}
      </span>
    </Link>
  );
}
