import Link from "next/link";
import type { ReactNode } from "react";

interface ButtonProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}

/** Primary = cyan fill (with a soft glow); secondary = outlined. Links, not <button>. */
export function Button({ href, children, variant = "primary", className = "" }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-[10px] px-6 py-3.5 text-[15px] font-semibold transition-colors";
  const styles =
    variant === "primary"
      ? "bg-cyan text-navy-ink shadow-[0_4px_18px_rgba(34,211,238,0.35)] hover:bg-cyan/90"
      : "border border-line text-ink hover:border-line-strong hover:bg-elevated/40";
  return (
    <Link href={href} className={`${base} ${styles} ${className}`}>
      {children}
    </Link>
  );
}
