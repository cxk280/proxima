import { rttColor, type Latency } from "@/lib/mesh";

interface LatencyValueProps {
  value: Latency;
  /** Size/weight classes from the caller; the mono + tabular styling is always applied. */
  className?: string;
}

/**
 * Renders a latency with its provenance made visible — the one place a latency number
 * turns into pixels. A REAL (measured) value takes the live band colour (cyan sub-40ms /
 * amber / red); an EST (modeled) value is muted and carries an "est" tag + tooltip. Because
 * every latency renders through here and the prop is a {@link Latency} (which *must* carry
 * `real`), a modeled number can never accidentally render in the measured style.
 */
export function LatencyValue({ value, className }: LatencyValueProps) {
  const base = `font-mono tabular-nums ${className ?? ""}`.trim();

  if (value.real) {
    return (
      <span className={base} style={{ color: rttColor(value.ms) }}>
        {value.ms} ms
      </span>
    );
  }

  return (
    <span className={`${base} text-ink-muted`} title="Estimated — great-circle physics model, not a live measurement">
      {value.ms} ms
      <sup className="ml-1 text-[0.62em] font-medium uppercase tracking-wider text-ink-muted">est</sup>
    </span>
  );
}
