"use client";

import Link from "next/link";
import { Shell } from "@/components/shell/Shell";

/**
 * Global data-outage / error fallback (VIEWS.md §6). Next renders this when a route
 * throws — here it stands in for "the probe backend is unreachable": latency data is
 * paused, with a retry and a link to Mesh Status.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Shell fill>
      <div className="flex items-center justify-center gap-2 border-b border-amber/30 bg-[#231b06] py-2.5">
        <span className="h-2 w-2 rounded-full bg-amber" style={{ boxShadow: "0 0 6px #fbbf24" }} />
        <span className="font-mono text-[13px] text-amber">Live data paused — reconnecting…</span>
      </div>

      <section className="mx-auto flex w-full max-w-[720px] flex-1 flex-col items-center justify-center gap-2.5 px-6 py-16 text-center">
        <div
          className="flex h-[92px] w-[92px] items-center justify-center rounded-full border-2 border-amber/50 bg-[#1c1606] text-4xl"
          style={{ boxShadow: "0 0 24px rgba(251,191,36,0.25)" }}
        >
          <span className="text-amber">⚠</span>
        </div>
        <h1 className="mt-3 text-[32px] font-bold tracking-[-0.02em] text-ink">
          Live data is unavailable
        </h1>
        <p className="max-w-[480px] text-base text-ink-secondary">
          We can&apos;t reach the probe backend right now, so latency readings are paused.
        </p>
        <p className="text-sm text-ink-muted">
          Last values are shown dimmed until the stream reconnects.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-[10px] bg-cyan px-6 py-3.5 text-[15px] font-semibold text-navy-ink shadow-[0_4px_16px_rgba(34,211,238,0.35)]"
          >
            ↻ Retry connection
          </button>
          <Link
            href="/mesh"
            className="rounded-[10px] border border-line px-6 py-3.5 text-[15px] font-semibold text-ink hover:border-line-strong"
          >
            View Mesh Status
          </Link>
        </div>
      </section>
    </Shell>
  );
}
