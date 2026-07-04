interface StatTileProps {
  value: string;
  label: string;
}

/** A trust-strip stat: big monospace figure over a muted label. */
export function StatTile({ value, label }: StatTileProps) {
  return (
    <div className="flex-1 rounded-xl border border-line bg-panel px-[18px] py-4">
      <div className="font-mono text-2xl text-cyan">{value}</div>
      <div className="mt-1.5 text-xs font-medium text-ink-secondary">{label}</div>
    </div>
  );
}
