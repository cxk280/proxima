"use client";

import { useEffect, useState } from "react";
import { Globe } from "@/components/globe/Globe";
import { Button } from "@/components/ui/Button";
import { StatTile } from "@/components/ui/StatTile";
import { detectOrigin, type Origin, type ProbeResult } from "@/lib/mesh";
import { probeOnce } from "@/lib/sdk";

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
  const [probe, setProbe] = useState<ProbeResult | null>(null);

  useEffect(() => {
    let live = true;
    detectOrigin().then(async (o) => {
      if (!live) return;
      setOrigin(o);
      const p = await probeOnce(o).catch(() => null);
      if (live) setProbe(p);
    });
    return () => {
      live = false;
    };
  }, []);

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

        <p className="h-4 text-xs text-ink-muted" aria-live="polite">
          {probe
            ? `Homed on ${probe.region.city} · ${probe.rttMs}ms round trip${
                origin?.approximate ? " · using your IP region" : ""
              }`
            : "Locating your nearest region…"}
        </p>
      </div>

      {/* Globe */}
      <div className="relative w-full max-w-[540px] shrink-0">
        <Globe
          origin={origin}
          region={probe?.region ?? null}
          rttMs={probe?.rttMs ?? null}
          size={540}
          className="h-auto w-full overflow-visible"
        />
      </div>
    </section>
  );
}
