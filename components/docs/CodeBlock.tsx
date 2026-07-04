import type { ReactNode } from "react";
import { CopyButton } from "./CopyButton";

interface CodeBlockProps {
  filename: string;
  /** Plain-text form used for copy-to-clipboard. */
  code: string;
  children: ReactNode;
}

/** A titled code block with a copy button. Children are the highlighted markup. */
export function CodeBlock({ filename, code, children }: CodeBlockProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-inset">
      <div className="flex items-center justify-between border-b border-line bg-[#0b111f] px-4 py-3">
        <span className="font-mono text-xs text-ink-muted">{filename}</span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto px-[18px] py-4 font-mono text-[13.5px] leading-[1.7] text-[#c9d4e6]">
        <code>{children}</code>
      </pre>
    </div>
  );
}
