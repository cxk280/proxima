interface RoundTripReadoutProps {
  networkMs: number | null;
  inferenceMs: number | null;
  rttMs: number | null;
  accent: string;
}

/** mic → region → back, broken into network vs inference. */
export function RoundTripReadout({ networkMs, inferenceMs, rttMs, accent }: RoundTripReadoutProps) {
  const fmt = (n: number | null) => (n == null ? "— ms" : `${n} ms`);
  return (
    <div className="flex gap-2.5 rounded-xl border border-line bg-inset px-4 py-3.5">
      <Metric label="network" value={fmt(networkMs)} />
      <Metric label="inference" value={fmt(inferenceMs)} />
      <Metric label="round-trip" value={fmt(rttMs)} color={accent} />
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex-1">
      <div className="font-mono text-lg" style={{ color: color ?? "#e7edf7" }}>
        {value}
      </div>
      <div className="mt-0.5 text-[11px] font-medium text-ink-muted">{label}</div>
    </div>
  );
}
