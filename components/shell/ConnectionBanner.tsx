"use client";

import { useEffect, useState } from "react";

/**
 * Thin amber banner shown when the live probe stream drops. Today it tracks the
 * browser's online/offline state as a stand-in for the (future) probe-stream health;
 * when the stream reconnects it disappears and latency numbers resume.
 */
export function ConnectionBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 border-b border-amber/30 bg-[#231b06] py-2.5"
    >
      <span
        className="h-2 w-2 rounded-full bg-amber"
        style={{ boxShadow: "0 0 6px #fbbf24" }}
      />
      <span className="font-mono text-[13px] text-amber">
        Live data paused — reconnecting…
      </span>
    </div>
  );
}
