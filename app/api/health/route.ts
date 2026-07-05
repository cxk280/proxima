import { meshHealth } from "@/lib/mesh/server-health";

export const dynamic = "force-dynamic";

/** Liveness + real health summary — feeds the ConnectionBanner and the top-bar MeshPill. */
export async function GET() {
  const s = await meshHealth();
  const healthy = s.filter((x) => x.region.health === "healthy").length;
  const degraded = s.filter((x) => x.region.health === "degraded").length;
  const down = s.filter((x) => x.region.health === "down").length;
  const real = s.length > 0 && s.every((x) => x.real);
  return Response.json({ ok: true, regions: s.length, healthy, degraded, down, real });
}
