"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, type GlobeRoute } from "@/components/globe/Globe";
import { LatencyValue } from "@/components/ui/LatencyValue";
import {
  detectOrigin,
  LEADERBOARD_ORIGINS,
  US_EAST_REGION_ID,
  type Latency,
  type Origin,
  type ProbeResult,
  type Region,
} from "@/lib/mesh";
import { probeBatch, probeOnce } from "@/lib/sdk";
import { useMeasuredHoming } from "@/lib/hooks/useMeasuredHoming";

const REVEAL_STEP_MS = 170;

// Leaderboard uses green for a passing (sub-40ms) probe — "all clear" — then amber/red
// as latency climbs. (The rest of the app reads sub-40ms as cyan; here green = pass.)
function lbColor(rttMs: number): string {
  return rttMs < 40 ? "#35e0a1" : rttMs < 200 ? "#fbbf24" : "#f04060";
}

export function Leaderboard() {
  const [pinned, setPinned] = useState(false);
  const [runNonce, setRunNonce] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ProbeResult[]>([]);
  const [youOrigin, setYouOrigin] = useState<Origin | null>(null);
  const [youModeled, setYouModeled] = useState<ProbeResult | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // The viewer's own city — the one REAL, browser-measured row, pinned at the top.
  useEffect(() => {
    detectOrigin().then(setYouOrigin);
  }, []);
  const { homing: youHoming, resolved: youResolved } = useMeasuredHoming(youOrigin);
  useEffect(() => {
    if (!youOrigin || !youResolved || youHoming) return;
    let live = true;
    probeOnce(youOrigin)
      .then((p) => live && setYouModeled(p))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [youOrigin, youResolved, youHoming]);

  const youRegion: Region | null = youHoming?.region ?? youModeled?.region ?? null;
  const youLatency: Latency | null = youHoming
    ? youHoming.network
    : youModeled
      ? { ms: youModeled.rttMs, real: false }
      : null;

  // Fetch a fresh sweep from the probe backend on mount, when the contrast toggle flips,
  // or on "Run probes", then reveal the rows one at a time.
  useEffect(() => {
    let live = true;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRevealed(0);
    setRunning(true);
    probeBatch(LEADERBOARD_ORIGINS, pinned ? US_EAST_REGION_ID : undefined)
      .then((res) => {
        if (!live) return;
        setResults(res);
        LEADERBOARD_ORIGINS.forEach((_, i) => {
          const t = setTimeout(
            () => {
              setRevealed(i + 1);
              if (i === LEADERBOARD_ORIGINS.length - 1) setRunning(false);
            },
            250 + i * REVEAL_STEP_MS,
          );
          timers.current.push(t);
        });
      })
      .catch(() => {
        if (live) setRunning(false);
      });
    return () => {
      live = false;
      timers.current.forEach(clearTimeout);
    };
  }, [pinned, runNonce]);
  const done = results.slice(0, revealed);
  const under40 = done.filter((r) => r.rttMs < 40).length;
  const maxMs = done.length ? Math.max(...done.map((r) => r.rttMs)) : 0;
  const avgMs = done.length ? Math.round(done.reduce((s, r) => s + r.rttMs, 0) / done.length) : 0;

  const routes: GlobeRoute[] = done.map((r) => ({
    origin: r.origin,
    region: r.region,
    accent: lbColor(r.rttMs),
  }));

  const summaryOk = revealed > 0 && under40 === revealed;

  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 px-6 py-9 sm:px-16">
      {/* Header */}
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.02em] text-ink">Sub-40ms, Anywhere</h1>
          <p className="mt-1.5 text-[15px] text-ink-secondary">
            Your own city is measured live — every other city is estimated on the same physics model.
          </p>
        </div>
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => setPinned((p) => !p)}
            aria-pressed={pinned}
            className="flex items-center gap-2.5 rounded-[10px] border border-line bg-panel px-3.5 py-2.5"
          >
            <span className="text-[13px] font-medium text-ink-secondary">Single-region (US-East)</span>
            <span
              className={`relative h-[22px] w-10 rounded-full border transition-colors ${
                pinned ? "border-amber/60 bg-amber/25" : "border-line bg-elevated"
              }`}
            >
              <span
                className="absolute top-[2px] h-4 w-4 rounded-full transition-all"
                style={{ left: pinned ? "20px" : "3px", backgroundColor: pinned ? "#fbbf24" : "#93a1ba" }}
              />
            </span>
          </button>
          <button
            type="button"
            onClick={() => setRunNonce((n) => n + 1)}
            disabled={running}
            className="rounded-[10px] bg-cyan px-5 py-3 text-sm font-semibold text-navy-ink shadow-[0_4px_16px_rgba(34,211,238,0.35)] disabled:opacity-70"
          >
            {running ? "Running…" : "▸ Run probes"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Table */}
        <div className="flex-1 overflow-hidden rounded-2xl border border-line bg-panel">
          <div className="flex items-center gap-2.5 bg-[#0e1b22] px-5 py-4">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: summaryOk ? "#35e0a1" : "#93a1ba",
                boxShadow: summaryOk ? "0 0 6px #35e0a1" : undefined,
              }}
            />
            <span className="text-[15px] font-semibold text-ink">
              {under40} / {revealed || LEADERBOARD_ORIGINS.length} under 40ms
            </span>
            <span className="ml-auto font-mono text-xs text-ink-muted">
              max {maxMs} ms · avg {avgMs} ms
            </span>
          </div>

          <div className="flex items-center gap-4 border-b border-line bg-elevated px-5 py-3 text-[11px] font-medium tracking-wide text-ink-muted">
            <span className="w-[150px] shrink-0">ORIGIN CITY</span>
            <span className="w-[150px] shrink-0">ANSWERED BY</span>
            <span className="w-14 shrink-0 text-right">RTT</span>
            <span className="flex-1">LATENCY</span>
            <span className="w-8 shrink-0" />
          </div>

          <YouRow region={youRegion} latency={youLatency} />
          {LEADERBOARD_ORIGINS.map((origin, i) => (
            <ProbeRow key={origin.label} origin={origin.label} result={i < revealed ? results[i] : null} />
          ))}
        </div>

        {/* Companion globe */}
        <div className="flex flex-col items-center gap-4 lg:w-[460px] lg:shrink-0">
          <div className="flex items-center gap-2 rounded-full border border-line bg-panel px-3.5 py-2">
            <span
              className="h-[7px] w-[7px] rounded-full"
              style={{ backgroundColor: pinned ? "#f04060" : "#35e0a1" }}
            />
            <span className="font-mono text-xs text-ink">
              {youLatency?.real ? "1 real + " : ""}
              {revealed} est · {pinned ? "single-region" : "all sub-40ms"}
            </span>
          </div>
          <Globe routes={routes} rttMs={null} size={460} className="h-auto w-full max-w-[460px] overflow-visible" />
        </div>
      </div>
    </section>
  );
}

function ProbeRow({ origin, result }: { origin: string; result: ProbeResult | null }) {
  const color = result ? lbColor(result.rttMs) : "#5d6a82";
  const fillPct = result ? Math.min(100, (result.rttMs / 40) * 100) : 0;
  return (
    <div className="flex items-center gap-4 border-b border-line/60 px-5 py-3.5">
      <span className="w-[150px] shrink-0 text-sm font-medium text-ink">{origin}</span>
      <span className="w-[150px] shrink-0 text-[13px] text-ink-secondary">
        {result ? result.region.city : <Spinner />}
      </span>
      <span className="w-14 shrink-0 text-right font-mono text-[13px]" style={{ color }}>
        {result ? `${result.rttMs} ms` : "—"}
      </span>
      <span className="flex-1">
        <span className="relative block h-1.5 w-full max-w-[180px] overflow-hidden rounded-full bg-inset">
          <span
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
            style={{ width: `${fillPct}%`, backgroundColor: color, boxShadow: result ? `0 0 6px ${color}` : undefined }}
          />
        </span>
      </span>
      <span className="w-8 shrink-0 text-right text-sm" style={{ color }}>
        {result ? (result.rttMs < 40 ? "✓" : "!") : ""}
      </span>
    </div>
  );
}

/** The viewer's own row — REAL when browser-measured (cyan + "REAL"), else the modeled
 *  estimate (muted + "est"), always pinned at the top and visually set apart. */
function YouRow({ region, latency }: { region: Region | null; latency: Latency | null }) {
  const pct = latency ? Math.min(100, (latency.ms / 40) * 100) : 0;
  const barColor = latency?.real ? "#22d3ee" : latency ? lbColor(latency.ms) : "#5d6a82";
  return (
    <div
      className="relative flex items-center gap-4 border-b border-line/60 px-5 py-3.5"
      style={{ backgroundColor: "rgba(34,211,238,0.06)" }}
    >
      <span className="absolute inset-y-0 left-0 w-[3px] bg-cyan" />
      <span className="w-[150px] shrink-0 text-sm font-medium text-ink">You · your city</span>
      <span className="w-[150px] shrink-0 text-[13px] text-ink-secondary">
        {region ? region.city : <Spinner />}
      </span>
      <span className="w-14 shrink-0 text-right">
        {latency ? (
          <LatencyValue value={latency} className="text-[13px]" />
        ) : (
          <span className="font-mono text-[13px] text-ink-muted">—</span>
        )}
      </span>
      <span className="flex-1">
        <span className="relative block h-1.5 w-full max-w-[180px] overflow-hidden rounded-full bg-inset">
          <span
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
            style={{ width: `${pct}%`, backgroundColor: barColor, boxShadow: latency ? `0 0 6px ${barColor}` : undefined }}
          />
        </span>
      </span>
      <span
        className="w-8 shrink-0 text-right font-mono text-[10px] font-semibold tracking-tight"
        style={{ color: latency?.real ? "#22d3ee" : "#93a1ba" }}
      >
        {latency ? (latency.real ? "REAL" : "est") : ""}
      </span>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="spinner inline-block" width="14" height="14" viewBox="0 0 14 14" aria-label="probing">
      <circle cx="7" cy="7" r="5.5" stroke="#263149" strokeWidth="2" fill="none" />
      <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}
