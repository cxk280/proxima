interface OriginSelectorProps {
  labels: string[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

/** Chip row of simulated origins. Selecting one re-homes the session. */
export function OriginSelector({ labels, activeIndex, onSelect }: OriginSelectorProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2.5">
      {labels.map((label, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onSelect(i)}
            aria-pressed={active}
            className={`rounded-full px-3.5 py-2 text-[13px] transition-colors ${
              active
                ? "bg-cyan font-semibold text-navy-ink"
                : "border border-line bg-panel font-medium text-ink-secondary hover:border-line-strong hover:text-ink"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
