import { serverProbe } from "@/lib/mesh/server-probe";
import type { Origin } from "@/lib/mesh";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TICK_MS = 2000;

/**
 * Live session stream (SSE). Emits a probe tick every ~2s with a small measurement
 * jitter on the network leg, so the UI's latency readout updates in real time. The SDK
 * (`connect()`) consumes this; the origin + pin come from the query string.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = Number.parseFloat(url.searchParams.get("lat") ?? "");
  const lon = Number.parseFloat(url.searchParams.get("lon") ?? "");
  const label = url.searchParams.get("label") ?? "your location";
  const pinnedRegionId = url.searchParams.get("pin") || undefined;

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return new Response("lat/lon required", { status: 400 });
  }
  const origin: Origin = { lat, lon, label };
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let open = true;
      const stop = () => {
        open = false;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      req.signal.addEventListener("abort", stop);

      while (open) {
        const base = await serverProbe(origin, pinnedRegionId ? { pinnedRegionId } : {});
        const jitter = Math.round(Math.random() * 4 - 2); // ±2ms measurement noise
        const networkMs = Math.max(1, base.networkMs + jitter);
        const tick = { ...base, networkMs, rttMs: networkMs + base.inferenceMs };
        if (!open) break;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(tick)}\n\n`));
        } catch {
          break;
        }
        await new Promise((r) => setTimeout(r, TICK_MS));
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
