"use client";

import { useState } from "react";
import { CopyButton } from "./CopyButton";

const MANAGERS = {
  npm: "npm i @proxima/connect",
  pnpm: "pnpm add @proxima/connect",
  yarn: "yarn add @proxima/connect",
} as const;

type Manager = keyof typeof MANAGERS;

/** Install snippet with npm / pnpm / yarn tabs and copy-to-clipboard. */
export function InstallTabs() {
  const [active, setActive] = useState<Manager>("npm");
  const command = MANAGERS[active];

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-inset">
      <div className="flex items-center justify-between border-b border-line bg-[#0b111f] pr-3.5">
        <div className="flex">
          {(Object.keys(MANAGERS) as Manager[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setActive(m)}
              className={`px-4 py-3 font-mono text-[13px] transition-colors ${
                active === m
                  ? "border-b-2 border-cyan text-ink"
                  : "text-ink-muted hover:text-ink-secondary"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <CopyButton text={command} />
      </div>
      <div className="flex items-center gap-2 px-4 py-4 font-mono text-sm">
        <span className="text-cyan">$</span>
        <span className="text-ink">{command}</span>
      </div>
    </div>
  );
}
