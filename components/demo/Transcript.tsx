"use client";

import { useEffect, useRef } from "react";
import type { TranscriptEntry } from "./types";

interface TranscriptProps {
  entries: TranscriptEntry[];
}

/** Rolling transcript; each agent reply is tagged with the region + RTT that served it. */
export function Transcript({ entries }: TranscriptProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [entries]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto rounded-2xl border border-line bg-panel p-5">
      <p className="text-[13px] font-semibold tracking-wide text-ink-secondary">Transcript</p>
      {entries.length === 0 && (
        <p className="text-sm text-ink-muted">
          Tap the mic and speak — replies are tagged with the region that answered.
        </p>
      )}
      {entries.map((e) =>
        e.role === "system" ? (
          <div
            key={e.id}
            className="flex items-center justify-center gap-2 self-center rounded-lg border px-3 py-2 text-center text-[12px]"
            style={{ borderColor: "rgba(251,191,36,0.4)", backgroundColor: "#1a1405", color: "#f5cf7a" }}
          >
            <span className="text-amber">⚑</span>
            {e.text}
          </div>
        ) : (
        <div key={e.id} className={`flex flex-col gap-1 ${e.role === "user" ? "items-end" : "items-start"}`}>
          <div
            className={`max-w-[320px] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
              e.role === "user" ? "bg-elevated text-ink" : "border text-ink"
            }`}
            style={
              e.role === "agent"
                ? { backgroundColor: "#0e2029", borderColor: "rgba(34,211,238,0.25)" }
                : undefined
            }
          >
            {e.text}
          </div>
          {e.role === "agent" && e.region && (
            <span className="font-mono text-[10px]" style={{ color: e.accent ?? "#5d6a82" }}>
              ▸ {e.region} · {e.rttMs} ms
              {e.real === undefined ? "" : e.real ? " · Claude" : " · demo script"}
            </span>
          )}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
