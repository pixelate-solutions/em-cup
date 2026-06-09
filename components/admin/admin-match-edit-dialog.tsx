"use client";

import { useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import {
  clearMatchResultAction,
  setMatchWinnerAction,
  updateMatchDetailsAction,
} from "@/actions/admin";
import { DatePicker } from "@/components/admin/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMediaQuery } from "@/hooks/use-media-query";
import { getMatchDisplayName } from "@/lib/bracket-utils";
import type { Player } from "@/db/schema";
import type { MatchWithPlayers } from "@/lib/types";

const noneValue = "none";

export function AdminMatchEditDialog({
  match,
  players,
  open,
  onOpenChange,
}: {
  match: MatchWithPlayers | null;
  players: Player[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  if (!match) return null;

  const content = (
    <AdminMatchEditForm
      key={match.id}
      match={match}
      players={players}
      onSaved={() => onOpenChange(false)}
    />
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl rounded-2xl border-slate-200">
          <DialogHeader>
            <DialogTitle>{getMatchDisplayName(match)}</DialogTitle>
            <DialogDescription>
              Edit players, date played, location, winner, and notes.
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{getMatchDisplayName(match)}</DrawerTitle>
          <DrawerDescription>
            Edit players, date played, location, winner, and notes.
          </DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6">{content}</div>
      </DrawerContent>
    </Drawer>
  );
}

function AdminMatchEditForm({
  match,
  players,
  onSaved,
}: {
  match: MatchWithPlayers;
  players: Player[];
  onSaved: () => void;
}) {
  const [player1Id, setPlayer1Id] = useState(toSelectValue(match.player1Id));
  const [player2Id, setPlayer2Id] = useState(toSelectValue(match.player2Id));
  const [winnerId, setWinnerId] = useState(toSelectValue(match.winnerId));
  const [datePlayed, setDatePlayed] = useState<Date | undefined>(
    match.scheduledAt ? new Date(match.scheduledAt) : undefined,
  );
  const [location, setLocation] = useState(match.location ?? "");
  const [details, setDetails] = useState(match.details ?? "");
  const [isPending, startTransition] = useTransition();

  const winnerOptions = useMemo(() => {
    const ids = [player1Id, player2Id].filter((id) => id !== noneValue);
    return players.filter((player) => ids.includes(String(player.id)));
  }, [player1Id, player2Id, players]);

  const save = () => {
    startTransition(async () => {
      try {
        const nextWinnerId = winnerId === player1Id || winnerId === player2Id ? fromSelectValue(winnerId) : null;
        const player1Changed = fromSelectValue(player1Id) !== match.player1Id;
        const player2Changed = fromSelectValue(player2Id) !== match.player2Id;
        const participantsChanged = player1Changed || player2Changed;
        await updateMatchDetailsAction({
          matchId: match.id,
          player1Id: fromSelectValue(player1Id),
          player2Id: fromSelectValue(player2Id),
          scheduledAt: datePlayed ? toDateOnlyDateTime(datePlayed) : null,
          location: location.trim() || null,
          details: details.trim() || null,
          status: nextWinnerId ? "completed" : datePlayed ? "scheduled" : "pending",
        });

        if (nextWinnerId && (nextWinnerId !== match.winnerId || participantsChanged)) {
          await setMatchWinnerAction({ matchId: match.id, winnerId: nextWinnerId });
        } else if (!nextWinnerId && match.winnerId) {
          await clearMatchResultAction({ matchId: match.id });
        }

        toast.success("Match updated");
        onSaved();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update match");
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Player 1">
          <PlayerSelect
            value={player1Id}
            players={players}
            onChange={(value) => {
              setPlayer1Id(value);
              if (winnerId !== noneValue && winnerId !== value && winnerId !== player2Id) {
                setWinnerId(noneValue);
              }
            }}
          />
        </Field>
        <Field label="Player 2">
          <PlayerSelect
            value={player2Id}
            players={players}
            onChange={(value) => {
              setPlayer2Id(value);
              if (winnerId !== noneValue && winnerId !== player1Id && winnerId !== value) {
                setWinnerId(noneValue);
              }
            }}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date played">
          <DatePicker value={datePlayed} onChange={setDatePlayed} />
        </Field>
        <Field label="Location played">
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Great Oaks"
          />
        </Field>
      </div>

      <Field label="Winner">
        <Select value={winnerId} onValueChange={setWinnerId}>
          <SelectTrigger className="rounded-xl border-slate-300 bg-white">
            <SelectValue placeholder="Select winner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={noneValue}>No winner</SelectItem>
            {winnerOptions.map((player) => (
              <SelectItem key={player.id} value={String(player.id)}>
                {player.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Details">
        <Textarea
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          className="min-h-28 rounded-xl border-slate-300 bg-white"
          placeholder="Optional match notes"
        />
      </Field>

      <Button type="button" className="w-full rounded-xl" disabled={isPending} onClick={save}>
        {isPending ? "Saving..." : "Save match"}
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-bold text-slate-700">{label}</Label>
      {children}
    </div>
  );
}

function PlayerSelect({
  value,
  players,
  onChange,
}: {
  value: string;
  players: Player[];
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="rounded-xl border-slate-300 bg-white">
        <SelectValue placeholder="Select player" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={noneValue}>TBD</SelectItem>
        {players.map((player) => (
          <SelectItem key={player.id} value={String(player.id)}>
            {player.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function toSelectValue(value: number | null | undefined) {
  return value ? String(value) : noneValue;
}

function fromSelectValue(value: string) {
  return value === noneValue ? null : Number(value);
}

function toDateOnlyDateTime(date: Date) {
  const local = new Date(date);
  local.setHours(12, 0, 0, 0);
  const offset = local.getTimezoneOffset();
  return new Date(local.getTime() - offset * 60_000).toISOString().slice(0, 16);
}
