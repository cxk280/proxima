import { originFromHeaders } from "@/lib/mesh/geo-ip";
import { serverProbe } from "@/lib/mesh/server-probe";
import type { Origin } from "@/lib/mesh";

export const dynamic = "force-dynamic";

/**
 * Home a session: given an origin (or the request's geo-IP), return the nearest-region
 * probe result. The client measures the real wire RTT around this call.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    origin?: Origin;
    pinnedRegionId?: string;
  };
  const origin = body.origin ?? originFromHeaders(req.headers);
  const result = await serverProbe(origin, body.pinnedRegionId ? { pinnedRegionId: body.pinnedRegionId } : {});
  return Response.json(result);
}
