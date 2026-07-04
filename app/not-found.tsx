import Link from "next/link";
import { Shell } from "@/components/shell/Shell";
import { Globe } from "@/components/globe/Globe";

export default function NotFound() {
  return (
    <Shell fill>
      <section className="mx-auto flex w-full max-w-[720px] flex-1 flex-col items-center justify-center gap-1 px-6 py-16 text-center">
        <div className="relative w-full max-w-[420px] opacity-40">
          <Globe size={420} className="h-auto w-full overflow-visible" />
        </div>
        <p className="mt-2 font-mono text-sm tracking-[0.2em] text-cyan">404</p>
        <h1 className="text-[38px] font-bold tracking-[-0.02em] text-ink">
          This route didn&apos;t route.
        </h1>
        <p className="text-base text-ink-secondary">
          The page you&apos;re looking for isn&apos;t anywhere in the mesh.
        </p>
        <Link
          href="/"
          className="mt-5 rounded-[10px] bg-cyan px-6 py-3.5 text-[15px] font-semibold text-navy-ink shadow-[0_4px_16px_rgba(34,211,238,0.35)]"
        >
          ← Back to Home
        </Link>
      </section>
    </Shell>
  );
}
