"use client";

import { useEffect, useState } from "react";
import { REGIONS, type ClientHoming, type Origin } from "@/lib/mesh";
import { fetchEndpoints, homeNearest, measureRegionRtt } from "@/lib/sdk";

// The endpoint map rarely changes within a session — fetch it once and share the promise
// across every hook instance so the first paint pays the round-trip only once. A *failed*
// or empty fetch is NOT cached: the memo is cleared, so the next getEndpoints() call (a
// re-mount or an origin/pin change) re-fetches rather than being stuck on EST forever.
let endpointsPromise: Promise<Record<string, string>> | null = null;
function getEndpoints(): Promise<Record<string, string>> {
  if (!endpointsPromise) {
    endpointsPromise = fetchEndpoints().then((endpoints) => {
      if (Object.keys(endpoints).length === 0) endpointsPromise = null; // allow retry
      return endpoints;
    });
  }
  return endpointsPromise;
}

export interface MeasuredHoming {
  /** The measured homing, or null once resolved with no live responder (caller shows EST). */
  homing: ClientHoming | null;
  /** True once endpoints resolved and a measurement attempt finished — lets the caller
   *  distinguish "still measuring" from "measured, nothing there, use the estimate". */
  resolved: boolean;
}

/**
 * Measure the viewer's *real* latency in the browser and home them onto a region. With a
 * `pinnedRegionId` it measures that region specifically (the contrast/US-East mode);
 * otherwise it homes to the empirically nearest responder. Re-measures when the origin or
 * pin changes and aborts in-flight work on change/unmount. `homing` is null when nothing
 * answered — the caller then renders the modeled estimate (EST) instead.
 */
export function useMeasuredHoming(
  origin: Origin | null,
  opts: { pinnedRegionId?: string; enabled?: boolean } = {},
): MeasuredHoming {
  const { pinnedRegionId, enabled = true } = opts;
  const [homing, setHoming] = useState<ClientHoming | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    // Disabled or no origin → clear any prior measurement so a stale REAL homing can't
    // leak onto a context it doesn't belong to (e.g. switching from "Auto" to a city chip
    // must drop the viewer's real value, not relabel it onto that city).
    if (!origin || !enabled) {
      setHoming(null);
      setResolved(false);
      return;
    }
    const ctrl = new AbortController();
    let live = true;
    setResolved(false);
    setHoming(null);

    (async () => {
      const endpoints = await getEndpoints();
      if (!live) return;
      let result: ClientHoming | null = null;

      if (pinnedRegionId) {
        const url = endpoints[pinnedRegionId];
        const region = REGIONS.find((r) => r.id === pinnedRegionId);
        if (url && region) {
          const ms = await measureRegionRtt(url, ctrl.signal);
          if (ms != null) result = { region, network: { ms, real: true } };
        }
      } else {
        result = await homeNearest(origin, endpoints, REGIONS, ctrl.signal);
      }

      if (live) {
        setHoming(result);
        setResolved(true);
      }
    })();

    return () => {
      live = false;
      ctrl.abort();
    };
  }, [origin, pinnedRegionId, enabled]);

  return { homing, resolved };
}
