import { meshStatus } from "@/lib/mesh";

export const dynamic = "force-dynamic";

/** Operational status snapshot of the provisioned mesh (Mesh Status view). */
export function GET() {
  return Response.json({ statuses: meshStatus() });
}
