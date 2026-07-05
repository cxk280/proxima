import { REGIONS } from "@/lib/mesh";

export const dynamic = "force-dynamic";

/** The mesh region catalog. */
export function GET() {
  return Response.json({ regions: REGIONS });
}
