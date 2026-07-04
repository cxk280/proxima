import { CodeBlock } from "./CodeBlock";

// Each token is [text, className?]. Kept as data so whitespace and colours are exact
// and the plain-text copy form is derived from the same source.
type Tok = [string, string?];

const LINES: Tok[][] = [
  [["import", "text-cyan"], [" { connect } "], ["from", "text-cyan"], [" "], ["'@proxima/connect'", "text-green"]],
  [],
  [["const", "text-cyan"], [" session = "], ["await", "text-cyan"], [" connect({"]],
  [["  "], ["app", "text-amber"], [": "], ["'voice-agent'", "text-green"], [","]],
  [["  "], ["region", "text-amber"], [": "], ["'auto'", "text-green"], [", "], ["// nearest healthy region", "text-ink-muted"]],
  [["})"]],
  [],
  [["session."], ["on", "text-cyan"], ["("], ["'homed'", "text-green"], [", ({ region, rttMs }) => {"]],
  [["  console."], ["log", "text-cyan"], ["("], ["`${region} · ${rttMs}ms`", "text-green"], [")"]],
  [["})"]],
];

const PLAIN = LINES.map((line) => line.map(([t]) => t).join("")).join("\n");

export function ConnectSample() {
  return (
    <CodeBlock filename="app.ts" code={PLAIN}>
      {LINES.map((line, i) => (
        <span key={i}>
          {line.map(([text, cls], j) =>
            cls ? (
              <span key={j} className={cls}>
                {text}
              </span>
            ) : (
              <span key={j}>{text}</span>
            ),
          )}
          {"\n"}
        </span>
      ))}
    </CodeBlock>
  );
}
