interface ContrastToggleProps {
  pinned: boolean;
  onToggle: () => void;
}

/** The "US-East only" contrast switch — pins all traffic to one region. */
export function ContrastToggle({ pinned, onToggle }: ContrastToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={pinned}
      className="flex items-center justify-between gap-3 text-left"
    >
      <span>
        <span className="block text-[13px] font-semibold text-ink">Pin to US-East only</span>
        <span className="block text-[11px] text-ink-muted">Feel single-region GPU hosting</span>
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
          pinned ? "border-amber/60 bg-amber/25" : "border-line bg-elevated"
        }`}
      >
        <span
          className="absolute top-[3px] h-[18px] w-[18px] rounded-full transition-all"
          style={{
            left: pinned ? "22px" : "3px",
            backgroundColor: pinned ? "#fbbf24" : "#93a1ba",
          }}
        />
      </span>
    </button>
  );
}
