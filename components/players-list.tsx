"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaymentStatusBadge, PreviousWinnerBadge } from "@/components/player-badge";
import type { Player } from "@/db/schema";
import { getPlayerTournamentStatus } from "@/lib/bracket-utils";
import type { MatchWithPlayers } from "@/lib/types";

export function PlayersList({
  players,
  matches,
}: {
  players: Player[];
  matches: MatchWithPlayers[];
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => players.filter((player) => player.name.toLowerCase().includes(query.toLowerCase())),
    [players, query],
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Search players" aria-label="Search players" />
      </div>

      <div className="hidden rounded-[2rem] border border-white/70 bg-white/55 shadow-xl backdrop-blur-2xl md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Handicap</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Previous Winner</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((player) => (
              <TableRow key={player.id}>
                <TableCell className="font-medium">{player.name}</TableCell>
                <TableCell>{player.handicapIndex != null ? Number(player.handicapIndex).toFixed(1) : "TBD"}</TableCell>
                <TableCell><PaymentStatusBadge paid={player.hasPaid} /></TableCell>
                <TableCell><PreviousWinnerBadge wins={player.previousWins} /></TableCell>
                <TableCell><Badge variant="secondary">{getPlayerTournamentStatus(player, matches)}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 md:hidden">
        {filtered.map((player) => (
          <Card key={player.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{player.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Handicap {player.handicapIndex != null ? Number(player.handicapIndex).toFixed(1) : "TBD"}
                  </p>
                </div>
                <Badge variant="secondary">{getPlayerTournamentStatus(player, matches)}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <PaymentStatusBadge paid={player.hasPaid} />
                <PreviousWinnerBadge wins={player.previousWins} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
