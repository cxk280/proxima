"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Globe } from "@/components/globe/Globe";
import {
  DEFAULT_ORIGIN,
  detectOrigin,
  haversineKm,
  REGIONS,
  rttBand,
  rttColor,
  SIMULATED_ORIGINS,
  US_EAST_REGION_ID,
  type Origin,
  type ProbeResult,
} from "@/lib/mesh";
import { connect, type Session } from "@/lib/sdk";
import { turnAt } from "@/lib/demo/conversation";
import { OriginSelector } from "./OriginSelector";
import { MicControl } from "./MicControl";
import { RoundTripReadout } from "./RoundTripReadout";
import { ContrastToggle } from "./ContrastToggle";
import { Transcript } from "./Transcript";
import type { MicState, TranscriptEntry } from "./types";

// The chip row: Auto + a spread of underserved origins that make the point.
const CHIP_CITIES = ["Nairobi", "Jakarta", "Santiago", "São Paulo", "Sydney"];
const CHIP_ORIGINS = CHIP_CITIES.map((c) => SIMULATED_ORIGINS.find((o) => o.label === c)!);

export function VoiceAgentDemo() {
  const [autoOrigin, setAutoOrigin] = useState<Origin | null>(null);
  const [activeIndex, setActiveIndex] = useState(0); // 0 = Auto
  const [pinned, setPinned] = useState(false);
  const [micState, setMicState] = useState<MicState>("idle");
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [probe, setProbe] = useState<ProbeResult | null>(null);
  const [failover, setFailover] = useState<{ from: string; to: string; deltaMs: number } | null>(null);

  const turnIndex = useRef(0);
  const entryId = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    detectOrigin().then(setAutoOrigin);
    const t = timers.current;
    return () => {
      t.forEach(clearTimeout);
      sessionRef.current?.close();
    };
  }, []);

  const labels = useMemo(() => ["Auto · my location", ...CHIP_CITIES], []);

  const origin: Origin =
    activeIndex === 0 ? (autoOrigin ?? DEFAULT_ORIGIN) : CHIP_ORIGINS[activeIndex - 1];
  const pinId = pinned ? US_EAST_REGION_ID : undefined;

  // Open a live connect() session and re-home it whenever the origin or pin changes.
  // Live RTT ticks stream in over SSE and update the readout + globe in real time.
  useEffect(() => {
    if (!sessionRef.current) {
      const session = connect({ origin, pinnedRegionId: pinId });
      session.on("tick", (p) => setProbe(p));
      sessionRef.current = session;
    } else {
      sessionRef.current.update({ origin, pinnedRegionId: pinId });
    }
  }, [origin, pinId]);

  const accent = probe ? rttColor(probe.rttMs) : "#22d3ee";
  const band = probe ? rttBand(probe.rttMs) : "good";

  async function talk() {
    if (micState === "listening" || micState === "thinking" || micState === "speaking" || !probe) return;

    // Real microphone-permission gate: prompt for mic access; a denial surfaces the
    // mic-blocked state. We don't record — the track is released immediately.
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        setMicState("denied");
        return;
      }
    }

    const turn = turnAt(turnIndex.current);
    const region = probe.region.city;
    const rttMs = probe.rttMs;
    const replyAccent = accent;

    setMicState("listening");
    timers.current.push(
      setTimeout(() => {
        addEntry({ role: "user", text: turn.user });
        setMicState("thinking");
      }, 1200),
      setTimeout(() => {
        setMicState("speaking");
        addEntry({ role: "agent", text: turn.agent, region, rttMs, accent: replyAccent });
      }, 2000),
      setTimeout(() => {
        setMicState("idle");
        turnIndex.current += 1;
      }, 3600),
    );
  }

  // Simulate the nearest region hitting capacity: the session fails over to the
  // next-nearest healthy region, with a banner + a system note in the transcript.
  function simulateOutage() {
    if (!probe) return;
    const current = probe.region;
    const alt = REGIONS.filter((r) => r.id !== current.id && r.health !== "down").reduce((best, r) =>
      haversineKm(origin, r) < haversineKm(origin, best) ? r : best,
    );
    const deltaMs = Math.max(1, Math.round((haversineKm(origin, alt) - haversineKm(origin, current)) / 100));
    setFailover({ from: current.city, to: alt.city, deltaMs });
    addEntry({ role: "system", text: `${current.city} hit capacity — re-homed to ${alt.city} (+${deltaMs}ms)` });
    timers.current.push(setTimeout(() => setFailover(null), 6000));
  }

  function addEntry(e: Omit<TranscriptEntry, "id">) {
    setEntries((prev) => [...prev, { id: entryId.current++, ...e }]);
  }

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-1 flex-col gap-8 px-6 py-8 sm:px-12 lg:flex-row lg:items-center lg:gap-12">
      {/* Stage: origin chips + globe */}
      <div className="flex flex-1 flex-col items-center gap-5">
        <OriginSelector labels={labels} activeIndex={activeIndex} onSelect={setActiveIndex} />
        <div className="w-full max-w-[500px]">
          <Globe
            origin={origin}
            region={probe?.region ?? null}
            rttMs={probe?.rttMs ?? null}
            accent={accent}
            size={500}
            className="h-auto w-full overflow-visible"
          />
        </div>
      </div>

      {/* Control + transcript column */}
      <div className="flex w-full flex-col gap-5 lg:h-[620px] lg:w-[440px] lg:shrink-0">
        <div className="flex flex-col gap-5 rounded-2xl border border-line bg-panel p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-semibold text-ink">Live voice session</h1>
            <span className="flex items-center gap-1.5 rounded-full border border-line bg-elevated px-2.5 py-1.5">
              <span
                className="h-[7px] w-[7px] rounded-full"
                style={{ backgroundColor: accent, boxShadow: `0 0 6px ${accent}` }}
              />
              <span className="font-mono text-[11px] text-ink-secondary">
                {probe ? `${probe.region.city} · ${probe.rttMs} ms` : "connecting…"}
              </span>
            </span>
          </div>

          <MicControl state={micState} onTalk={talk} />

          <RoundTripReadout
            networkMs={probe?.networkMs ?? null}
            inferenceMs={probe?.inferenceMs ?? null}
            rttMs={probe?.rttMs ?? null}
            accent={accent}
          />

          <ContrastToggle pinned={pinned} onToggle={() => setPinned((p) => !p)} />

          {pinned && band === "bad" && probe && (
            <p
              className="rounded-lg border px-3.5 py-2.5 text-[13px]"
              style={{ borderColor: "rgba(240,64,96,0.4)", backgroundColor: "#1a0c11", color: "#f7a8b6" }}
            >
              This is what single-region GPU hosting feels like — {probe.rttMs}ms from {origin.label}.
            </p>
          )}

          {failover && (
            <p
              className="flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-[13px]"
              style={{ borderColor: "rgba(251,191,36,0.4)", backgroundColor: "#1a1405", color: "#f5cf7a" }}
            >
              <span className="text-amber">⚑</span>
              {failover.from} hit capacity — re-homed to {failover.to} · +{failover.deltaMs}ms
            </p>
          )}

          <button
            type="button"
            onClick={simulateOutage}
            className="self-start text-xs font-medium text-ink-muted underline-offset-4 transition-colors hover:text-amber hover:underline"
          >
            ⚡ Simulate a region outage
          </button>
        </div>

        <Transcript entries={entries} />
      </div>
    </section>
  );
}
