import { parseEndpoints } from "@/lib/mesh/endpoints";

export const dynamic = "force-dynamic";

/**
 * The region → probe-responder URL map the browser measures against for real, per-viewer
 * latency. Sourced from `PROXIMA_REGION_ENDPOINTS` (the same seam `server-probe.ts` reads),
 * filtered to https so the browser never attempts a mixed-content fetch from the HTTPS app.
 */
export function GET() {
  return Response.json({ endpoints: parseEndpoints(process.env.PROXIMA_REGION_ENDPOINTS) });
}
