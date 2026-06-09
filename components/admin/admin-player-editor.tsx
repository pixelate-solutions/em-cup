"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Search } from "lucide-react";
import { toast } from "sonner";

import { updatePlayerAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PaymentStatusBadge, PreviousWinnerBadge } from "@/components/player-badge";
import type { Player } from "@/db/schema";
import { getPlayerTournamentStatus } from "@/lib/bracket-utils";
import type { MatchWithPlayers } from "@/lib/types";

export function AdminPlayerEditor({
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
      <div className="grid gap-4 xl:grid-cols-2">
        {filtered.map((player) => (
          <PlayerEditorCard key={player.id} player={player} status={getPlayerTournamentStatus(player, matches)} />
        ))}
      </div>
    </div>
  );
}

function PlayerEditorCard({ player, status }: { player: Player; status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hasPaid, setHasPaid] = useState(player.hasPaid);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          {player.name}
          <Badge variant="secondary">{status}</Badge>
          <PaymentStatusBadge paid={hasPaid} />
          <PreviousWinnerBadge wins={player.previousWins} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-3"
          action={(formData) => {
            startTransition(async () => {
              try {
                await updatePlayerAction({
                  id: player.id,
                  handicapIndex: String(formData.get("handicapIndex") || "") || null,
                  hasPaid,
                  notes: String(formData.get("notes") || "") || null,
                });
                toast.success("Player updated");
                router.refresh();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Player update failed");
              }
            });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`hcp-${player.id}`}>Handicap index</Label>
              <Input id={`hcp-${player.id}`} name="handicapIndex" inputMode="decimal" defaultValue={player.handicapIndex ?? ""} />
            </div>
            <div className="space-y-2">
              <Label>Payment</Label>
              <Button type="button" variant={hasPaid ? "secondary" : "outline"} onClick={() => setHasPaid((value) => !value)}>
                {hasPaid ? "Paid" : "Mark paid"}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`notes-${player.id}`}>Notes</Label>
            <Textarea id={`notes-${player.id}`} name="notes" defaultValue={player.notes ?? ""} />
          </div>
          <Button type="submit" disabled={isPending}>
            <Save className="h-4 w-4" />
            Save player
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
