"use client";

import { useEffect, useState } from "react";

/**
 * Thin amber banner shown when the probe backend is unreachable. Polls `/api/health`
 * every few seconds (and reacts to the browser going offline); when the backend answers
 * again it disappears and latency numbers resume.
 */
export function ConnectionBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let live = true;

    async function check() {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        if (live) setOffline(true);
        return;
      }
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (live) setOffline(!res.ok);
      } catch {
        if (live) setOffline(true);
      }
    }

    check();
    const timer = setInterval(check, 5000);
    const onOffline = () => setOffline(true);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", check);
    return () => {
      live = false;
      clearInterval(timer);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", check);
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
