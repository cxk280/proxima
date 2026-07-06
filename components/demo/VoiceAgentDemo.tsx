"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Globe } from "@/components/globe/Globe";
import { LatencyValue } from "@/components/ui/LatencyValue";
import {
  DEFAULT_ORIGIN,
  detectOrigin,
  haversineKm,
  REGIONS,
  rttBand,
  rttColor,
  SIMULATED_ORIGINS,
  US_EAST_REGION_ID,
  type Latency,
  type Origin,
  type ProbeResult,
  type Region,
} from "@/lib/mesh";
import { chat, connect, type ChatTurn, type Session } from "@/lib/sdk";
import { useMeasuredHoming } from "@/lib/hooks/useMeasuredHoming";
import { listenOnce, speak, supportsSpeechInput } from "@/lib/voice/speech";
import { turnAt } from "@/lib/demo/conversation";
import { OriginSelector } from "./OriginSelector";
import { MicControl } from "./MicControl";
import { RoundTripReadout } from "./RoundTripReadout";
import { RegionPicker } from "./RegionPicker";
import { ContrastToggle } from "./ContrastToggle";
import { Transcript } from "./Transcript";
import type { MicState, TranscriptEntry } from "./types";

// The chip row: Auto + a spread of underserved origins that make the point.
const CHIP_CITIES = ["Nairobi", "Jakarta", "Santiago", "São Paulo", "Sydney"];
const CHIP_ORIGINS = CHIP_CITIES.map((c) => SIMULATED_ORIGINS.find((o) => o.label === c)!);

export function VoiceAgentDemo() {
  const [autoOrigin, setAutoOrigin] = useState<Origin | null>(null);
  const [activeIndex, setActiveIndex] = useState(0); // 0 = Auto
  const [pinned, setPinned] = useState(false); // US-East contrast pin
  const [chosenRegionId, setChosenRegionId] = useState<string | null>(null); // viewer-picked region
  const [micState, setMicState] = useState<MicState>("idle");
  const [draft, setDraft] = useState(""); // type-to-send input (no microphone)
  const [speakReplies, setSpeakReplies] = useState(false); // off by default → no speaker echo over a call
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [probe, setProbe] = useState<ProbeResult | null>(null); // modeled baseline (inference, fallback)
  const [failover, setFailover] = useState<{ from: string; to: string; deltaMs: number } | null>(null);

  const turnIndex = useRef(0);
  const entryId = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sessionRef = useRef<Session | null>(null);
  const convo = useRef<ChatTurn[]>([]); // running conversation for the real Claude agent

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
  const isAuto = activeIndex === 0;
  const pinId = pinned ? US_EAST_REGION_ID : (chosenRegionId ?? undefined);

  // The modeled baseline (inference leg + region + a live heartbeat) still streams over the
  // connect() SSE session — the SDK showcase — and is the fallback when nothing is measured.
  useEffect(() => {
    if (!sessionRef.current) {
      const session = connect({ origin, pinnedRegionId: pinId });
      session.on("tick", (p) => setProbe(p));
      sessionRef.current = session;
    } else {
      sessionRef.current.update({ origin, pinnedRegionId: pinId });
    }
  }, [origin, pinId]);

  // The REAL network leg: measured in THIS browser. Only "Auto · my location" can be truly
  // measured (we can't measure from a city the viewer isn't in) — other chips stay modeled.
  const { homing } = useMeasuredHoming(origin, { pinnedRegionId: pinId, enabled: isAuto });

  // Resolve display values, provenance-tagged. Measured region/network win when present.
  const region: Region | null = homing?.region ?? probe?.region ?? null;
  const network: Latency | null = homing
    ? homing.network
    : probe
      ? { ms: probe.networkMs, real: false }
      : null;
  const inference: Latency | null = probe ? { ms: probe.inferenceMs, real: false } : null;
  // Total includes the modeled inference leg, so it is estimated even when network is real.
  const total: Latency | null =
    network && inference ? { ms: network.ms + inference.ms, real: false } : null;

  const accent = network ? rttColor(network.ms) : "#22d3ee";
  const networkBad = network != null && rttBand(network.ms) === "bad";

  const busy = micState === "listening" || micState === "thinking" || micState === "speaking";

  // Core turn: send one user message to the real Claude agent and render the reply.
  // `spoken` gates browser text-to-speech — off for typed input so the agent's voice can't
  // echo back into a call's microphone (screen-share / Zoom-safe).
  async function respond(userText: string, spoken: boolean) {
    if (busy || !network || !region) return;
    const scripted = turnAt(turnIndex.current);
    const city = region.city;
    const replyLatency = network;
    const replyAccent = accent;

    addEntry({ role: "user", text: userText });
    convo.current.push({ role: "user", content: userText });

    // THINK — the real Claude-powered agent (falls back to the scripted reply, tagged).
    setMicState("thinking");
    const reply = await chat(convo.current);
    const agentText = reply.text || scripted.agent;
    convo.current.push({ role: "assistant", content: agentText });
    convo.current = convo.current.slice(-16); // bound long sessions (server also caps)

    // SPEAK — real browser text-to-speech, only when asked; otherwise the reply is read
    // from the transcript. Tag the reply Claude vs demo-script either way.
    if (spoken) {
      setMicState("speaking");
      speak(agentText);
    }
    addEntry({ role: "agent", text: agentText, region: city, rttMs: replyLatency.ms, accent: replyAccent, real: reply.real });
    turnIndex.current += 1;

    const restMs = spoken ? Math.min(6000, 900 + agentText.length * 45) : 300;
    timers.current.push(setTimeout(() => setMicState("idle"), restMs));
  }

  // Mic path: real microphone-permission gate + browser speech-to-text, spoken reply.
  async function talk() {
    if (busy || !network || !region) return;

    // Real microphone-permission gate (micro-states): prompt for mic access; a denial
    // surfaces the mic-blocked state. We don't record — the track is released immediately.
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        setMicState("denied");
        return;
      }
    }

    // LISTEN — real browser speech-to-text where available; otherwise the scripted line.
    setMicState("listening");
    const heard = supportsSpeechInput() ? await listenOnce(8000) : null;
    await respond(heard ?? turnAt(turnIndex.current).user, true);
  }

  // Text path: type a prompt and send it — no microphone, safe to present over a call.
  async function send() {
    const text = draft.trim();
    if (!text || busy || !network || !region) return;
    setDraft("");
    await respond(text, speakReplies);
  }

  // Simulate the nearest region hitting capacity: the session fails over to the
  // next-nearest healthy region, with a banner + a system note in the transcript.
  function simulateOutage() {
    if (!region) return;
    const current = region;
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
        {/* Provenance legend — Auto is the viewer's real measurement; cities are modeled. */}
        <div className="flex items-center gap-5 text-[11px] font-medium">
          <span className="flex items-center gap-1.5 text-ink-secondary">
            <span className="h-[7px] w-[7px] rounded-full bg-cyan" style={{ boxShadow: "0 0 6px #22d3ee" }} />
            REAL — your live latency
          </span>
          <span className="flex items-center gap-1.5 text-ink-muted">
            <span className="h-[7px] w-[7px] rounded-full bg-[#5d6a82]" />
            est — modeled for other cities
          </span>
        </div>
        <div className="w-full max-w-[500px]">
          <Globe
            origin={origin}
            region={region}
            rttMs={network?.ms ?? null}
            real={network?.real ?? true}
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
                {region && network ? (
                  <>
                    {region.city} · <LatencyValue value={network} className="text-[11px]" />
                  </>
                ) : (
                  "connecting…"
                )}
              </span>
            </span>
          </div>

          <MicControl state={micState} onTalk={talk} />

          {/* Type-to-send — no microphone, so it's safe to present over a call. Replies
              render in the transcript; browser speech-out is off by default. */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex flex-col gap-2"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={busy}
                placeholder="Type a message to the agent…"
                aria-label="Type a message to the agent"
                className="flex-1 rounded-lg border border-line bg-elevated px-3 py-2 text-[13px] text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-cyan disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={busy || !draft.trim()}
                className="rounded-lg border border-line bg-elevated px-4 py-2 text-[13px] font-medium text-ink-secondary transition-colors hover:text-ink disabled:opacity-40"
              >
                Send
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSpeakReplies((v) => !v)}
              aria-pressed={speakReplies}
              className="self-start text-xs font-medium text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              {speakReplies ? "🔊 Speak replies: on" : "🔇 Speak replies: off (safe to present)"}
            </button>
          </form>

          <RoundTripReadout network={network} inference={inference} total={total} />

          <RegionPicker value={chosenRegionId} onChange={setChosenRegionId} disabled={pinned} />

          <ContrastToggle pinned={pinned} onToggle={() => setPinned((p) => !p)} />

          {pinned && networkBad && network && (
            <p
              className="rounded-lg border px-3.5 py-2.5 text-[13px]"
              style={{ borderColor: "rgba(240,64,96,0.4)", backgroundColor: "#1a0c11", color: "#f7a8b6" }}
            >
              This is what single-region GPU hosting feels like — {network.ms}ms from {origin.label}.
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
