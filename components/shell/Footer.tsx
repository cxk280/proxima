import Link from "next/link";

const LINKS = [
  { label: "GitHub", href: "https://github.com/cxk280/proxima" },
  { label: "Docs", href: "/docs" },
  { label: "Status", href: "/mesh" },
];

/** Global footer: the Vultr capability line + resource links. */
export function Footer() {
  return (
    <footer className="flex flex-col items-center justify-between gap-3 border-t border-line bg-[#0b1020] px-6 py-4 text-sm sm:flex-row sm:px-12">
      <p className="text-ink-secondary">Powered by Vultr&apos;s 33-region GPU mesh.</p>
      <ul className="flex items-center gap-6">
        {LINKS.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="text-ink-muted transition-colors hover:text-ink-secondary">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </footer>
  );
}
