import Link from "next/link";

interface StubViewProps {
  eyebrow: string;
  title: string;
  blurb: string;
}

/**
 * Placeholder for views shipping in later factory runs, so navigation resolves today.
 * Keeps the mission-control look rather than a blank 404.
 */
export function StubView({ eyebrow, title, blurb }: StubViewProps) {
  return (
    <section className="mx-auto flex w-full max-w-[720px] flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <p className="font-mono text-[13px] tracking-[0.15em] text-cyan">{eyebrow}</p>
      <h1 className="text-4xl font-bold tracking-[-0.02em] text-ink">{title}</h1>
      <p className="max-w-[520px] text-lg leading-relaxed text-ink-secondary">{blurb}</p>
      <Link
        href="/"
        className="mt-2 text-sm font-medium text-ink-secondary underline-offset-4 transition-colors hover:text-ink hover:underline"
      >
        ← Back to Home
      </Link>
    </section>
  );
}
