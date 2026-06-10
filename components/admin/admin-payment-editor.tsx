"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownUp, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import {
  refreshAllHandicapsAction,
  refreshPlayerHandicapAction,
  updatePlayerAction,
} from "@/actions/admin";
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
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [isRefreshingAll, startRefreshAllTransition] = useTransition();

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

  const selectedPlayer = useMemo(
    () => players.find((player) => player.id === selectedPlayerId) ?? null,
    [players, selectedPlayerId],
  );

  function updateSort(nextKey: SortKey) {
    if (nextKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection("asc");
  }

  function refreshAll() {
    startRefreshAllTransition(async () => {
      try {
        const result = await refreshAllHandicapsAction();
        toast.success(`GHIN refresh complete: ${result.updated}/${result.total} updated`);
        if (result.failed > 0) {
          toast.error(`${result.failed} GHIN ${result.failed === 1 ? "match needs" : "matches need"} attention`);
        }
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "GHIN refresh failed");
      }
    });
  }

  return (
    <Card className="rounded-2xl bg-white shadow-sm">
      <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Players</CardTitle>
        <div className="flex w-full flex-col gap-2 sm:max-w-xl sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-9"
              placeholder="Search players"
              aria-label="Search players"
            />
          </div>
          <Button type="button" variant="outline" disabled={isRefreshingAll} onClick={refreshAll}>
            <RefreshCw className={isRefreshingAll ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            {isRefreshingAll ? "Refreshing" : "Refresh GHIN"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="hidden overflow-x-auto md:block">
          <Table>
          <TableHeader>
            <TableRow>
              <SortableHead label="Player" active={sortKey === "name"} onClick={() => updateSort("name")} />
              <SortableHead label="Handicap" active={sortKey === "handicap"} align="center" onClick={() => updateSort("handicap")} />
              <TableHead className="min-w-32 text-center">GHIN #</TableHead>
              <TableHead className="min-w-20 text-center">State</TableHead>
              <TableHead className="min-w-28 text-center">Sync</TableHead>
              <SortableHead label="Paid" active={sortKey === "paid"} align="center" onClick={() => updateSort("paid")} />
              <SortableHead label="Matches Won" active={sortKey === "matchWins"} align="center" onClick={() => updateSort("matchWins")} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlayers.map((player) => {
              const matchesWon = winsByPlayerId.get(player.id) ?? 0;
              return (
                <PlayerRow
                  key={`${player.id}-${new Date(player.updatedAt).getTime()}`}
                  player={player}
                  matchesWon={matchesWon}
                />
              );
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
                onClick={() => setSelectedPlayerId(player.id)}
              >
                <div className="absolute right-4 top-4">
                  <PaymentStatusBadge paid={player.hasPaid} />
                </div>
                <p className="font-semibold text-slate-950">{player.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Handicap {player.handicapIndex != null ? Number(player.handicapIndex).toFixed(1) : "TBD"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  GHIN {player.ghinNumber || "TBD"} {player.ghinState ? `• ${player.ghinState}` : ""}
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
        onOpenChange={(open) => !open && setSelectedPlayerId(null)}
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
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [name, setName] = useState(player.name);
  const [handicapIndex, setHandicapIndex] = useState(player.handicapIndex ?? "");
  const [ghinNumber, setGhinNumber] = useState(player.ghinNumber ?? "");
  const [ghinState, setGhinState] = useState(player.ghinState ?? "");
  const ghinCountry = player.ghinCountry ?? "US";
  const [ghinAutoSync, setGhinAutoSync] = useState(player.ghinAutoSync);
  const [hasPaid, setHasPaid] = useState(player.hasPaid);
  const debounceRef = useRef<number | null>(null);
  const lastSavedRef = useRef({
    name: player.name,
    handicapIndex: String(player.handicapIndex ?? ""),
    ghinNumber: player.ghinNumber ?? "",
    ghinState: player.ghinState ?? "",
    ghinCountry: player.ghinCountry ?? "US",
    ghinAutoSync: player.ghinAutoSync,
    hasPaid: player.hasPaid,
  });

  useEffect(() => {
    const next = {
      name: name.trim(),
      handicapIndex: handicapIndex.toString(),
      ghinNumber: ghinNumber.trim(),
      ghinState: ghinState.trim().toUpperCase(),
      ghinCountry: ghinCountry.trim().toUpperCase() || "US",
      ghinAutoSync,
      hasPaid,
    };

    if (
      next.name === lastSavedRef.current.name &&
      next.handicapIndex === lastSavedRef.current.handicapIndex &&
      next.ghinNumber === lastSavedRef.current.ghinNumber &&
      next.ghinState === lastSavedRef.current.ghinState &&
      next.ghinCountry === lastSavedRef.current.ghinCountry &&
      next.ghinAutoSync === lastSavedRef.current.ghinAutoSync &&
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
            ghinNumber: next.ghinNumber || null,
            ghinState: next.ghinState || null,
            ghinCountry: next.ghinCountry || "US",
            ghinAutoSync: next.ghinAutoSync,
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
  }, [
    name,
    handicapIndex,
    ghinNumber,
    ghinState,
    ghinCountry,
    ghinAutoSync,
    hasPaid,
    player.id,
    player.notes,
  ]);

  function togglePaid() {
    setHasPaid((value) => !value);
  }

  function saveOnBlur() {
    const next = {
      name: name.trim(),
      handicapIndex: handicapIndex.toString(),
      ghinNumber: ghinNumber.trim(),
      ghinState: ghinState.trim().toUpperCase(),
      ghinCountry: ghinCountry.trim().toUpperCase() || "US",
      ghinAutoSync,
      hasPaid,
    };

    if (
      next.name === lastSavedRef.current.name &&
      next.handicapIndex === lastSavedRef.current.handicapIndex &&
      next.ghinNumber === lastSavedRef.current.ghinNumber &&
      next.ghinState === lastSavedRef.current.ghinState &&
      next.ghinCountry === lastSavedRef.current.ghinCountry &&
      next.ghinAutoSync === lastSavedRef.current.ghinAutoSync &&
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
          ghinNumber: next.ghinNumber || null,
          ghinState: next.ghinState || null,
          ghinCountry: next.ghinCountry || "US",
          ghinAutoSync: next.ghinAutoSync,
          hasPaid: next.hasPaid,
          notes: player.notes,
        });
        lastSavedRef.current = next;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Player update failed");
      }
    });
  }

  function refreshPlayer() {
    startRefreshTransition(async () => {
      try {
        const result = await refreshPlayerHandicapAction({ playerId: player.id });
        if (result.ok) {
          const nextHandicapIndex = String(result.handicapIndex ?? "");
          const nextGhinNumber = result.ghinNumber ?? "";
          setHandicapIndex(nextHandicapIndex);
          setGhinNumber(nextGhinNumber);
          lastSavedRef.current = {
            ...lastSavedRef.current,
            handicapIndex: nextHandicapIndex,
            ghinNumber: nextGhinNumber,
          };
          toast.success(`${player.name} updated from GHIN`);
        } else {
          toast.error(`${player.name}: ${result.message}`);
        }
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "GHIN refresh failed");
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
        <div className="flex items-center justify-center gap-2">
          <Input
            value={handicapIndex}
            onChange={(event) => setHandicapIndex(event.target.value)}
            onBlur={saveOnBlur}
            inputMode="decimal"
            className="max-w-24 text-center"
            aria-label={`${player.name} handicap index`}
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-9 w-9 shrink-0"
            disabled={isRefreshing}
            onClick={refreshPlayer}
            aria-label={`Refresh ${player.name} handicap from GHIN`}
            title="Refresh from GHIN"
          >
            <RefreshCw className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          </Button>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Input
          value={ghinNumber}
          onChange={(event) => setGhinNumber(event.target.value)}
          onBlur={saveOnBlur}
          inputMode="numeric"
          className="mx-auto max-w-28 text-center"
          aria-label={`${player.name} GHIN number`}
        />
      </TableCell>
      <TableCell className="text-center">
        <Input
          value={ghinState}
          onChange={(event) => setGhinState(event.target.value)}
          onBlur={saveOnBlur}
          className="mx-auto max-w-16 text-center uppercase"
          placeholder="MI"
          aria-label={`${player.name} GHIN state`}
        />
      </TableCell>
      <TableCell className="text-center">
        <div className="flex flex-col items-center gap-1">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={ghinAutoSync}
              onChange={(event) => setGhinAutoSync(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
              aria-label={`${player.name} GHIN auto sync`}
            />
            Auto
          </label>
          <span className={player.ghinError ? "max-w-28 truncate text-xs text-red-600" : "max-w-28 truncate text-xs text-muted-foreground"} title={player.ghinError ?? player.ghinStatus ?? undefined}>
            {player.ghinError || player.ghinStatus || "Not synced"}
          </span>
        </div>
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
      <DialogContent className="grid max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="shrink-0 px-6 pb-0 pt-6 pr-12">
          <DialogTitle>{player.name}</DialogTitle>
          <DialogDescription>Edit payment, handicap, and notes.</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto px-6 pb-6">
          <MobilePlayerEditForm
            key={`${player.id}-${new Date(player.updatedAt).getTime()}`}
            player={player}
            matchesWon={matchesWon}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MobilePlayerEditForm({
  player,
  matchesWon,
}: {
  player: Player;
  matchesWon: number;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [name, setName] = useState(player.name);
  const [handicapIndex, setHandicapIndex] = useState(player.handicapIndex ?? "");
  const [ghinNumber, setGhinNumber] = useState(player.ghinNumber ?? "");
  const [ghinState, setGhinState] = useState(player.ghinState ?? "");
  const [ghinAutoSync, setGhinAutoSync] = useState(player.ghinAutoSync);
  const [hasPaid, setHasPaid] = useState(player.hasPaid);
  const [notes, setNotes] = useState(player.notes ?? "");
  const debounceRef = useRef<number | null>(null);
  const lastSavedRef = useRef({
    name: player.name,
    handicapIndex: String(player.handicapIndex ?? ""),
    ghinNumber: player.ghinNumber ?? "",
    ghinState: player.ghinState ?? "",
    ghinAutoSync: player.ghinAutoSync,
    hasPaid: player.hasPaid,
    notes: player.notes ?? "",
  });

  useEffect(() => {
    const next = {
      name: name.trim(),
      handicapIndex: handicapIndex.toString(),
      ghinNumber: ghinNumber.trim(),
      ghinState: ghinState.trim().toUpperCase(),
      ghinAutoSync,
      hasPaid,
      notes: notes.trim(),
    };

    if (
      next.name === lastSavedRef.current.name &&
      next.handicapIndex === lastSavedRef.current.handicapIndex &&
      next.ghinNumber === lastSavedRef.current.ghinNumber &&
      next.ghinState === lastSavedRef.current.ghinState &&
      next.ghinAutoSync === lastSavedRef.current.ghinAutoSync &&
      next.hasPaid === lastSavedRef.current.hasPaid &&
      next.notes === lastSavedRef.current.notes
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
            ghinNumber: next.ghinNumber || null,
            ghinState: next.ghinState || null,
            ghinCountry: player.ghinCountry ?? "US",
            ghinAutoSync: next.ghinAutoSync,
            hasPaid: next.hasPaid,
            notes: next.notes || null,
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
  }, [
    name,
    handicapIndex,
    ghinNumber,
    ghinState,
    ghinAutoSync,
    hasPaid,
    notes,
    player.id,
    player.ghinCountry,
  ]);

  function refreshPlayer() {
    startRefreshTransition(async () => {
      try {
        const result = await refreshPlayerHandicapAction({ playerId: player.id });
        if (result.ok) {
          const nextHandicapIndex = String(result.handicapIndex ?? "");
          const nextGhinNumber = result.ghinNumber ?? "";
          setHandicapIndex(nextHandicapIndex);
          setGhinNumber(nextGhinNumber);
          lastSavedRef.current = {
            ...lastSavedRef.current,
            handicapIndex: nextHandicapIndex,
            ghinNumber: nextGhinNumber,
          };
          toast.success(`${player.name} updated from GHIN`);
        } else {
          toast.error(`${player.name}: ${result.message}`);
        }
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "GHIN refresh failed");
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
        <div className="flex gap-2">
          <Input
            id={`mobile-hcp-${player.id}`}
            value={handicapIndex}
            onChange={(event) => setHandicapIndex(event.target.value)}
            inputMode="decimal"
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="shrink-0"
            disabled={isRefreshing}
            onClick={refreshPlayer}
            aria-label={`Refresh ${player.name} handicap from GHIN`}
            title="Refresh from GHIN"
          >
            <RefreshCw className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`mobile-ghin-${player.id}`}>GHIN number</Label>
          <Input
            id={`mobile-ghin-${player.id}`}
            value={ghinNumber}
            onChange={(event) => setGhinNumber(event.target.value)}
            inputMode="numeric"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`mobile-ghin-state-${player.id}`}>GHIN state</Label>
          <Input
            id={`mobile-ghin-state-${player.id}`}
            value={ghinState}
            onChange={(event) => setGhinState(event.target.value)}
            className="uppercase"
            placeholder="MI"
          />
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={ghinAutoSync}
          onChange={(event) => setGhinAutoSync(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        Auto-sync from GHIN
      </label>

      <div className="rounded-xl border bg-slate-50 px-4 py-3 text-xs text-muted-foreground">
        <span className={player.ghinError ? "text-red-600" : undefined}>
          {player.ghinError || player.ghinStatus || "Not synced"}
        </span>
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

    </div>
  );
}
