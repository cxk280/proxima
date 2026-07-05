import { meshStatus } from "@/lib/mesh";

export const dynamic = "force-dynamic";

/** Lightweight liveness probe for the ConnectionBanner. */
export function GET() {
  const statuses = meshStatus();
  const degraded = statuses.filter((s) => s.region.health !== "healthy").length;
  return Response.json({ ok: true, regions: statuses.length, degraded });
}
