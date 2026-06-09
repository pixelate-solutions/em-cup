import Link from "next/link";
import { CircleDollarSign, Flag, Gift, Users } from "lucide-react";

import { AdminSettingsEditor } from "@/components/admin/admin-settings-editor";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTournamentData } from "@/lib/data";
import { BUY_IN_AMOUNT } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { players, matches, prizes, settings } = await getTournamentData();
  const paidCount = players.filter((player) => player.hasPaid).length;
  const completed = matches.filter((match) => match.status === "completed").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Players" value={players.length} icon={Users} />
        <StatCard label="Completed Matches" value={`${completed}/${matches.length}`} icon={Flag} />
        <StatCard label="Collected" value={formatCurrency(paidCount * BUY_IN_AMOUNT)} icon={CircleDollarSign} />
        <StatCard label="Prizes" value={prizes.length} icon={Gift} />
      </div>
      <Card>
        <CardHeader><CardTitle>Admin Sections</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button asChild variant="secondary"><Link href="/admin/matches">Edit Matches</Link></Button>
          <Button asChild variant="secondary"><Link href="/admin/players">Edit Players</Link></Button>
          <Button asChild variant="secondary"><Link href="/admin/payments">Track Payments</Link></Button>
          <Button asChild variant="secondary"><Link href="/admin/prizes">Assign Prizes</Link></Button>
        </CardContent>
      </Card>
      <AdminSettingsEditor settings={settings} />
    </div>
  );
}
