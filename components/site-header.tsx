"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { EM_LOGO_SRC } from "@/lib/assets";
import { SITE_NAME, SITE_SUBTITLE } from "@/lib/constants";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/bracket", label: "Bracket" },
  { href: "/players", label: "Players" },
  { href: "/rules", label: "Rules" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-sm ring-1 ring-primary/10">
            <Image
              src={EM_LOGO_SRC}
              alt="Electro-Matic logo"
              width={40}
              height={40}
              className="h-auto w-full"
              priority
              unoptimized
            />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-bold leading-5 text-primary">{SITE_NAME} 2026</span>
            <span className="hidden truncate text-xs text-muted-foreground sm:block">{SITE_SUBTITLE}</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative py-2 text-sm font-semibold text-foreground transition-colors hover:text-primary",
                pathname === item.href &&
                  "text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl border-primary/15 bg-white md:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent className="md:hidden">
            <SheetHeader className="pr-10">
              <SheetTitle>EM Cup 2026</SheetTitle>
              <SheetDescription>{SITE_SUBTITLE}</SheetDescription>
            </SheetHeader>
            <nav className="mt-8 grid gap-2" aria-label="Mobile navigation">
              {navItems.map((item) => (
                <SheetClose key={item.href} asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "rounded-2xl px-4 py-3 text-base font-semibold text-foreground transition-colors hover:bg-slate-100 hover:text-primary",
                      pathname === item.href && "bg-primary/10 text-primary",
                    )}
                  >
                    {item.label}
                  </Link>
                </SheetClose>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
