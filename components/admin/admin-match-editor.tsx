"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Save, Trophy, XCircle } from "lucide-react";
import { toast } from "sonner";

import { clearMatchResultAction, setMatchWinnerAction, updateMatchDetailsAction } from "@/actions/admin";
import { DateTimePicker } from "@/components/admin/date-time-picker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Player } from "@/db/schema";
import type { MatchWithPlayers } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const none = "__none";

export function AdminMatchEditor({
  matches,
  players,
}: {
  matches: MatchWithPlayers[];
  players: Player[];
}) {
  const grouped = useMemo(() => {
    const labels = ["Play-In", "Round of 16", "Quarterfinal", "Semifinal", "Final"];
    return labels.map((label) => ({
      label,
      matches: matches.filter((match) => match.roundLabel === label).sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  }, [matches]);

  return (
    <div className="space-y-6">
      {grouped.map((round) => (
        <section key={round.label} className="space-y-3">
          <h2 className="text-xl font-semibold text-primary">{round.label}</h2>
          <div className="grid gap-4 xl:grid-cols-2">
            {round.matches.map((match) => (
              <MatchEditorCard key={match.id} match={match} players={players} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function MatchEditorCard({ match, players }: { match: MatchWithPlayers; players: Player[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [player1Id, setPlayer1Id] = useState(match.player1Id?.toString() ?? none);
  const [player2Id, setPlayer2Id] = useState(match.player2Id?.toString() ?? none);
  const [status, setStatus] = useState(match.status);
  const [winnerId, setWinnerId] = useState(match.winnerId?.toString() ?? none);

  const hasDownstreamWinner = Boolean(match.winnerId && match.nextMatchId);
  const playerOptions = players.map((player) => (
    <SelectItem key={player.id} value={player.id.toString()}>
      {player.name}
    </SelectItem>
  ));

  function toNullableId(value: string) {
    return value === none ? null : Number(value);
  }

  function run(action: () => Promise<{ ok: boolean }>, success: string) {
    startTransition(async () => {
      try {
        await action();
        toast.success(success);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Update failed");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3 text-base">
          <span>{match.id}</span>
          <span className="text-sm font-normal text-muted-foreground">Deadline {formatDate(match.deadline)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasDownstreamWinner ? (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Downstream bracket impact</AlertTitle>
            <AlertDescription>Changing this result may clear dependent results in later rounds.</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Player 1</Label>
            <Select value={player1Id} onValueChange={setPlayer1Id}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={none}>TBD</SelectItem>
                {playerOptions}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Player 2</Label>
            <Select value={player2Id} onValueChange={setPlayer2Id}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={none}>TBD</SelectItem>
                {playerOptions}
              </SelectContent>
            </Select>
          </div>
        </div>

        <form
          className="grid gap-3"
          action={(formData) => {
            run(
              () =>
                updateMatchDetailsAction({
                  matchId: match.id,
                  player1Id: toNullableId(player1Id),
                  player2Id: toNullableId(player2Id),
                  scheduledAt: String(formData.get("scheduledAt") || "") || null,
                  location: String(formData.get("location") || "") || null,
                  details: String(formData.get("details") || "") || null,
                  status,
                }),
              "Match saved",
            );
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${match.id}-scheduled`}>Scheduled</Label>
              <DateTimePicker name="scheduledAt" defaultValue={match.scheduledAt} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(value: "pending" | "scheduled" | "completed") => setStatus(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${match.id}-location`}>Location</Label>
            <Input id={`${match.id}-location`} name="location" defaultValue={match.location ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${match.id}-details`}>Details</Label>
            <Textarea id={`${match.id}-details`} name="details" defaultValue={match.details ?? ""} />
          </div>
          <Button type="submit" variant="secondary" disabled={isPending}>
            <Save className="h-4 w-4" />
            Save match
          </Button>
        </form>

        <div className="grid gap-3 border-t pt-4 sm:grid-cols-[1fr_auto_auto]">
          <Select value={winnerId} onValueChange={setWinnerId}>
            <SelectTrigger><SelectValue placeholder="Select winner" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={none}>No winner</SelectItem>
              {match.player1 ? <SelectItem value={match.player1.id.toString()}>{match.player1.name}</SelectItem> : null}
              {match.player2 ? <SelectItem value={match.player2.id.toString()}>{match.player2.name}</SelectItem> : null}
            </SelectContent>
          </Select>
          <Button
            type="button"
            disabled={isPending || winnerId === none}
            onClick={() =>
              run(
                () => setMatchWinnerAction({ matchId: match.id, winnerId: Number(winnerId) }),
                "Winner updated",
              )
            }
          >
            <Trophy className="h-4 w-4" />
            Set winner
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending || !match.winnerId}
            onClick={() => run(() => clearMatchResultAction({ matchId: match.id }), "Result cleared")}
          >
            <XCircle className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
