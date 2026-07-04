import type { MicState } from "./types";

interface MicControlProps {
  state: MicState;
  onTalk: () => void;
}

const LABEL: Record<MicState, string> = {
  idle: "Push to talk",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking…",
};

const SUBLABEL: Record<MicState, string> = {
  idle: "Tap the mic to start a turn",
  listening: "Capturing your voice",
  thinking: "Routing to the nearest region",
  speaking: "Agent audio playing",
};

/** Push-to-talk control with idle / listening / thinking / speaking states. */
export function MicControl({ state, onTalk }: MicControlProps) {
  const active = state !== "idle";
  return (
    <div className="flex flex-col items-center gap-3.5 py-2">
      <button
        type="button"
        onClick={onTalk}
        disabled={active}
        aria-label={LABEL[state]}
        className="relative flex h-[104px] w-[104px] items-center justify-center rounded-full border-2 border-cyan bg-[#0e1f2c] shadow-[0_0_26px_rgba(34,211,238,0.45)] transition-transform disabled:cursor-default enabled:hover:scale-105"
      >
        {state === "idle" && <MicGlyph />}
        {(state === "listening" || state === "speaking") && <Waveform />}
        {state === "thinking" && <Spinner />}
      </button>
      <div className="text-center">
        <p className="text-[15px] font-semibold text-ink">{LABEL[state]}</p>
        <p className="mt-0.5 text-xs text-ink-muted">{SUBLABEL[state]}</p>
      </div>
    </div>
  );
}

function MicGlyph() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="2" width="6" height="12" rx="3" fill="#22d3ee" />
      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v3"
        stroke="#22d3ee"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Waveform() {
  const bars = [22, 38, 52, 38, 22];
  const startX = 52 - (bars.length * 10 - 4) / 2;
  return (
    <svg width="72" height="64" viewBox="0 0 104 64" aria-hidden="true">
      {bars.map((h, i) => (
        <rect
          key={i}
          className="wave-bar"
          x={startX + i * 10}
          y={32 - h / 2}
          width={6}
          height={h}
          rx={3}
          fill="#22d3ee"
          style={{ animationDelay: `${i * 0.11}s` }}
        />
      ))}
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="spinner" width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <circle cx="17" cy="17" r="14" stroke="#1a2233" strokeWidth="3" fill="none" />
      <path
        d="M17 3a14 14 0 0 1 14 14"
        stroke="#22d3ee"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
