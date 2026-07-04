"use client";

import { useState } from "react";

/** Copy-to-clipboard button used by code blocks; shows a brief confirmation. */
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — no-op.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="text-xs font-medium text-ink-secondary transition-colors hover:text-ink"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
