import { LatencyValue } from "@/components/ui/LatencyValue";
import type { Latency } from "@/lib/mesh";

interface RoundTripReadoutProps {
  network: Latency | null;
  inference: Latency | null;
  total: Latency | null;
}

/**
 * mic → region → back, split by provenance: the **network** leg is the viewer's real
 * measured hop (live); **inference** is modeled (est); the **round-trip** total is
 * therefore est too, since it includes the modeled leg. Each value renders through
 * {@link LatencyValue}, so the estimate can never wear the measured styling.
 */
export function RoundTripReadout({ network, inference, total }: RoundTripReadoutProps) {
  return (
    <div className="flex gap-2.5 rounded-xl border border-line bg-inset px-4 py-3.5">
      <Metric label={network?.real ? "network · live" : "network"} value={network} />
      <Metric label="inference · est" value={inference} />
      <Metric label="round-trip" value={total} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: Latency | null }) {
  return (
    <div className="flex-1">
      <div className="text-lg">
        {value ? (
          <LatencyValue value={value} className="text-lg" />
        ) : (
          <span className="font-mono text-lg text-ink-muted">— ms</span>
        )}
      </div>
      <div className="mt-0.5 text-[11px] font-medium text-ink-muted">{label}</div>
    </div>
  );
}
