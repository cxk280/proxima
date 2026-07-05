import { REGIONS } from "@/lib/mesh";

interface RegionPickerProps {
  /** null = home to the nearest region automatically. */
  value: string | null;
  onChange: (regionId: string | null) => void;
  disabled?: boolean;
}

const SORTED = [...REGIONS].sort((a, b) => a.city.localeCompare(b.city));

/**
 * Viewer-editable region: home to the nearest region automatically, or pick a specific one
 * to see how the measured latency changes. Disabled while the US-East contrast pin is on
 * (that pin already forces the region).
 */
export function RegionPicker({ value, onChange, disabled }: RegionPickerProps) {
  return (
    <label className="flex items-center justify-between gap-3 text-[13px]">
      <span className="font-medium text-ink-secondary">Home to</span>
      <select
        value={value ?? "auto"}
        onChange={(e) => onChange(e.target.value === "auto" ? null : e.target.value)}
        disabled={disabled}
        className="rounded-lg border border-line bg-elevated px-2.5 py-1.5 font-mono text-[12px] text-ink disabled:opacity-50"
      >
        <option value="auto">Nearest region (auto)</option>
        {SORTED.map((r) => (
          <option key={r.id} value={r.id}>
            {r.city}
          </option>
        ))}
      </select>
    </label>
  );
}
