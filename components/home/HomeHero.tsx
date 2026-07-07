"use client";

import { useEffect, useState } from "react";
import { Globe } from "@/components/globe/Globe";
import { Button } from "@/components/ui/Button";
import { StatTile } from "@/components/ui/StatTile";
import { LatencyValue } from "@/components/ui/LatencyValue";
import { detectOrigin, type Latency, type Origin, type ProbeResult, type Region } from "@/lib/mesh";
import { probeOnce } from "@/lib/sdk";
import { useMeasuredHoming } from "@/lib/hooks/useMeasuredHoming";

const TRUST = [
  { value: "33", label: "GPU regions" },
  { value: "90%", label: "of humanity ≤ 40ms" },
  { value: "$0.032", label: "/hr per region" },
];

/**
 * Home hero. The globe + region dots render immediately; once we detect the visitor's
 * approximate origin we home a probe and the origin→region arc animates in with its RTT.
 */
export function HomeHero() {
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [modeled, setModeled] = useState<ProbeResult | null>(null);

  // The headline is the viewer's OWN measured round-trip to the nearest region responder.
  const { homing, resolved } = useMeasuredHoming(origin);

  useEffect(() => {
    detectOrigin().then(setOrigin);
  }, []);

  // Fallback: only when measurement resolved with no live responder do we show the model.
  useEffect(() => {
    if (!origin || !resolved || homing) return;
    let live = true;
    probeOnce(origin)
      .then((p) => live && setModeled(p))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [origin, resolved, homing]);

  // Prefer the real measurement; fall back to the modeled estimate, tagged EST.
  const region: Region | null = homing?.region ?? modeled?.region ?? null;
  const latency: Latency | null = homing
    ? homing.network
    : modeled
      ? { ms: modeled.rttMs, real: false }
      : null;

  return (
    <section className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col items-center gap-10 px-6 py-12 sm:px-12 lg:flex-row lg:justify-between lg:gap-10">
      {/* Copy */}
      <div className="flex w-full max-w-[600px] flex-col gap-5">
        <p className="font-mono text-[13px] tracking-[0.15em] text-cyan">THE 33-REGION GPU MESH</p>
        <h1 className="text-[clamp(2.75rem,6vw,3.875rem)] font-bold leading-[1.04] tracking-[-0.02em] text-ink">
          Sub-40ms AI.
          <br />
          Anywhere on Earth.
        </h1>
        <p className="max-w-[500px] text-lg leading-relaxed text-ink-secondary">
          Proxima routes every interactive-AI session to the nearest of Vultr&apos;s 33 GPU
          regions — so a user in Lagos, Jakarta, or Santiago feels the model as instantly as
          one in Virginia.
        </p>

        <div className="mt-1.5 flex flex-wrap gap-3.5">
          <Button href="/demo" variant="primary">
            Try the live demo →
          </Button>
          <Button href="/docs" variant="secondary">
            Read the docs
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3.5">
          {TRUST.map((t) => (
            <StatTile key={t.label} value={t.value} label={t.label} />
          ))}
        </div>

        <p className="flex h-4 items-center gap-1.5 text-xs text-ink-muted" aria-live="polite">
          {latency && region ? (
            <>
              <span>Homed on {region.city} ·</span>
              <LatencyValue value={latency} className="text-xs" />
              <span>
                {latency.real ? "measured from your device" : "round trip"}
                {origin?.source === "ip"
                  ? " · using your IP region"
                  : origin?.source === "default"
                    ? " · approximate location"
                    : ""}
              </span>
            </>
          ) : (
            "Locating your nearest region…"
          )}
        </p>
      </div>

      {/* Globe */}
      <div className="relative w-full max-w-[540px] shrink-0">
        <Globe
          origin={origin}
          region={region}
          rttMs={latency?.ms ?? null}
          real={latency?.real ?? true}
          size={540}
          className="h-auto w-full overflow-visible"
        />
      </div>
    </section>
  );
}
