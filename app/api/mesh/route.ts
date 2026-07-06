import { meshHealth } from "@/lib/mesh/server-health";

export const dynamic = "force-dynamic";

/** Operational status of the provisioned mesh — health/RTT probed live (Mesh Status view). */
export async function GET() {
  return Response.json({ statuses: await meshHealth() });
}
