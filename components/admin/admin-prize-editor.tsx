"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Gift, Save } from "lucide-react";
import { toast } from "sonner";

import { updatePrizeAction } from "@/actions/admin";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Player } from "@/db/schema";
import type { MatchWithPlayers, PrizeWithWinner } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const none = "__none";

export function AdminPrizeEditor({
  prizes,
  players,
  matches,
}: {
  prizes: PrizeWithWinner[];
  players: Player[];
  matches: MatchWithPlayers[];
}) {
  const champion = matches.find((match) => match.id === "F1")?.winner;
  const repeatChampion = champion?.isPreviousWinner;

  return (
    <div className="space-y-4">
      {repeatChampion ? (
        <Alert>
          <AlertDescription>Patch instead of new Blue Jacket.</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {prizes.map((prize) => (
          <PrizeEditorCard key={prize.id} prize={prize} players={players} />
        ))}
      </div>
    </div>
  );
}

function PrizeEditorCard({ prize, players }: { prize: PrizeWithWinner; players: Player[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState(prize.winnerPlayerId?.toString() ?? none);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3 text-base">
          <span>{prize.name}</span>
          <Gift className="h-4 w-4 text-primary" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-2xl font-semibold text-primary">{formatCurrency(prize.amount)}</p>
        {prize.description ? <p className="text-sm text-muted-foreground">{prize.description}</p> : null}
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={none}>TBD</SelectItem>
            {players.map((player) => (
              <SelectItem key={player.id} value={player.id.toString()}>{player.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              try {
                await updatePrizeAction({
                  prizeId: prize.id,
                  winnerPlayerId: selected === none ? null : Number(selected),
                });
                toast.success("Prize updated");
                router.refresh();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Prize update failed");
              }
            });
          }}
        >
          <Save className="h-4 w-4" />
          Save prize
        </Button>
      </CardContent>
    </Card>
  );
}
