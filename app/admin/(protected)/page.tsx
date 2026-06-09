import {
  CircleDollarSign,
  Flag,
  Trophy,
  UserCheck,
  WalletCards,
} from "lucide-react";

import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BUY_IN_AMOUNT } from "@/lib/constants";
import { getTournamentData } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { players, matches } = await getTournamentData();
  const paidCount = players.filter((player) => player.hasPaid).length;
  const completed = matches.filter((match) => match.status === "completed").length;
  const remainingMatches = matches.length - completed;
  const eliminatedPlayerIds = new Set(matches.flatMap((match) => (match.loserId ? [match.loserId] : [])));
  const remainingPlayers = players.length - eliminatedPlayerIds.size;
  const champion = matches.find((match) => match.id === "F1")?.winner;
  const previousWinners = players.filter((player) => player.isPreviousWinner).length;
  const handicapsEntered = players.filter((player) => player.handicapIndex != null).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Players Remaining" value={remainingPlayers} icon={UserCheck} />
        <StatCard label="Money Collected" value={formatCurrency(paidCount * BUY_IN_AMOUNT)} icon={CircleDollarSign} />
        <StatCard label="Matches Played" value={`${completed}/${matches.length}`} icon={Flag} />
        <StatCard label="Matches Remaining" value={remainingMatches} icon={Trophy} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Payment Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Paid</span>
              <Badge variant="success">{paidCount}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Unpaid</span>
              <Badge variant="warning">{players.length - paidCount}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Expected total</span>
              <span className="font-semibold">{formatCurrency(players.length * BUY_IN_AMOUNT)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Bracket Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Matches with results</span>
              <span className="font-semibold">{completed}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Matches left to play</span>
              <span className="font-semibold">{remainingMatches}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Players with handicaps</span>
              <span className="font-semibold">{handicapsEntered}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <WalletCards className="h-5 w-5 text-primary" />
              Tournament Quick Look
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total players</span>
              <span className="font-semibold">{players.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Champion</span>
              <span className="font-semibold">{champion?.name ?? "TBD"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Buy-in</span>
              <span className="font-semibold">{formatCurrency(BUY_IN_AMOUNT)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Previous winners</span>
              <span className="font-semibold">{previousWinners}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
