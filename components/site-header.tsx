import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { SITE_NAME, SITE_SUBTITLE } from "@/lib/constants";

const navItems = [
  { href: "/bracket", label: "Bracket" },
  { href: "/players", label: "Players" },
  { href: "/rules", label: "Rules" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/70 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 p-2 shadow-sm ring-1 ring-primary/10 backdrop-blur">
            <Image src="/em-logo.png" alt="Electro-Matic logo" width={40} height={40} className="h-auto w-full" priority />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-bold leading-5 text-primary">{SITE_NAME}</span>
            <span className="hidden truncate text-xs text-muted-foreground sm:block">{SITE_SUBTITLE}</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Button key={item.href} asChild variant="ghost" size="sm" className="text-base">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
        <div className="grid grid-cols-4 gap-1 md:hidden" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-2 py-1 text-center text-sm font-semibold text-muted-foreground hover:bg-white/75 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
