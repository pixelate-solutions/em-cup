"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/matches", label: "Matches" },
  { href: "/admin/players", label: "Players" },
  { href: "/admin/prizes", label: "Prizes" },
];

export function AdminNav() {
  const pathname = usePathname();
  const active = adminLinks.find((link) => link.href === pathname) ?? adminLinks[0];

  return (
    <div className="border-b bg-white/90 py-5 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">{active.label}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage EM Cup matches, players, payments, and prizes.
            </p>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm" className="rounded-lg bg-white">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </form>
        </div>
        <nav
          className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-2 rounded-2xl border bg-slate-50 p-2 sm:grid-cols-4"
          aria-label="Admin navigation"
        >
          {adminLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-xl px-5 py-2.5 text-center text-sm font-bold text-slate-600 transition hover:bg-white hover:text-primary",
                  isActive && "bg-white text-primary shadow-sm ring-1 ring-primary/10",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
