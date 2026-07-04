import Link from "next/link";
import { MeshPill } from "@/components/ui/MeshPill";

const NAV = [
  { label: "Demo", href: "/demo" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Docs", href: "/docs" },
];

/** Global top bar: wordmark + glowing glyph, nav, and the live mesh-status pill. */
export function TopBar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-line bg-[#0b1020] px-6 sm:px-12">
      <Link href="/" className="flex items-center gap-2.5" aria-label="Proxima home">
        <span
          className="h-[18px] w-[18px] rounded-full border-[1.5px] border-cyan bg-[#0b1224]"
          style={{ boxShadow: "0 0 8px rgba(34,211,238,0.5)" }}
        />
        <span className="text-lg font-bold tracking-[0.12em] text-ink">PROXIMA</span>
      </Link>

      <nav className="flex items-center gap-5 sm:gap-7">
        <ul className="hidden items-center gap-7 sm:flex">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-sm font-medium text-ink-secondary transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <MeshPill />
      </nav>
    </header>
  );
}
