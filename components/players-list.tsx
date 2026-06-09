"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaymentStatusBadge } from "@/components/player-badge";
import type { Player } from "@/db/schema";
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
  const winsByPlayerId = useMemo(() => {
    const wins = new Map<number, number>();
    for (const match of matches) {
      if (!match.winnerId) continue;
      wins.set(match.winnerId, (wins.get(match.winnerId) ?? 0) + 1);
    }
    return wins;
  }, [matches]);

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
              <TableHead className="text-center">Handicap</TableHead>
              <TableHead className="text-center">Paid</TableHead>
              <TableHead className="text-center">Matches Won</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((player) => {
              const matchesWon = winsByPlayerId.get(player.id) ?? 0;
              return (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell className="text-center">{player.handicapIndex != null ? Number(player.handicapIndex).toFixed(1) : "TBD"}</TableCell>
                  <TableCell className="text-center"><PaymentStatusBadge paid={player.hasPaid} /></TableCell>
                  <TableCell className="text-center font-semibold">{matchesWon}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 md:hidden">
        {filtered.map((player) => {
          const matchesWon = winsByPlayerId.get(player.id) ?? 0;
          return (
            <Card key={player.id}>
              <CardContent className="relative space-y-3 p-4 pr-28">
                <div className="absolute right-4 top-4">
                  <PaymentStatusBadge paid={player.hasPaid} />
                </div>
                <div>
                  <p className="font-semibold">{player.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Handicap {player.handicapIndex != null ? Number(player.handicapIndex).toFixed(1) : "TBD"}
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-700">Matches won: {matchesWon}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
