import { serverProbeBatch } from "@/lib/mesh/server-probe";
import type { Origin } from "@/lib/mesh";

export const dynamic = "force-dynamic";

/** Probe many origins at once (the leaderboard sweep). */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    origins?: Origin[];
    pinnedRegionId?: string;
  };
  const origins = body.origins ?? [];
  const results = await serverProbeBatch(
    origins,
    body.pinnedRegionId ? { pinnedRegionId: body.pinnedRegionId } : {},
  );
  return Response.json({ results });
}
