import Link from "next/link";
import { InstallTabs } from "./InstallTabs";
import { ConnectSample } from "./ConnectSample";

const NAV = [
  "Quickstart",
  "connect()",
  "Session lifecycle",
  "Failover behavior",
  "Nearest-region selection",
  "API reference",
];

const OPTIONS: [string, string, string][] = [
  ["app", "string", "Logical app name for routing & metrics."],
  ["region", "'auto' | id", "Pin a region, or auto-select the nearest."],
  ["onFailover", "(e) => void", "Fires when a session re-homes to a new region."],
];

export function DocsView() {
  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="shrink-0 border-b border-line bg-[#0b1020] px-8 py-8 lg:w-[260px] lg:border-b-0 lg:border-r">
        <p className="mb-4 font-mono text-[11px] tracking-[0.12em] text-ink-muted">SDK</p>
        <ul className="flex flex-col gap-1">
          {NAV.map((item, i) => (
            <li key={item}>
              <span
                className={`block rounded-lg px-3 py-2 text-sm ${
                  i === 0
                    ? "bg-[#0e2029] font-semibold text-cyan"
                    : "font-medium text-ink-secondary"
                }`}
              >
                {item}
              </span>
            </li>
          ))}
        </ul>
      </aside>

      {/* Content */}
      <div className="flex-1 px-6 py-11 sm:px-16">
        <div className="mx-auto flex max-w-[720px] flex-col gap-6">
          <p className="font-mono text-xs tracking-[0.15em] text-cyan">QUICKSTART</p>
          <h1 className="text-[34px] font-bold tracking-[-0.02em] text-ink">
            One endpoint. Nearest region.
          </h1>
          <p className="text-base leading-relaxed text-ink-secondary">
            Point your interactive-AI app at a single Proxima endpoint. <code className="font-mono text-cyan">connect()</code>{" "}
            opens a session on the closest healthy GPU region and transparently re-homes it as
            conditions change.
          </p>

          <InstallTabs />

          <h2 className="mt-3 text-xl font-semibold text-ink">Open a session</h2>
          <ConnectSample />

          <h2 className="mt-3 text-xl font-semibold text-ink">
            <code className="font-mono">connect()</code> options
          </h2>
          <div className="overflow-hidden rounded-xl border border-line bg-[#0e1422]">
            {OPTIONS.map(([name, type, desc], i) => (
              <div
                key={name}
                className={`flex flex-col gap-1 px-[18px] py-3.5 sm:flex-row sm:items-center sm:gap-4 ${
                  i < OPTIONS.length - 1 ? "border-b border-line/60" : ""
                }`}
              >
                <span className="w-[120px] shrink-0 font-mono text-[13px] text-amber">{name}</span>
                <span className="w-[150px] shrink-0 font-mono text-[13px] text-green">{type}</span>
                <span className="text-[13px] text-ink-secondary">{desc}</span>
              </div>
            ))}
          </div>

          {/* Try-it callout */}
          <div className="mt-3 flex flex-col items-start justify-between gap-4 rounded-xl border border-cyan/40 bg-[#0c1e27] px-5 py-[18px] sm:flex-row sm:items-center">
            <div>
              <p className="text-[15px] font-semibold text-ink">See it live</p>
              <p className="mt-0.5 text-[13px] text-ink-secondary">
                Open the reference voice agent and watch it re-home in real time.
              </p>
            </div>
            <Link
              href="/demo"
              className="shrink-0 rounded-[9px] bg-cyan px-[18px] py-2.5 text-sm font-semibold text-navy-ink"
            >
              Try the demo →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
