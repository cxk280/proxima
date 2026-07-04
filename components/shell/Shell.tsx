import type { ReactNode } from "react";
import { ConnectionBanner } from "./ConnectionBanner";
import { TopBar } from "./TopBar";
import { Footer } from "./Footer";

interface ShellProps {
  children: ReactNode;
  /** Let the main region grow to fill the viewport (used by one-screenful views). */
  fill?: boolean;
}

/** Global chrome: connection banner → top bar → page → footer. */
export function Shell({ children, fill = false }: ShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <ConnectionBanner />
      <TopBar />
      <main className={fill ? "flex flex-1 flex-col" : "flex-1"}>{children}</main>
      <Footer />
    </div>
  );
}
