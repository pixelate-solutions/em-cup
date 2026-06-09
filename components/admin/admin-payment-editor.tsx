"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownUp, Search } from "lucide-react";
import { toast } from "sonner";

import { updatePlayerAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { PaymentStatusBadge } from "@/components/player-badge";
import type { Player } from "@/db/schema";
import type { MatchWithPlayers } from "@/lib/types";

type SortKey = "name" | "handicap" | "paid" | "matchWins";
type SortDirection = "asc" | "desc";

export function AdminPaymentEditor({
  players,
  matches,
}: {
  players: Player[];
  matches: MatchWithPlayers[];
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const winsByPlayerId = useMemo(() => {
    const wins = new Map<number, number>();
    for (const match of matches) {
      if (!match.winnerId) continue;
      wins.set(match.winnerId, (wins.get(match.winnerId) ?? 0) + 1);
    }
    return wins;
  }, [matches]);

  const filteredPlayers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const result = players.filter((player) => player.name.toLowerCase().includes(normalized));

    return result.sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      if (sortKey === "name") return a.name.localeCompare(b.name) * direction;
      if (sortKey === "paid") return (Number(a.hasPaid) - Number(b.hasPaid)) * direction;
      if (sortKey === "matchWins") return ((winsByPlayerId.get(a.id) ?? 0) - (winsByPlayerId.get(b.id) ?? 0)) * direction;

      const aHandicap = a.handicapIndex == null ? Number.POSITIVE_INFINITY : Number(a.handicapIndex);
      const bHandicap = b.handicapIndex == null ? Number.POSITIVE_INFINITY : Number(b.handicapIndex);
      return (aHandicap - bHandicap) * direction;
    });
  }, [players, query, sortDirection, sortKey, winsByPlayerId]);

  function updateSort(nextKey: SortKey) {
    if (nextKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection("asc");
  }

  return (
    <Card className="rounded-2xl bg-white shadow-sm">
      <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Players</CardTitle>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
            placeholder="Search players"
            aria-label="Search players"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="hidden md:block">
          <Table>
          <TableHeader>
            <TableRow>
              <SortableHead label="Player" active={sortKey === "name"} onClick={() => updateSort("name")} />
              <SortableHead label="Handicap" active={sortKey === "handicap"} align="center" onClick={() => updateSort("handicap")} />
              <SortableHead label="Paid" active={sortKey === "paid"} align="center" onClick={() => updateSort("paid")} />
              <SortableHead label="Matches Won" active={sortKey === "matchWins"} align="center" onClick={() => updateSort("matchWins")} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlayers.map((player) => {
              const matchesWon = winsByPlayerId.get(player.id) ?? 0;
              return <PlayerRow key={player.id} player={player} matchesWon={matchesWon} />;
            })}
          </TableBody>
          </Table>
        </div>

        <div className="grid gap-3 md:hidden">
          {filteredPlayers.map((player) => {
            const matchesWon = winsByPlayerId.get(player.id) ?? 0;
            return (
              <button
                key={player.id}
                type="button"
                className="relative cursor-pointer rounded-2xl border bg-white p-4 pr-28 text-left shadow-sm transition hover:border-primary/40 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setSelectedPlayer(player)}
              >
                <div className="absolute right-4 top-4">
                  <PaymentStatusBadge paid={player.hasPaid} />
                </div>
                <p className="font-semibold text-slate-950">{player.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Handicap {player.handicapIndex != null ? Number(player.handicapIndex).toFixed(1) : "TBD"}
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-700">Matches won: {matchesWon}</p>
              </button>
            );
          })}
        </div>
      </CardContent>

      <MobilePlayerEditDialog
        player={selectedPlayer}
        matchesWon={selectedPlayer ? winsByPlayerId.get(selectedPlayer.id) ?? 0 : 0}
        open={Boolean(selectedPlayer)}
        onOpenChange={(open) => !open && setSelectedPlayer(null)}
      />
    </Card>
  );
}

function SortableHead({
  label,
  active,
  align = "left",
  onClick,
}: {
  label: string;
  active: boolean;
  align?: "left" | "center";
  onClick: () => void;
}) {
  return (
    <TableHead className={align === "center" ? "text-center" : undefined}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex cursor-pointer items-center justify-center gap-1 font-semibold hover:text-primary"
      >
        {label}
        <ArrowDownUp className={active ? "h-3.5 w-3.5 text-primary" : "h-3.5 w-3.5 text-muted-foreground"} />
      </button>
    </TableHead>
  );
}

function PlayerRow({ player, matchesWon }: { player: Player; matchesWon: number }) {
  const [, startTransition] = useTransition();
  const [name, setName] = useState(player.name);
  const [handicapIndex, setHandicapIndex] = useState(player.handicapIndex ?? "");
  const [hasPaid, setHasPaid] = useState(player.hasPaid);
  const debounceRef = useRef<number | null>(null);
  const lastSavedRef = useRef({
    name: player.name,
    handicapIndex: String(player.handicapIndex ?? ""),
    hasPaid: player.hasPaid,
  });

  useEffect(() => {
    const next = {
      name: name.trim(),
      handicapIndex: handicapIndex.toString(),
      hasPaid,
    };

    if (
      next.name === lastSavedRef.current.name &&
      next.handicapIndex === lastSavedRef.current.handicapIndex &&
      next.hasPaid === lastSavedRef.current.hasPaid
    ) {
      return;
    }

    debounceRef.current = window.setTimeout(() => {
      startTransition(async () => {
        try {
          await updatePlayerAction({
            id: player.id,
            name: next.name,
            handicapIndex: next.handicapIndex || null,
            hasPaid: next.hasPaid,
            notes: player.notes,
          });
          lastSavedRef.current = next;
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Player update failed");
        }
      });
    }, 500);

    return () => {
      if (debounceRef.current != null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [name, handicapIndex, hasPaid, player.id, player.notes]);

  function togglePaid() {
    setHasPaid((value) => !value);
  }

  function saveOnBlur() {
    const next = {
      name: name.trim(),
      handicapIndex: handicapIndex.toString(),
      hasPaid,
    };

    if (
      next.name === lastSavedRef.current.name &&
      next.handicapIndex === lastSavedRef.current.handicapIndex &&
      next.hasPaid === lastSavedRef.current.hasPaid
    ) {
      return;
    }

    if (debounceRef.current != null) {
      window.clearTimeout(debounceRef.current);
    }

    startTransition(async () => {
      try {
        await updatePlayerAction({
          id: player.id,
          name: next.name,
          handicapIndex: next.handicapIndex || null,
          hasPaid: next.hasPaid,
          notes: player.notes,
        });
        lastSavedRef.current = next;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Player update failed");
      }
    });
  }

  return (
    <TableRow>
      <TableCell>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={saveOnBlur}
          className="max-w-56"
          aria-label={`${player.name} name`}
        />
      </TableCell>
      <TableCell className="min-w-32 text-center">
        <Input
          value={handicapIndex}
          onChange={(event) => setHandicapIndex(event.target.value)}
          onBlur={saveOnBlur}
          inputMode="decimal"
          className="mx-auto max-w-28 text-center"
          aria-label={`${player.name} handicap index`}
        />
      </TableCell>
      <TableCell className="text-center">
        <button type="button" className="cursor-pointer" onClick={togglePaid}>
          <PaymentStatusBadge paid={hasPaid} />
        </button>
      </TableCell>
      <TableCell className="text-center">{matchesWon}</TableCell>
    </TableRow>
  );
}

function MobilePlayerEditDialog({
  player,
  matchesWon,
  open,
  onOpenChange,
}: {
  player: Player | null;
  matchesWon: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!player) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>{player.name}</DialogTitle>
          <DialogDescription>Edit payment, handicap, and notes.</DialogDescription>
        </DialogHeader>
        <MobilePlayerEditForm
          key={player.id}
          player={player}
          matchesWon={matchesWon}
          onSaved={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function MobilePlayerEditForm({
  player,
  matchesWon,
  onSaved,
}: {
  player: Player;
  matchesWon: number;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(player.name);
  const [handicapIndex, setHandicapIndex] = useState(player.handicapIndex ?? "");
  const [hasPaid, setHasPaid] = useState(player.hasPaid);
  const [notes, setNotes] = useState(player.notes ?? "");

  function save() {
    startTransition(async () => {
      try {
        await updatePlayerAction({
          id: player.id,
          name: name.trim(),
          handicapIndex: handicapIndex.toString() || null,
          hasPaid,
          notes: notes.trim() || null,
        });
        toast.success(`${name.trim()} saved`);
        router.refresh();
        onSaved();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Player update failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border bg-slate-50 px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">Matches won</span>
        <span className="text-lg font-bold text-primary">{matchesWon}</span>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`mobile-name-${player.id}`}>Name</Label>
        <Input
          id={`mobile-name-${player.id}`}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`mobile-hcp-${player.id}`}>Handicap index</Label>
        <Input
          id={`mobile-hcp-${player.id}`}
          value={handicapIndex}
          onChange={(event) => setHandicapIndex(event.target.value)}
          inputMode="decimal"
        />
      </div>

      <div className="flex items-center justify-between gap-4 rounded-xl border bg-white px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">Payment</p>
          <p className="text-xs text-muted-foreground">Tap to toggle paid status.</p>
        </div>
        <button type="button" className="cursor-pointer" onClick={() => setHasPaid((value) => !value)}>
          <PaymentStatusBadge paid={hasPaid} />
        </button>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`mobile-notes-${player.id}`}>Notes</Label>
        <Textarea
          id={`mobile-notes-${player.id}`}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="rounded-xl border-slate-300 bg-white"
        />
      </div>

      <Button type="button" className="w-full rounded-xl" disabled={isPending} onClick={save}>
        {isPending ? "Saving..." : "Save player"}
      </Button>
    </div>
  );
}
