import { clientIpFromHeaders, originFromIp } from "@/lib/mesh/geo-ip";
import { DEFAULT_ORIGIN } from "@/lib/mesh";

export const dynamic = "force-dynamic";

/**
 * Resolve the caller's approximate origin from their real client IP, server-side. The
 * browser calls this only when precise geolocation is denied/unavailable, so it sees
 * roughly its own location without a permission prompt — and the IP → location lookup
 * happens here, never in the browser. Falls back to the honest {@link DEFAULT_ORIGIN}
 * on localhost/private IPs or when the lookup fails.
 */
export async function GET(req: Request) {
  const ip = clientIpFromHeaders(req.headers);
  const origin = ip ? await originFromIp(ip) : null;
  return Response.json(origin ?? DEFAULT_ORIGIN);
}
