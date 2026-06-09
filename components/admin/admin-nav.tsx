import Link from "next/link";
import { LogOut } from "lucide-react";

import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

const adminLinks = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/matches", label: "Matches" },
  { href: "/admin/players", label: "Players" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/prizes", label: "Prizes" },
];

export function AdminNav() {
  return (
    <div className="flex flex-col gap-3 border-b bg-white/70 py-4 backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage EM Cup matches, players, payments, prizes, and settings.</p>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </form>
        </div>
        <nav className="flex gap-2 overflow-x-auto" aria-label="Admin navigation">
          {adminLinks.map((link) => (
            <Button key={link.href} asChild variant="secondary" size="sm">
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>
      </div>
    </div>
  );
}
