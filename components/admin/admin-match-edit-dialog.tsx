"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="shrink-0 px-6 pb-0 pt-6 pr-12">
          <DialogTitle>{getMatchDisplayName(match)}</DialogTitle>
          <DialogDescription>
            Edit players, date played, location, winner, and notes.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto px-6 pb-6">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AdminMatchEditForm({
  match,
  players,
}: {
  match: MatchWithPlayers;
  players: Player[];
}) {
  const [player1Id, setPlayer1Id] = useState(toSelectValue(match.player1Id));
  const [player2Id, setPlayer2Id] = useState(toSelectValue(match.player2Id));
  const [winnerId, setWinnerId] = useState(toSelectValue(match.winnerId));
  const [datePlayed, setDatePlayed] = useState<Date | undefined>(
    match.scheduledAt ? new Date(match.scheduledAt) : undefined,
  );
  const [player1HandicapIndex, setPlayer1HandicapIndex] = useState(match.player1HandicapIndex ?? "");
  const [player2HandicapIndex, setPlayer2HandicapIndex] = useState(match.player2HandicapIndex ?? "");
  const [location, setLocation] = useState(match.location ?? "");
  const [details, setDetails] = useState(match.details ?? "");
  const [, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState("");
  const lastSavedRef = useRef({
    player1Id,
    player2Id,
    winnerId,
    datePlayed: datePlayed ? toDateOnlyDateTime(datePlayed) : null,
    player1HandicapIndex: String(player1HandicapIndex),
    player2HandicapIndex: String(player2HandicapIndex),
    location: location.trim(),
    details: details.trim(),
  });
  const debounceRef = useRef<number | null>(null);
  const statusTimeoutRef = useRef<number | null>(null);
  const statusMinUntilRef = useRef(0);

  const winnerOptions = useMemo(() => {
    const ids = [player1Id, player2Id].filter((id) => id !== noneValue);
    return players.filter((player) => ids.includes(String(player.id)));
  }, [player1Id, player2Id, players]);

  function showStatus(message: string, minimumMs = 0) {
    if (statusTimeoutRef.current != null) {
      window.clearTimeout(statusTimeoutRef.current);
    }

    statusMinUntilRef.current = Math.max(statusMinUntilRef.current, Date.now() + minimumMs);
    setSaveStatus(message);
  }

  function finishStatus() {
    const remainingMs = Math.max(0, statusMinUntilRef.current - Date.now());
    if (statusTimeoutRef.current != null) {
      window.clearTimeout(statusTimeoutRef.current);
    }

    statusTimeoutRef.current = window.setTimeout(() => {
      setSaveStatus("Saved");
      statusTimeoutRef.current = window.setTimeout(() => setSaveStatus(""), 1200);
    }, remainingMs);
  }

  useEffect(() => {
    const next = {
      player1Id,
      player2Id,
      winnerId: winnerId === player1Id || winnerId === player2Id ? winnerId : noneValue,
      datePlayed: datePlayed ? toDateOnlyDateTime(datePlayed) : null,
      player1HandicapIndex: player1HandicapIndex.toString().trim(),
      player2HandicapIndex: player2HandicapIndex.toString().trim(),
      location: location.trim(),
      details: details.trim(),
    };

    const lastSaved = lastSavedRef.current;
    if (
      next.player1Id === lastSaved.player1Id &&
      next.player2Id === lastSaved.player2Id &&
      next.winnerId === lastSaved.winnerId &&
      next.datePlayed === lastSaved.datePlayed &&
      next.player1HandicapIndex === lastSaved.player1HandicapIndex &&
      next.player2HandicapIndex === lastSaved.player2HandicapIndex &&
      next.location === lastSaved.location &&
      next.details === lastSaved.details
    ) {
      return;
    }

    debounceRef.current = window.setTimeout(() => {
      startTransition(async () => {
        try {
          const nextWinnerId = fromSelectValue(next.winnerId);
          const previousWinnerId = fromSelectValue(lastSavedRef.current.winnerId);
          const participantsChanged =
            next.player1Id !== lastSavedRef.current.player1Id ||
            next.player2Id !== lastSavedRef.current.player2Id;
          const shouldSetWinner = Boolean(
            nextWinnerId && (nextWinnerId !== previousWinnerId || participantsChanged),
          );

          showStatus(shouldSetWinner ? "Updating handicaps..." : "Saving...", shouldSetWinner ? 1800 : 0);

          await updateMatchDetailsAction({
            matchId: match.id,
            player1Id: fromSelectValue(next.player1Id),
            player2Id: fromSelectValue(next.player2Id),
            player1HandicapIndex: next.player1HandicapIndex || null,
            player2HandicapIndex: next.player2HandicapIndex || null,
            scheduledAt: next.datePlayed,
            location: next.location || null,
            details: next.details || null,
            status: nextWinnerId ? "completed" : next.datePlayed ? "scheduled" : "pending",
          });

          if (shouldSetWinner && nextWinnerId) {
            const result = await setMatchWinnerAction({ matchId: match.id, winnerId: nextWinnerId });
            if (!next.player1HandicapIndex && result.player1HandicapIndex != null) {
              setPlayer1HandicapIndex(result.player1HandicapIndex);
              next.player1HandicapIndex = result.player1HandicapIndex;
            }
            if (!next.player2HandicapIndex && result.player2HandicapIndex != null) {
              setPlayer2HandicapIndex(result.player2HandicapIndex);
              next.player2HandicapIndex = result.player2HandicapIndex;
            }
          } else if (!nextWinnerId && previousWinnerId) {
            await clearMatchResultAction({
              matchId: match.id,
              player1HandicapIndex: next.player1HandicapIndex || null,
              player2HandicapIndex: next.player2HandicapIndex || null,
            });
          }

          lastSavedRef.current = next;
          finishStatus();
        } catch (error) {
          setSaveStatus("");
          toast.error(error instanceof Error ? error.message : "Unable to update match");
        }
      });
    }, 500);

    return () => {
      if (debounceRef.current != null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [
    player1Id,
    player2Id,
    winnerId,
    datePlayed,
    player1HandicapIndex,
    player2HandicapIndex,
    location,
    details,
    match.id,
  ]);

  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current != null) {
        window.clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex min-h-0 flex-col gap-5">
      {saveStatus ? (
        <MatchSaveStatus message={saveStatus} />
      ) : null}

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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Player 1 handicap">
          <input
            value={player1HandicapIndex}
            onChange={(event) => setPlayer1HandicapIndex(event.target.value)}
            className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            inputMode="decimal"
            placeholder={match.player1?.handicapIndex != null ? Number(match.player1.handicapIndex).toFixed(1) : "GHIN/current"}
          />
        </Field>
        <Field label="Player 2 handicap">
          <input
            value={player2HandicapIndex}
            onChange={(event) => setPlayer2HandicapIndex(event.target.value)}
            className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            inputMode="decimal"
            placeholder={match.player2?.handicapIndex != null ? Number(match.player2.handicapIndex).toFixed(1) : "GHIN/current"}
          />
        </Field>
      </div>

      <Field label="Winner">
        <Select
          value={winnerId}
          onValueChange={(value) => {
            if (value !== noneValue) {
              showStatus("Updating handicaps...", 1800);
            }
            setWinnerId(value);
          }}
        >
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
          className="min-h-24 rounded-xl border-slate-300 bg-white"
          placeholder="Optional match notes"
        />
      </Field>

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

function MatchSaveStatus({ message }: { message: string }) {
  const saved = message === "Saved";
  return (
    <div
      className={
        saved
          ? "flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800"
          : "flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950 shadow-sm"
      }
      aria-live="polite"
    >
      {saved ? null : <Loader2 className="h-4 w-4 animate-spin" />}
      {message}
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
